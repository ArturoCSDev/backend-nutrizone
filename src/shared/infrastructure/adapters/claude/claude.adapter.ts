import { config } from '../../../config/environment';
import { logger } from '../../utils/logger.util';
import { 
  GeneratePlanInput, 
  PlanGeneradoOutput, 
  ClaudeRequest, 
  ClaudeResponse, 
  ClaudeError 
} from './claude.types';
import {
  ClaudeConnectionException,
  ClaudeTimeoutException,
  ClaudeParsingException,
  ClaudeApiException,
  ClaudeRateLimitException
} from './claude.exceptions';

export class ClaudeAdapter {
  private static readonly API_URL = 'https://api.anthropic.com/v1/messages';
  private static readonly API_KEY = config.CLAUDE_API_KEY;
  private static readonly MODEL = config.CLAUDE_MODEL;
  private static readonly MAX_TOKENS = config.CLAUDE_MAX_TOKENS;
  private static readonly TEMPERATURE = config.CLAUDE_TEMPERATURE;
  private static readonly TIMEOUT = config.CLAUDE_TIMEOUT;

  static async generateNutritionalPlan(input: GeneratePlanInput): Promise<PlanGeneradoOutput> {
    try {
      logger.info('Iniciando generación de plan nutricional con Claude', { 
        clienteId: input.cliente.id,
        objetivo: input.objetivo 
      });

      const prompt = this.buildNutritionalPlanPrompt(input);
      const response = await this.callClaude(prompt);
      const parsedPlan = this.parseNutritionalPlanResponse(response);

      logger.success('Plan nutricional generado exitosamente', { 
        clienteId: input.cliente.id,
        planNombre: parsedPlan.nombre,
        recomendaciones: parsedPlan.recomendaciones.length
      });

      return parsedPlan;
    } catch (error) {
      logger.error('Error generando plan nutricional', { 
        clienteId: input.cliente.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Re-lanzar si ya es una excepción personalizada
      if (error instanceof ClaudeConnectionException || 
          error instanceof ClaudeTimeoutException || 
          error instanceof ClaudeParsingException || 
          error instanceof ClaudeApiException ||
          error instanceof ClaudeRateLimitException) {
        throw error;
      }

      // Si es otro tipo de error, envolver en ClaudeConnectionException
      throw new ClaudeConnectionException(
        'Error inesperado al generar plan nutricional',
        { originalError: error instanceof Error ? error.message : error }
      );
    }
  }

  private static buildNutritionalPlanPrompt(input: GeneratePlanInput): string {
    const { cliente, preferencias, productosDisponibles, objetivo, duracionDias = 30 } = input;

    return `
Eres un nutricionista experto especializado en suplementación deportiva. Tu tarea es crear un plan nutricional personalizado basado en los siguientes datos:

**INFORMACIÓN DEL CLIENTE:**
- Nombre: ${cliente.nombre} ${cliente.apellidoPaterno}
- Edad: ${cliente.edad || 'No especificada'}
- Peso: ${cliente.peso || 'No especificado'} kg
- Altura: ${cliente.altura || 'No especificada'} cm
- Nivel de actividad: ${cliente.nivelActividad || 'No especificado'}
- Género: ${cliente.genero || 'No especificado'}
- Grasa corporal: ${cliente.grasaCorporal || 'No especificada'}%
- Masa muscular: ${cliente.masaMuscular || 'No especificada'} kg
- Metabolismo basal: ${cliente.metabolismoBasal || 'No especificado'} kcal

**OBJETIVO NUTRICIONAL:**
${objetivo}

**DURACIÓN DEL PLAN:**
${duracionDias} días

**PREFERENCIAS Y RESTRICCIONES:**
${preferencias ? `
- Productos favoritos: ${preferencias.productosFavoritos.join(', ') || 'Ninguno'}
- Preferencias dietéticas: ${preferencias.preferenciasDieteticas.join(', ') || 'Ninguna'}
- Alergenos: ${preferencias.alergenos.join(', ') || 'Ninguno'}
- Días de entrenamiento: ${preferencias.diasEntrenamiento.join(', ') || 'No especificado'}
- Horarios de entrenamiento: ${preferencias.horariosEntrenamiento.join(', ') || 'No especificado'}
- Hora de despertar: ${preferencias.horaDespertar || 'No especificada'}
- Hora de dormir: ${preferencias.horaDormir || 'No especificada'}
` : 'No se han especificado preferencias'}

**PRODUCTOS DISPONIBLES:**
${productosDisponibles.map(producto => `
- ${producto.nombre} (${producto.categoria}, ${producto.sabor}, ${producto.tamano})
  * Proteína: ${producto.proteina}g, Calorías: ${producto.calorias}kcal
  * Carbohidratos: ${producto.carbohidratos}g, Grasas: ${producto.grasas}g
  * Momentos recomendados: ${producto.momentosRecomendados.join(', ')}
  * Precio: S/. ${producto.precio}
  * ID: ${producto.id}
`).join('\n')}

**INSTRUCCIONES:**
1. Crea un plan nutricional personalizado de ${duracionDias} días
2. Calcula las necesidades calóricas y macronutrientes específicas
3. Selecciona los productos más adecuados de la lista disponible
4. Genera recomendaciones específicas con timing y dosificación
5. Prioriza las recomendaciones por importancia (ALTA, MEDIA, BAJA)

**FORMATO DE RESPUESTA REQUERIDO (JSON):**
\`\`\`json
{
  "nombre": "Nombre descriptivo del plan",
  "descripcion": "Descripción detallada del plan y su enfoque",
  "duracionDias": ${duracionDias},
  "objetivo": "${objetivo}",
  "caloriasObjetivo": 2500,
  "proteinaObjetivo": 150,
  "carbohidratosObjetivo": 300,
  "grasasObjetivo": 80,
  "instruccionesGenerales": "Instrucciones generales detalladas para seguir el plan...",
  "recomendaciones": [
    {
      "productoId": "id_del_producto",
      "tamanoId": "id_del_tamano_opcional",
      "tituloRecomendacion": "🎯 RECOMENDACIÓN INMEDIATA",
      "iconoProducto": "🥤",
      "timingRecomendado": "inmediato",
      "horarioEspecifico": "07:00",
      "timingAdicional": "MAÑANA: 30 min antes del desayuno",
      "prioridad": "ALTA",
      "razonamiento": "Explicación científica detallada de por qué esta recomendación es importante...",
      "dosis": "1 scoop (30g)",
      "frecuencia": "Diario"
    }
  ]
}
\`\`\`

Responde ÚNICAMENTE con el JSON válido, sin texto adicional antes o después.
`;
  }

  static async callClaude(prompt: string): Promise<string> {
    const requestBody: ClaudeRequest = {
      model: this.MODEL,
      max_tokens: this.MAX_TOKENS,
      temperature: this.TEMPERATURE,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      logger.debug('Enviando request a Claude API', { 
        model: this.MODEL,
        maxTokens: this.MAX_TOKENS,
        temperature: this.TEMPERATURE
      });

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: ClaudeError;
        try {
          errorData = (await response.json()) as ClaudeError;
        } catch (jsonError) {
          throw new ClaudeApiException(
            'Error inesperado al parsear la respuesta de error de Claude API',
            { statusCode: response.status, error: { message: String(jsonError) } }
          );
        }

        // Manejar diferentes tipos de errores HTTP
        if (response.status === 429) {
          throw new ClaudeRateLimitException(
            'Límite de peticiones excedido en Claude AI',
            { statusCode: response.status, error: errorData.error }
          );
        }

        if (response.status >= 500) {
          throw new ClaudeConnectionException(
            'Error del servidor en Claude AI',
            { statusCode: response.status, error: errorData.error }
          );
        }

        throw new ClaudeApiException(
          `Error en Claude API: ${errorData.error?.message ?? 'Error desconocido'}`,
          { statusCode: response.status, error: errorData.error }
        );
      }

      const data = await response.json() as ClaudeResponse;      
      
      logger.debug('Respuesta recibida de Claude API', {
        usage: data.usage,
        stopReason: data.stop_reason
      });

      return data.content[0].text;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ClaudeTimeoutException(
            'Timeout en la conexión con Claude AI',
            { timeout: this.TIMEOUT }
          );
        }
        
        // Re-lanzar excepciones personalizadas
        if (error instanceof ClaudeRateLimitException || 
            error instanceof ClaudeConnectionException || 
            error instanceof ClaudeApiException) {
          throw error;
        }
      }
      
      throw new ClaudeConnectionException(
        'Error de conexión con Claude AI',
        { originalError: error instanceof Error ? error.message : error }
      );
    }
  }

  private static parseNutritionalPlanResponse(response: string): PlanGeneradoOutput {
    try {
      logger.debug('Parseando respuesta de Claude');

      // Extraer JSON del response (en caso de que venga con markdown)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/({[\s\S]*})/);
      
      if (!jsonMatch) {
        throw new ClaudeParsingException(
          'No se encontró JSON válido en la respuesta de Claude',
          { response: response.substring(0, 500) }
        );
      }

      const jsonString = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonString);

      // Validar estructura básica
      if (!parsed.nombre || !parsed.descripcion || !parsed.recomendaciones) {
        throw new ClaudeParsingException(
          'Estructura de plan inválida en la respuesta de Claude',
          { missingFields: this.getMissingFields(parsed) }
        );
      }

      // Validar que recomendaciones sea un array
      if (!Array.isArray(parsed.recomendaciones)) {
        throw new ClaudeParsingException(
          'Las recomendaciones deben ser un array',
          { recomendacionesType: typeof parsed.recomendaciones }
        );
      }

      logger.success('Respuesta de Claude parseada correctamente', {
        recomendaciones: parsed.recomendaciones.length,
        objetivo: parsed.objetivo
      });

      return parsed as PlanGeneradoOutput;
    } catch (error) {
      if (error instanceof ClaudeParsingException) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw new ClaudeParsingException(
          'JSON inválido en la respuesta de Claude',
          { syntaxError: error.message, response: response.substring(0, 500) }
        );
      }

      throw new ClaudeParsingException(
        'Error inesperado al parsear la respuesta de Claude',
        { originalError: error instanceof Error ? error.message : error }
      );
    }
  }

  private static getMissingFields(parsed: any): string[] {
    const requiredFields = ['nombre', 'descripcion', 'recomendaciones'];
    return requiredFields.filter(field => !parsed[field]);
  }

  // Método para testing y debugging
  static async testConnection(): Promise<boolean> {
    try {
      logger.info('Probando conexión con Claude API');
      
      const response = await this.callClaude('Hello, respond with just "OK" if you can hear me.');
      const isOk = response.toLowerCase().includes('ok');
      
      if (isOk) {
        logger.success('Conexión con Claude API exitosa');
      } else {
        logger.warn('Conexión con Claude API inestable', { response });
      }
      
      return isOk;
    } catch (error) {
      logger.error('Prueba de conexión con Claude API falló', { error });
      return false;
    }
  }
}