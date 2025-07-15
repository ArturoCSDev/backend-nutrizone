import { ClaudeAdapter } from './claude.adapter';
import { ProductSearchResult } from '../../../../contexts/products/application/services/product-search.service';
import { Cliente } from '../../../../contexts/client/domain/models/cliente.model';
import { PreferenciaCliente } from '../../../../contexts/client/domain/models/preferencia-cliente.model';
import { PlanNutricional } from '../../../../contexts/nutrition-plans/domain/models/plan-nutricional.model';

export interface GenerateRecommendationInput {
  cliente: Cliente;
  preferencias: PreferenciaCliente;
  planActivo?: PlanNutricional;
  productosDisponibles: ProductSearchResult;
  contexto?: string;
  objetivoEspecifico?: string;
  momentoDelDia?: string;
}

export interface RecommendationOutput {
  recomendaciones: Array<{
    productoId: string;
    tamanoId?: string;
    tituloRecomendacion: string;
    iconoProducto: string;
    timingRecomendado: string;
    horarioEspecifico?: string;
    timingAdicional?: string;
    prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
    razonamiento: string;
    dosis: string;
    frecuencia: string;
    confianza: number; // 0-100
  }>;
  razonamientoGeneral: string;
  alternativas?: string[];
}

export class ClaudeRecommendationAdapter extends ClaudeAdapter {
  static async generateProductRecommendation(input: GenerateRecommendationInput): Promise<RecommendationOutput> {
    const prompt = this.buildRecommendationPrompt(input);
    const response = await this.callClaude(prompt);
    return this.parseRecommendationResponse(response);
  }

  private static buildRecommendationPrompt(input: GenerateRecommendationInput): string {
    const { cliente, preferencias, planActivo, productosDisponibles, contexto, objetivoEspecifico, momentoDelDia } = input;

    return `
Eres un nutricionista experto. Analiza el siguiente contexto y genera recomendaciones de productos específicas:

**CLIENTE:**
- Edad: ${cliente.edad || 'N/A'}, Peso: ${cliente.peso || 'N/A'}kg, Altura: ${cliente.altura || 'N/A'}cm
- Actividad: ${cliente.nivelActividad || 'N/A'}
- IMC: ${cliente.imc?.toFixed(1) || 'N/A'}

**PLAN ACTIVO:**
${planActivo ? `
- Objetivo: ${planActivo.objetivo}
- Calorías objetivo: ${planActivo.caloriasObjetivo || 'N/A'}
- Proteína objetivo: ${planActivo.proteinaObjetivo || 'N/A'}g
- Días restantes: ${planActivo.daysRemaining || 'N/A'}
` : 'Sin plan activo'}

**PREFERENCIAS:**
- Favoritos: ${preferencias.productosFavoritos.length > 0 ? 'Sí' : 'No'}
- Alergenos: ${preferencias.alergenos.join(', ') || 'Ninguno'}
- Objetivos: ${preferencias.objetivosFitness.join(', ')}
- Entrena: ${preferencias.diasEntrenamiento.join(', ')}

**CONTEXTO ACTUAL:**
- Momento: ${momentoDelDia || 'No especificado'}
- Situación: ${contexto || 'Consulta general'}
- Objetivo específico: ${objetivoEspecifico || 'Recomendación general'}

**PRODUCTOS DISPONIBLES (${productosDisponibles.totalEncontrados} encontrados):**
${productosDisponibles.productos.map(p => `
- ID: ${p.id}
- ${p.nombre} - S/. ${p.precio}
- Proteína: ${p.proteina}g, Calorías: ${p.calorias}kcal
- Momentos: ${p.momentosRecomendados.join(', ')}
- Ingredientes: ${p.ingredientes.slice(0, 3).join(', ')}${p.ingredientes.length > 3 ? '...' : ''}
`).join('')}

**FILTROS APLICADOS:** ${productosDisponibles.filtrosAplicados.join(', ')}

**INSTRUCCIONES:**
1. Analiza el contexto y necesidades del cliente
2. Selecciona 1-3 productos más relevantes
3. Justifica científicamente cada recomendación
4. Considera timing, dosificación y prioridades
5. Proporciona confianza en cada recomendación (0-100)

**RESPUESTA JSON:**
\`\`\`json
{
  "recomendaciones": [
    {
      "productoId": "id_producto",
      "tamanoId": "id_tamano_opcional",
      "tituloRecomendacion": "🎯 RECOMENDACIÓN ESPECÍFICA",
      "iconoProducto": "🥤",
      "timingRecomendado": "inmediato|mañana|tarde|noche",
      "horarioEspecifico": "07:30",
      "timingAdicional": "30 min antes del desayuno",
      "prioridad": "ALTA",
      "razonamiento": "Análisis detallado...",
      "dosis": "1 scoop (30g)",
      "frecuencia": "Diario",
      "confianza": 95
    }
  ],
  "razonamientoGeneral": "Análisis general de las recomendaciones...",
  "alternativas": ["Sugerencia 1", "Sugerencia 2"]
}
\`\`\`
`;
  }

  private static parseRecommendationResponse(response: string): RecommendationOutput {
    // Similar al parsing del plan, pero adaptado para recomendaciones
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/({[\s\S]*})/);
    
    if (!jsonMatch) {
      throw new Error('No se encontró JSON válido en la respuesta');
    }

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    return parsed as RecommendationOutput;
  }
}