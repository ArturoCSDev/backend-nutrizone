// src/shared/infrastructure/adapters/claude/claude-mcp.adapter.ts
import { ClaudeAdapter } from './claude.adapter';
import { logger } from '../../utils/logger.util';
import { prisma } from '../prisma/prisma.client';

export interface MCPClaudeInput {
  clienteId: string;
  contexto?: string;
  objetivoEspecifico?: string;
  momentoDelDia?: string;
  soloFavoritos?: boolean;
  precioMaximo?: number;
  productosDisponibles?: any[]; // ✅ NUEVO: productos reales de la BD
}

export class ClaudeMCPAdapter extends ClaudeAdapter {
  static async generateRecommendationWithMCP(input: MCPClaudeInput) {
    try {
      logger.info('Generando recomendación usando MCP Server mejorado', {
        clienteId: input.clienteId,
        contexto: input.contexto,
        productosDisponibles: input.productosDisponibles?.length || 0
      });

      // ✅ PASO 1: Obtener datos reales del cliente y productos
      const clienteData = await this.getClienteDataFromDB(input.clienteId);
      const productosData = await this.getProductosDataFromDB(input);

      // ✅ PASO 2: Construir prompt enriquecido con datos reales
      const prompt = this.buildEnhancedMCPPrompt(input, clienteData, productosData);
      
      // ✅ PASO 3: Llamar a Claude con datos reales
      const response = await this.callClaude(prompt);
      
      // ✅ PASO 4: Parsear y validar respuesta
      const parsedResponse = await this.parseAndValidateResponse(response, productosData);
      
      return parsedResponse;
    } catch (error) {
      logger.error('Error en ClaudeMCPAdapter mejorado', {
        clienteId: input.clienteId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // ✅ Fallback inteligente con productos reales
      return this.generateIntelligentFallback(input);
    }
  }

  // ✅ NUEVO: Obtener datos reales del cliente desde BD
  private static async getClienteDataFromDB(clienteId: string) {
    try {
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        include: {
          cliente: true // Usuario relacionado
        }
      });

      const preferencias = await prisma.preferenciaCliente.findUnique({
        where: { clienteId }
      });

      const planActivo = await prisma.planNutricional.findFirst({
        where: {
          clienteId,
          estado: 'ACTIVO'
        }
      });

      return {
        cliente: cliente ? {
          id: cliente.id,
          nombre: cliente.cliente.nombre,
          apellidoPaterno: cliente.cliente.apellidoPaterno,
          edad: cliente.edad,
          peso: cliente.peso,
          altura: cliente.altura,
          nivelActividad: cliente.nivelActividad,
          genero: cliente.genero,
          imc: cliente.peso && cliente.altura
          ? (Number(cliente.peso) / Math.pow(Number(cliente.altura) / 100, 2)).toFixed(1)
          : null,
          grasaCorporal: cliente.grasaCorporal,
          masaMuscular: cliente.masaMuscular,
          metabolismoBasal: cliente.metabolismoBasal
        } : null,
        preferencias: preferencias ? {
          productosFavoritos: preferencias.productosFavoritos,
          alergenos: preferencias.alergenos,
          objetivosFitness: preferencias.objetivosFitness,
          diasEntrenamiento: preferencias.diasEntrenamiento,
          horariosEntrenamiento: preferencias.horariosEntrenamiento,
          preferenciasDieteticas: preferencias.preferenciasDieteticas
        } : null,
        planActivo: planActivo ? {
          id: planActivo.id,
          nombre: planActivo.nombre,
          objetivo: planActivo.objetivo,
          caloriasObjetivo: planActivo.caloriasObjetivo,
          proteinaObjetivo: planActivo.proteinaObjetivo,
          carbohidratosObjetivo: planActivo.carbohidratosObjetivo,
          grasasObjetivo: planActivo.grasasObjetivo,
          diasRestantes: planActivo.fechaFin ? 
            Math.ceil((planActivo.fechaFin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
        } : null
      };
    } catch (error) {
      logger.error('Error obteniendo datos del cliente', { clienteId, error });
      return { cliente: null, preferencias: null, planActivo: null };
    }
  }

  // ✅ NUEVO: Obtener productos reales filtrados
  private static async getProductosDataFromDB(input: MCPClaudeInput) {
    try {
      // Si ya tenemos productos disponibles, usarlos
      if (input.productosDisponibles && input.productosDisponibles.length > 0) {
        return this.filterProductsByContext(input.productosDisponibles, input);
      }

      // Si no, obtener desde BD
      let whereClause: any = {};

      // Filtrar por precio máximo
      if (input.precioMaximo) {
        whereClause.precio = { lte: input.precioMaximo };
      }

      // Filtrar por momento del día
      if (input.momentoDelDia) {
        whereClause.momentosRecomendados = {
          has: input.momentoDelDia.toUpperCase()
        };
      }

      const productos = await prisma.producto.findMany({
        where: whereClause,
        include: {
          categoria: true,
          sabor: true,
          tamano: true
        },
        orderBy: [
          { proteina: 'desc' }, // Priorizar productos con más proteína
          { precio: 'asc' }
        ],
        take: 10 // Limitar para mejor rendimiento
      });

      return this.filterProductsByContext(productos, input);
    } catch (error) {
      logger.error('Error obteniendo productos desde BD', { error });
      return { productos: [], filtrosAplicados: [], totalEncontrados: 0 };
    }
  }

  // ✅ NUEVO: Filtrar productos por contexto
  private static filterProductsByContext(productos: any[], input: MCPClaudeInput) {
    let productosFiltrados = [...productos];

    // Filtros adicionales basados en contexto
    if (input.contexto) {
      const contextoLower = input.contexto.toLowerCase();
      
      // Filtrar por contexto específico
      if (contextoLower.includes('entrenamiento')) {
        productosFiltrados = productosFiltrados.filter(p => 
          p.proteina > 15 || // Productos con buena proteína
          p.momentosRecomendados?.includes('POST_ENTRENAMIENTO') ||
          p.momentosRecomendados?.includes('PRE_ENTRENAMIENTO')
        );
      }
      
      if (contextoLower.includes('desayuno') || contextoLower.includes('mañana')) {
        productosFiltrados = productosFiltrados.filter(p => 
          p.momentosRecomendados?.includes('MANANA') ||
          p.categoria?.nombre?.toLowerCase().includes('batido')
        );
      }
      
      if (contextoLower.includes('energia')) {
        productosFiltrados = productosFiltrados.filter(p => 
          p.calorias > 100 || p.carbohidratos > 15
        );
      }
    }

    const filtrosAplicados = [
      input.momentoDelDia && `Momento: ${input.momentoDelDia}`,
      input.precioMaximo && `Precio máximo: S/. ${input.precioMaximo}`,
      input.soloFavoritos && 'Solo favoritos',
      input.contexto && `Contexto: ${input.contexto}`
    ].filter(Boolean);

    return {
      productos: productosFiltrados,
      filtrosAplicados,
      totalEncontrados: productosFiltrados.length
    };
  }

  // ✅ MEJORADO: Prompt más inteligente con datos reales
  private static buildEnhancedMCPPrompt(
    input: MCPClaudeInput, 
    clienteData: any, 
    productosData: any
  ): string {
    return `
Eres un nutricionista experto especializado en suplementación deportiva. Analiza los datos reales del cliente y genera recomendaciones personalizadas.

**DATOS REALES DEL CLIENTE:**
${clienteData.cliente ? `
- Nombre: ${clienteData.cliente.nombre} ${clienteData.cliente.apellidoPaterno}
- Edad: ${clienteData.cliente.edad || 'N/A'} años
- Peso: ${clienteData.cliente.peso || 'N/A'} kg
- Altura: ${clienteData.cliente.altura || 'N/A'} cm
- IMC: ${clienteData.cliente.imc || 'N/A'}
- Nivel de actividad: ${clienteData.cliente.nivelActividad || 'N/A'}
- Género: ${clienteData.cliente.genero || 'N/A'}
- Grasa corporal: ${clienteData.cliente.grasaCorporal || 'N/A'}%
- Masa muscular: ${clienteData.cliente.masaMuscular || 'N/A'} kg
- Metabolismo basal: ${clienteData.cliente.metabolismoBasal || 'N/A'} kcal
` : 'Cliente no encontrado'}

**PREFERENCIAS DEL CLIENTE:**
${clienteData.preferencias ? `
- Objetivos fitness: ${clienteData.preferencias.objetivosFitness?.join(', ') || 'No especificado'}
- Días de entrenamiento: ${clienteData.preferencias.diasEntrenamiento?.join(', ') || 'No especificado'}
- Horarios de entrenamiento: ${clienteData.preferencias.horariosEntrenamiento?.join(', ') || 'No especificado'}
- Productos favoritos: ${clienteData.preferencias.productosFavoritos?.length || 0} productos
- Alergenos: ${clienteData.preferencias.alergenos?.join(', ') || 'Ninguno'}
- Preferencias dietéticas: ${clienteData.preferencias.preferenciasDieteticas?.join(', ') || 'Ninguna'}
` : 'Preferencias no configuradas'}

**PLAN NUTRICIONAL ACTIVO:**
${clienteData.planActivo ? `
- Nombre: ${clienteData.planActivo.nombre}
- Objetivo: ${clienteData.planActivo.objetivo}
- Calorías objetivo: ${clienteData.planActivo.caloriasObjetivo || 'N/A'} kcal
- Proteína objetivo: ${clienteData.planActivo.proteinaObjetivo || 'N/A'} g
- Carbohidratos objetivo: ${clienteData.planActivo.carbohidratosObjetivo || 'N/A'} g
- Grasas objetivo: ${clienteData.planActivo.grasasObjetivo || 'N/A'} g
- Días restantes: ${clienteData.planActivo.diasRestantes || 'N/A'}
` : 'Sin plan activo'}

**CONTEXTO DE LA CONSULTA:**
- Contexto: ${input.contexto || 'Consulta general'}
- Objetivo específico: ${input.objetivoEspecifico || 'Recomendación personalizada'}
- Momento del día: ${input.momentoDelDia || 'Cualquier momento'}
- Solo favoritos: ${input.soloFavoritos ? 'Sí' : 'No'}
- Precio máximo: ${input.precioMaximo ? `S/. ${input.precioMaximo}` : 'Sin límite'}

**PRODUCTOS REALES DISPONIBLES (${productosData.totalEncontrados} encontrados):**
${productosData.productos.map((p: any, index: number) => `
${index + 1}. **${p.nombre}** (ID: ${p.id})
   - Categoría: ${p.categoria?.nombre || 'Sin categoría'}
   - Sabor: ${p.sabor?.nombre || 'Sin sabor'}
   - Tamaño: ${p.tamano?.nombre || 'Sin tamaño'}
   - Precio: S/. ${p.precio || 0}
   - Proteína: ${p.proteina || 0}g | Calorías: ${p.calorias || 0}kcal
   - Carbohidratos: ${p.carbohidratos || 0}g | Grasas: ${p.grasas || 0}g
   - Fibra: ${p.fibra || 0}g | Azúcar: ${p.azucar || 0}g
   - Momentos recomendados: ${p.momentosRecomendados?.join(', ') || 'Cualquier momento'}
   - Ingredientes: ${p.ingredientes?.slice(0, 3).join(', ') || 'No especificado'}${p.ingredientes?.length > 3 ? '...' : ''}
`).join('')}

**FILTROS APLICADOS:** ${productosData.filtrosAplicados.join(', ') || 'Ninguno'}

**INSTRUCCIONES ESPECÍFICAS:**
1. **ANÁLISIS NUTRICIONAL:** Evalúa las necesidades del cliente basándote en su perfil físico, objetivos y plan actual
2. **SELECCIÓN INTELIGENTE:** Elige 1-3 productos que mejor se alineen con el contexto y objetivos
3. **PERSONALIZACIÓN:** Considera momento del día, preferencias y restricciones
4. **JUSTIFICACIÓN CIENTÍFICA:** Explica el razonamiento nutricional de cada recomendación
5. **DOSIFICACIÓN PRECISA:** Proporciona dosis específicas según el producto y objetivos
6. **PRIORIZACIÓN:** Ordena por importancia (ALTA, MEDIA, BAJA)

**IMPORTANTE:** 
- Usa SOLO los IDs de productos listados arriba
- Considera el perfil nutricional completo del cliente
- Ajusta las recomendaciones al contexto específico
- Proporciona razonamiento científico detallado

**FORMATO DE RESPUESTA JSON:**
\`\`\`json
{
  "recomendaciones": [
    {
      "productoId": "id_producto_exacto_de_la_lista",
      "tituloRecomendacion": "🎯 RECOMENDACIÓN PERSONALIZADA Y ESPECÍFICA",
      "iconoProducto": "🥤",
      "timingRecomendado": "INMEDIATO",
      "prioridad": "ALTA",
      "razonamiento": "Análisis detallado considerando el perfil del cliente, sus objetivos nutricionales, plan actual y contexto específico. Explica por qué este producto es ideal para sus necesidades...",
      "dosis": "1 scoop (30g) - ajustado según peso y objetivos",
      "frecuencia": "Diario post-entrenamiento",
      "beneficiosEspecificos": [
        "Beneficio 1 específico para el cliente",
        "Beneficio 2 basado en su perfil",
        "Beneficio 3 para sus objetivos"
      ],
      "contraindicaciones": "Ninguna conocida según el perfil del cliente",
      "valorNutricional": {
        "proteinaPorPorcion": 25,
        "caloriasPorPorcion": 120,
        "costoPorPorcion": 2.99,
        "densidadProteica": 83.3
      }
    }
  ],
  "razonamientoGeneral": "Análisis integral del perfil nutricional del cliente y cómo estas recomendaciones se alinean con sus objetivos específicos, plan actual y contexto de consulta...",
  "recomendacionesAdicionales": [
    "Sugerencia 1 para optimizar resultados",
    "Sugerencia 2 sobre timing y combinaciones",
    "Sugerencia 3 sobre seguimiento y ajustes"
  ],
  "alertas": [
    "Alerta 1 si aplica según el perfil",
    "Alerta 2 sobre posibles interacciones"
  ],
  "metadatos": {
    "clienteAnalizado": true,
    "productosValidados": ${productosData.totalEncontrados},
    "contextoConsiderado": "${input.contexto || 'general'}",
    "recomendacionesPersonalizadas": true
  }
}
\`\`\`

Genera recomendaciones precisas y personalizadas basadas en el análisis completo del cliente.
`;
  }

  // ✅ NUEVO: Parsear y validar respuesta mejorada
  private static async parseAndValidateResponse(response: string, productosData: any) {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/({[\s\S]*})/);
      
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // ✅ Validar estructura mínima
      if (!parsed.recomendaciones || !Array.isArray(parsed.recomendaciones)) {
        throw new Error('Estructura de respuesta inválida');
      }

      // ✅ Validar que todos los productos existen
      const productosIdsDisponibles = new Set(productosData.productos.map((p: any) => p.id));
      const recomendacionesValidas = parsed.recomendaciones.filter((rec: any) => {
        const esValido = productosIdsDisponibles.has(rec.productoId);
        if (!esValido) {
          logger.warn('Producto no encontrado en recomendación', {
            productoId: rec.productoId,
            disponibles: Array.from(productosIdsDisponibles)
          });
        }
        return esValido;
      });

      // ✅ Enriquecer recomendaciones con datos del producto
      const recomendacionesEnriquecidas = recomendacionesValidas.map((rec: any) => {
        const producto = productosData.productos.find((p: any) => p.id === rec.productoId);
        return {
          ...rec,
          productoInfo: producto ? {
            nombre: producto.nombre,
            categoria: producto.categoria?.nombre,
            sabor: producto.sabor?.nombre,
            precio: producto.precio,
            proteina: producto.proteina,
            calorias: producto.calorias,
            disponible: true
          } : null
        };
      });

      return {
        ...parsed,
        recomendaciones: recomendacionesEnriquecidas,
        metadatos: {
          ...parsed.metadatos,
          recomendacionesOriginales: parsed.recomendaciones.length,
          recomendacionesValidas: recomendacionesEnriquecidas.length,
          recomendacionesDescartadas: parsed.recomendaciones.length - recomendacionesEnriquecidas.length,
          productosAnalizados: productosData.totalEncontrados
        }
      };
    } catch (error) {
      logger.error('Error parseando respuesta MCP mejorada', { error });
      throw error;
    }
  }

  // ✅ MEJORADO: Fallback más inteligente
  private static async generateIntelligentFallback(input: MCPClaudeInput) {
    try {
      // Obtener al menos un producto real disponible
      const productosData = await this.getProductosDataFromDB(input);
      
      if (productosData.productos.length === 0) {
        throw new Error('No hay productos disponibles para generar fallback');
      }

      // Seleccionar el mejor producto según contexto
      const productoSeleccionado = this.selectBestProductForContext(productosData.productos, input);
      
      return {
        recomendaciones: [
          {
            productoId: productoSeleccionado.id,
            tituloRecomendacion: `🎯 ${productoSeleccionado.nombre} - Recomendación Inteligente`,
            iconoProducto: '🥤',
            timingRecomendado: this.getTimingFromContext(input.contexto),
            prioridad: 'MEDIA',
            razonamiento: `Recomendación inteligente basada en ${input.contexto || 'análisis general'}. ${productoSeleccionado.nombre} ofrece ${productoSeleccionado.proteina || 0}g de proteína y ${productoSeleccionado.calorias || 0} calorías, ideal para ${input.objetivoEspecifico || 'tus objetivos nutricionales'}.`,
            dosis: '1 porción según indicaciones',
            frecuencia: 'Diario',
            beneficiosEspecificos: [
              `Aporta ${productoSeleccionado.proteina || 0}g de proteína de calidad`,
              `Proporciona ${productoSeleccionado.calorias || 0} calorías controladas`,
              `Excelente relación calidad-precio a S/. ${productoSeleccionado.precio || 0}`
            ],
            valorNutricional: {
              proteinaPorPorcion: productoSeleccionado.proteina || 0,
              caloriasPorPorcion: productoSeleccionado.calorias || 0,
              costoPorPorcion: productoSeleccionado.precio ? (productoSeleccionado.precio / 30).toFixed(2) : '0.00',
              densidadProteica: productoSeleccionado.calorias > 0 ? 
                ((productoSeleccionado.proteina || 0) / productoSeleccionado.calorias * 100).toFixed(1) : 0
            },
            productoInfo: {
              nombre: productoSeleccionado.nombre,
              categoria: productoSeleccionado.categoria?.nombre,
              sabor: productoSeleccionado.sabor?.nombre,
              precio: productoSeleccionado.precio,
              proteina: productoSeleccionado.proteina,
              calorias: productoSeleccionado.calorias,
              disponible: true
            }
          }
        ],
        razonamientoGeneral: `Sistema de respaldo inteligente activado. Hemos seleccionado ${productoSeleccionado.nombre} como la mejor opción disponible considerando tu contexto específico y objetivos nutricionales.`,
        recomendacionesAdicionales: [
          'Considera consultar con un nutricionista para recomendaciones más específicas',
          'Mantén una alimentación balanceada complementaria',
          'Ajusta las dosis según tu tolerancia y objetivos'
        ],
        metadatos: {
          fallback: true,
          productosAnalizados: productosData.totalEncontrados,
          productoSeleccionado: {
            id: productoSeleccionado.id,
            nombre: productoSeleccionado.nombre,
            razon: 'Mejor opción disponible según contexto'
          }
        }
      };
    } catch (error) {
      logger.error('Error en fallback inteligente', { error });
      
      // Fallback del fallback
      return {
        recomendaciones: [
          {
            productoId: 'fallback-emergency',
            tituloRecomendacion: '🎯 Consulta Personalizada Recomendada',
            iconoProducto: '👨‍⚕️',
            timingRecomendado: 'INMEDIATO',
            prioridad: 'ALTA',
            razonamiento: 'No se pudieron cargar productos específicos. Recomendamos una consulta personalizada para obtener recomendaciones precisas según tu perfil nutricional.',
            dosis: 'Consulta requerida',
            frecuencia: 'Según evaluación profesional',
            beneficiosEspecificos: [
              'Evaluación nutricional completa',
              'Recomendaciones personalizadas',
              'Seguimiento profesional'
            ]
          }
        ],
        razonamientoGeneral: 'Sistema de emergencia activado. Para obtener las mejores recomendaciones, programa una consulta personalizada.',
        metadatos: {
          fallback: true,
          emergency: true,
          requiresConsultation: true
        }
      };
    }
  }

  // ✅ NUEVO: Seleccionar mejor producto según contexto
  private static selectBestProductForContext(productos: any[], input: MCPClaudeInput) {
    const contexto = input.contexto?.toLowerCase() || '';
    const objetivo = input.objetivoEspecifico?.toLowerCase() || '';

    // Priorizar según contexto
    let puntuaciones = productos.map(producto => {
      let puntuacion = 0;
      
      // Puntuación base por proteína
      puntuacion += (producto.proteina || 0) * 2;
      
      // Puntuación por contexto
      if (contexto.includes('entrenamiento')) {
        if (producto.proteina > 20) puntuacion += 10;
        if (producto.momentosRecomendados?.includes('POST_ENTRENAMIENTO')) puntuacion += 5;
      }
      
      if (contexto.includes('mañana') || contexto.includes('desayuno')) {
        if (producto.momentosRecomendados?.includes('MANANA')) puntuacion += 5;
        if (producto.categoria?.nombre?.toLowerCase().includes('batido')) puntuacion += 3;
      }
      
      if (objetivo.includes('energia')) {
        puntuacion += (producto.calorias || 0) * 0.1;
        puntuacion += (producto.carbohidratos || 0) * 0.5;
      }
      
      if (objetivo.includes('proteina') || objetivo.includes('muscular')) {
        puntuacion += (producto.proteina || 0) * 3;
      }
      
      // Penalizar precios altos si hay límite
      if (input.precioMaximo && producto.precio > input.precioMaximo) {
        puntuacion -= 5;
      }
      
      return { producto, puntuacion };
    });

    // Ordenar por puntuación y retornar el mejor
    puntuaciones.sort((a, b) => b.puntuacion - a.puntuacion);
    return puntuaciones[0].producto;
  }

  // ✅ HELPER: Obtener timing del contexto
  private static getTimingFromContext(contexto?: string): string {
    if (!contexto) return 'INMEDIATO';
    
    const ctx = contexto.toLowerCase();
    if (ctx.includes('mañana') || ctx.includes('desayuno')) return 'MANANA';
    if (ctx.includes('entrenamiento') || ctx.includes('ejercicio')) return 'POST_ENTRENAMIENTO';
    if (ctx.includes('almuerzo') || ctx.includes('tarde')) return 'TARDE';
    if (ctx.includes('noche') || ctx.includes('cena')) return 'NOCHE';
    
    return 'INMEDIATO';
  }
}