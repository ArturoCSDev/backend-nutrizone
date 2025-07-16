// src/contexts/nutrition-plans/application/create-recommendation/create-recommendation.use-case.ts
import { CreateRecommendationDto } from './create-recommendation.dto';
import { ClaudeMCPAdapter } from '../../../../shared/infrastructure/adapters/claude/claude-mcp.adapter';
import { RecomendacionNutricionalRepository } from '../../domain/repositories/recomendacion-nutricional.repository';
import { ProductoRepository } from '../../../products/domain/repositories/producto.repository';
import { RecomendacionNutricional } from '../../domain/models/recomendacion-nutricional.model';
import { RespuestaUsuario } from '@prisma/client';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';

export class CreateRecommendationMCPUseCase {
  constructor(
    private readonly recomendacionRepository: RecomendacionNutricionalRepository,
    private readonly productoRepository: ProductoRepository
  ) {}

  async execute(dto: CreateRecommendationDto) {
    const startTime = Date.now();

    try {
      logger.info('Ejecutando CreateRecommendationMCPUseCase', {
        clienteId: dto.clienteId,
        contexto: dto.contexto,
        objetivoEspecifico: dto.objetivoEspecifico
      });

      // ✅ OBTENER PRODUCTOS REALES DISPONIBLES
      const productosDisponibles = await this.productoRepository.findMany();
      
      if (productosDisponibles.length === 0) {
        throw new Error('No hay productos disponibles en la base de datos');
      }

      logger.info('Productos disponibles obtenidos', {
        total: productosDisponibles.length,
        productos: productosDisponibles.map(p => ({ id: p.id, nombre: p.nombre }))
      });

      // ✅ INTENTAR GENERAR CON CLAUDE MCP
      let claudeResult;
      try {
        claudeResult = await ClaudeMCPAdapter.generateRecommendationWithMCP({
          clienteId: dto.clienteId,
          contexto: dto.contexto,
          objetivoEspecifico: dto.objetivoEspecifico,
          momentoDelDia: dto.momentoDelDia,
          soloFavoritos: dto.soloFavoritos,
          precioMaximo: 100
        });
      } catch (claudeError) {
        logger.warn('Error en Claude MCP, usando fallback inteligente', { claudeError });
        claudeResult = this.generateIntelligentFallback(dto, productosDisponibles);
      }

      // ✅ VALIDAR QUE TODOS LOS PRODUCTOS EXISTEN
      const productosIds = claudeResult.recomendaciones.map((rec: any) => rec.productoId);
      const productosExistentes = await this.productoRepository.findByIds(productosIds);
      const idsExistentes = new Set(productosExistentes.map(p => p.id));

      logger.info('Validación de productos', {
        productosRequeridos: productosIds.length,
        productosEncontrados: productosExistentes.length,
        productosIds,
        idsExistentes: Array.from(idsExistentes)
      });

      // ✅ SI NO HAY PRODUCTOS VÁLIDOS, USAR FALLBACK INTELIGENTE
      let recomendacionesValidas = claudeResult.recomendaciones.filter((rec: any) => {
        const esValido = idsExistentes.has(rec.productoId);
        if (!esValido) {
          logger.warn('Producto no encontrado para recomendación', {
            productoId: rec.productoId,
            tituloRecomendacion: rec.tituloRecomendacion
          });
        }
        return esValido;
      });

      // ✅ FALLBACK INTELIGENTE SI NO HAY RECOMENDACIONES VÁLIDAS
      if (recomendacionesValidas.length === 0) {
        logger.warn('No se encontraron recomendaciones válidas, generando fallback inteligente');
        const fallbackResult = this.generateIntelligentFallback(dto, productosDisponibles);
        recomendacionesValidas = fallbackResult.recomendaciones;
        claudeResult.razonamientoGeneral = fallbackResult.razonamientoGeneral;
        claudeResult.metadatos = { ...claudeResult.metadatos, fallback: true };
      }

      logger.info('Recomendaciones después de validación', {
        original: claudeResult.recomendaciones.length,
        validas: recomendacionesValidas.length,
        descartadas: claudeResult.recomendaciones.length - recomendacionesValidas.length
      });

      // ✅ Crear objetos de dominio solo con productos válidos
      const recomendaciones = recomendacionesValidas.map((rec: any) => 
        RecomendacionNutricional.create({
          mensajeId: null,
          productoId: rec.productoId,
          tamanoId: null,
          planId: dto.planId || null,
          tituloRecomendacion: rec.tituloRecomendacion,
          iconoProducto: rec.iconoProducto,
          timingRecomendado: rec.timingRecomendado,
          horarioEspecifico: null,
          timingAdicional: null,
          prioridad: rec.prioridad as any,
          razonamiento: rec.razonamiento,
          dosis: rec.dosis,
          frecuencia: rec.frecuencia,
          respuestaUsuario: RespuestaUsuario.PENDIENTE,
          timingModificado: null
        })
      );

      // ✅ Guardar recomendaciones válidas
      const savedRecomendaciones = await this.recomendacionRepository.saveMany(recomendaciones);

      // ✅ ENRIQUECER RECOMENDACIONES CON DATOS COMPLETOS DEL PRODUCTO
      const recomendacionesEnriquecidas = await this.enrichRecommendationsWithProductData(
        savedRecomendaciones, 
        productosExistentes
      );

      const processingTime = Date.now() - startTime;

      logger.success('Recomendaciones MCP generadas exitosamente', {
        clienteId: dto.clienteId,
        recomendacionesGeneradas: savedRecomendaciones.length,
        recomendacionesDescartadas: claudeResult.recomendaciones.length - savedRecomendaciones.length,
        processingTime,
        usedFallback: claudeResult.metadatos?.fallback || false
      });

      return {
        recomendaciones: recomendacionesEnriquecidas, // ✅ Usar recomendaciones enriquecidas
        razonamientoGeneral: claudeResult.razonamientoGeneral,
        metadatos: {
          processingTime,
          usedMCP: true,
          fallback: claudeResult.metadatos?.fallback || false,
          productosValidados: productosExistentes.length,
          recomendacionesOriginales: claudeResult.recomendaciones.length,
          recomendacionesValidas: savedRecomendaciones.length
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Error en CreateRecommendationMCPUseCase', {
        clienteId: dto.clienteId,
        error: errorMessage
      });

      throw new Error(`Error generando recomendaciones MCP: ${errorMessage}`);
    }
  }

  // ✅ NUEVO MÉTODO: Enriquecer recomendaciones con datos completos del producto
  private async enrichRecommendationsWithProductData(
    recomendaciones: RecomendacionNutricional[], 
    productosExistentes: any[]
  ) {
    const productosMap = new Map();
    productosExistentes.forEach(producto => {
      productosMap.set(producto.id, producto);
    });

    return recomendaciones.map(recomendacion => {
      const producto = productosMap.get(recomendacion.productoId);
      
      if (!producto) {
        logger.warn('Producto no encontrado para enriquecer recomendación', {
          productoId: recomendacion.productoId
        });
        return recomendacion;
      }

      return {
        id: recomendacion.id,
        productoId: recomendacion.productoId,
        tamanoId: recomendacion.tamanoId,
        planId: recomendacion.planId,
        tituloRecomendacion: recomendacion.tituloRecomendacion,
        iconoProducto: recomendacion.iconoProducto,
        timingRecomendado: recomendacion.timingRecomendado,
        horarioEspecifico: recomendacion.horarioEspecifico,
        timingAdicional: recomendacion.timingAdicional,
        prioridad: recomendacion.prioridad,
        razonamiento: recomendacion.razonamiento,
        dosis: recomendacion.dosis,
        frecuencia: recomendacion.frecuencia,
        respuestaUsuario: recomendacion.respuestaUsuario,
        timingModificado: recomendacion.timingModificado,
        fechaCreacion: recomendacion.fechaCreacion.toISOString(),
        fechaRespuesta: recomendacion.fechaRespuesta?.toISOString() || null,

        producto: {
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio ? Number(producto.precio) : 0,
          
          // Información nutricional completa
          proteina: producto.proteina || 0,
          calorias: producto.calorias || 0,
          carbohidratos: producto.carbohidratos || 0,
          grasas: producto.grasas || 0,
          fibra: producto.fibra || 0,
          azucar: producto.azucar || 0,
          volumen: producto.volumen || 0,
          
          // Información de categorización
          categoria: producto.categoria?.nombre || 'Sin categoría',
          sabor: producto.sabor?.nombre || 'Sin sabor',
          tamano: producto.tamano?.nombre || 'Sin tamaño',
          
          // Información adicional
          ingredientes: producto.ingredientes || [],
          etiquetas: producto.etiquetas || [],
          momentosRecomendados: producto.momentosRecomendados || [],
          urlImagen: producto.urlImagen,
          
          // Información calculada
          valorNutricional: this.calculateNutritionalValue(producto),
          recomendadoPara: this.getRecommendedUsage(producto),
          beneficios: this.getBenefits(producto),
          
          // Fechas
          fechaCreacion: producto.fechaCreacion.toISOString(),
          fechaActualizacion: producto.fechaActualizacion.toISOString()
        }
      };
    });
  }

  // Calcular valor nutricional
  private calculateNutritionalValue(producto: any) {
    const proteina = producto.proteina || 0;
    const calorias = producto.calorias || 0;
    const carbohidratos = producto.carbohidratos || 0;
    const grasas = producto.grasas || 0;

    return {
      // Macronutrientes por porción
      macronutrientes: {
        proteina: {
          valor: proteina,
          porcentaje: calorias > 0 ? Math.round((proteina * 4 / calorias) * 100) : 0,
          categoria: proteina > 20 ? 'Alto' : proteina > 10 ? 'Medio' : 'Bajo'
        },
        carbohidratos: {
          valor: carbohidratos,
          porcentaje: calorias > 0 ? Math.round((carbohidratos * 4 / calorias) * 100) : 0,
          categoria: carbohidratos > 30 ? 'Alto' : carbohidratos > 15 ? 'Medio' : 'Bajo'
        },
        grasas: {
          valor: grasas,
          porcentaje: calorias > 0 ? Math.round((grasas * 9 / calorias) * 100) : 0,
          categoria: grasas > 15 ? 'Alto' : grasas > 5 ? 'Medio' : 'Bajo'
        }
      },
      
      // Densidad nutricional
      densidadProteica: calorias > 0 ? Number((proteina / calorias * 100).toFixed(1)) : 0,
      caloriasPorGramo: producto.volumen > 0 ? Number((calorias / producto.volumen).toFixed(2)) : 0,
      
      // Calificación general
      puntuacionNutricional: this.calculateNutritionalScore(producto),
      
      // Análisis de calidad
      calidadProteica: proteina > 20 ? 'Excelente' : proteina > 15 ? 'Buena' : proteina > 10 ? 'Regular' : 'Baja',
      perfilCalorico: calorias < 150 ? 'Bajo' : calorias < 250 ? 'Moderado' : 'Alto'
    };
  }

  // Obtener uso recomendado
  private getRecommendedUsage(producto: any) {
    const momentos = producto.momentosRecomendados || [];
    const proteina = producto.proteina || 0;
    const calorias = producto.calorias || 0;
    const categoria = producto.categoria?.nombre?.toLowerCase() || '';

    const recomendaciones = [];

    // Análisis por momento del día
    if (momentos.includes('MANANA')) {
      recomendaciones.push({
        momento: 'Mañana',
        razon: 'Ideal para comenzar el día con energía',
        horario: '07:00 - 09:00',
        prioridad: 'Alta'
      });
    }

    if (momentos.includes('PRE_ENTRENAMIENTO')) {
      recomendaciones.push({
        momento: 'Pre-Entrenamiento',
        razon: 'Proporciona energía antes del ejercicio',
        horario: '30-60 min antes',
        prioridad: 'Media'
      });
    }

    if (momentos.includes('POST_ENTRENAMIENTO')) {
      recomendaciones.push({
        momento: 'Post-Entrenamiento',
        razon: 'Facilita la recuperación muscular',
        horario: '0-30 min después',
        prioridad: 'Alta'
      });
    }

    // Análisis por composición nutricional
    if (proteina > 20) {
      recomendaciones.push({
        momento: 'Recuperación',
        razon: `Alto contenido proteico (${proteina}g) ideal para síntesis muscular`,
        horario: 'Cualquier momento',
        prioridad: 'Alta'
      });
    }

    if (calorias < 150) {
      recomendaciones.push({
        momento: 'Snack',
        razon: 'Bajas calorías, perfecto entre comidas',
        horario: 'Entre comidas',
        prioridad: 'Media'
      });
    }

    return recomendaciones.length > 0 ? recomendaciones : [{
      momento: 'Uso general',
      razon: 'Suplemento nutricional versátil',
      horario: 'Según necesidades',
      prioridad: 'Media'
    }];
  }

  // Obtener beneficios
  private getBenefits(producto: any) {
    const beneficios = [];
    const proteina = producto.proteina || 0;
    const calorias = producto.calorias || 0;
    const carbohidratos = producto.carbohidratos || 0;
    const grasas = producto.grasas || 0;

    // Beneficios por proteína
    if (proteina > 20) {
      beneficios.push({
        categoria: 'Desarrollo Muscular',
        beneficio: 'Construcción y reparación de tejido muscular',
        evidencia: 'Alto contenido proteico',
        impacto: 'Alto'
      });
    }

    if (proteina > 15) {
      beneficios.push({
        categoria: 'Recuperación',
        beneficio: 'Acelera la recuperación post-ejercicio',
        evidencia: 'Proteína de calidad',
        impacto: 'Medio'
      });
    }

    // Beneficios por calorías
    if (calorias > 0 && calorias < 200) {
      beneficios.push({
        categoria: 'Control de Peso',
        beneficio: 'Ayuda en el control calórico',
        evidencia: 'Moderado aporte calórico',
        impacto: 'Medio'
      });
    }

    // Beneficios por carbohidratos
    if (carbohidratos > 15) {
      beneficios.push({
        categoria: 'Energía',
        beneficio: 'Proporciona energía rápida',
        evidencia: 'Carbohidratos disponibles',
        impacto: 'Medio'
      });
    }

    // Beneficios generales
    beneficios.push({
      categoria: 'Comodidad',
      beneficio: 'Fácil preparación y consumo',
      evidencia: 'Formato práctico',
      impacto: 'Bajo'
    });

    return beneficios;
  }

  // Calcular puntuación nutricional
  private calculateNutritionalScore(producto: any) {
    let score = 0;
    const proteina = producto.proteina || 0;
    const calorias = producto.calorias || 0;
    const carbohidratos = producto.carbohidratos || 0;
    const grasas = producto.grasas || 0;
    const fibra = producto.fibra || 0;
    const azucar = producto.azucar || 0;

    // Puntuación por proteína (0-40 puntos)
    if (proteina > 25) score += 40;
    else if (proteina > 20) score += 35;
    else if (proteina > 15) score += 25;
    else if (proteina > 10) score += 15;
    else score += 5;

    // Puntuación por calorías (0-20 puntos)
    if (calorias < 150) score += 20;
    else if (calorias < 200) score += 15;
    else if (calorias < 300) score += 10;
    else score += 5;

    // Puntuación por fibra (0-15 puntos)
    if (fibra > 5) score += 15;
    else if (fibra > 3) score += 10;
    else if (fibra > 1) score += 5;

    // Penalización por azúcar (0 a -15 puntos)
    if (azucar > 20) score -= 15;
    else if (azucar > 15) score -= 10;
    else if (azucar > 10) score -= 5;

    // Puntuación por grasas (0-10 puntos)
    if (grasas < 5) score += 10;
    else if (grasas < 10) score += 5;

    // Normalizar a 0-100
    score = Math.max(0, Math.min(100, score));

    return {
      puntuacion: score,
      categoria: score >= 80 ? 'Excelente' : score >= 60 ? 'Bueno' : score >= 40 ? 'Regular' : 'Básico',
      descripcion: this.getNutritionalScoreDescription(score)
    };
  }

  // Descripción de puntuación nutricional
  private getNutritionalScoreDescription(score: number): string {
    if (score >= 80) return 'Perfil nutricional excelente, ideal para objetivos deportivos';
    if (score >= 60) return 'Buen perfil nutricional, adecuado para suplementación';
    if (score >= 40) return 'Perfil nutricional básico, cumple función específica';
    return 'Perfil nutricional básico, considerar alternativas';
  }

  // MÉTODO DE FALLBACK INTELIGENTE (mejorado)
  private generateIntelligentFallback(dto: CreateRecommendationDto, productosDisponibles: any[]) {
    logger.info('Generando fallback inteligente', { 
      contexto: dto.contexto, 
      productosDisponibles: productosDisponibles.length 
    });

    // Seleccionar producto apropiado según contexto
    let productoSeleccionado = productosDisponibles[0];

    // Lógica inteligente según contexto
    if (dto.contexto?.toLowerCase().includes('almuerzo') || dto.contexto?.toLowerCase().includes('energia')) {
      const batido = productosDisponibles.find(p => 
        p.nombre.toLowerCase().includes('batido') || 
        p.categoria?.nombre?.toLowerCase().includes('batido')
      );
      if (batido) productoSeleccionado = batido;
    }

    if (dto.contexto?.toLowerCase().includes('entrenamiento')) {
      const proteico = productosDisponibles.find(p => 
        p.proteina && p.proteina > 15
      );
      if (proteico) productoSeleccionado = proteico;
    }

    const timing = this.getTimingFromContext(dto.contexto);
    const prioridad = dto.objetivoEspecifico ? 'ALTA' : 'MEDIA';

    // Generar razonamiento más detallado
    const razonamientoDetallado = this.generateDetailedReasoning(
      productoSeleccionado, 
      dto.contexto, 
      dto.objetivoEspecifico
    );

    return {
      recomendaciones: [
        {
          productoId: productoSeleccionado.id,
          tituloRecomendacion: `🎯 ${productoSeleccionado.nombre} - Para ${dto.contexto || 'tu objetivo'}`,
          iconoProducto: '🥤',
          timingRecomendado: timing,
          prioridad,
          razonamiento: razonamientoDetallado,
          dosis: '1 porción (30g)',
          frecuencia: timing === 'POST_ENTRENAMIENTO' ? 'Después del entrenamiento' : 'Una vez al día'
        }
      ],
      razonamientoGeneral: `Recomendación personalizada basada en tu contexto de ${dto.contexto || 'nutrición general'}. Hemos seleccionado ${productoSeleccionado.nombre} considerando tus necesidades específicas y su perfil nutricional óptimo.`,
      metadatos: {
        fallback: true,
        productosDisponibles: productosDisponibles.length,
        productoSeleccionado: {
          id: productoSeleccionado.id,
          nombre: productoSeleccionado.nombre,
          proteina: productoSeleccionado.proteina || 0,
          calorias: productoSeleccionado.calorias || 0
        }
      }
    };
  }

  // Generar razonamiento detallado
  private generateDetailedReasoning(producto: any, contexto?: string, objetivo?: string): string {
    const proteina = producto.proteina || 0;
    const calorias = producto.calorias || 0;
    const precio = producto.precio ? Number(producto.precio) : 0;
    const categoria = producto.categoria?.nombre || 'suplemento';
    const sabor = producto.sabor?.nombre || 'neutro';

    let razonamiento = `Recomendamos ${producto.nombre} como la opción ideal para ${contexto || 'tu suplementación'}. `;

    // Análisis nutricional
    if (proteina > 20) {
      razonamiento += `Con ${proteina}g de proteína por porción, este producto ofrece un excelente aporte proteico que favorece la síntesis muscular y la recuperación. `;
    } else if (proteina > 10) {
      razonamiento += `Aporta ${proteina}g de proteína, proporcionando un soporte nutricional adecuado para tus necesidades. `;
    }

    if (calorias > 0) {
      razonamiento += `Con ${calorias} calorías por porción, se ajusta perfectamente a tu balance energético. `;
    }

    // Análisis de contexto
    if (contexto?.toLowerCase().includes('almuerzo')) {
      razonamiento += `Para el contexto de almuerzo, este ${categoria.toLowerCase()} complementa tu alimentación proporcionando nutrientes esenciales de forma práctica. `;
    }

    if (contexto?.toLowerCase().includes('entrenamiento')) {
      razonamiento += `En el contexto de entrenamiento, optimiza tu rendimiento y recuperación gracias a su perfil nutricional específico. `;
    }

    // Análisis de objetivo específico
    if (objetivo) {
      razonamiento += `Para tu objetivo específico de "${objetivo}", este producto se alinea perfectamente con tus metas nutricionales. `;
    }

    // Información adicional
    razonamiento += `El sabor ${sabor} garantiza una experiencia agradable, y con un precio de S/. ${precio}, ofrece una excelente relación calidad-precio. `;

    razonamiento += `Recomendamos su consumo según las indicaciones para maximizar sus beneficios.`;

    return razonamiento;
  }

  private getTimingFromContext(contexto?: string): string {
    if (!contexto) return 'MANANA';
    
    const ctx = contexto.toLowerCase();
    if (ctx.includes('mañana') || ctx.includes('desayuno')) return 'MANANA';
    if (ctx.includes('entrenamiento') || ctx.includes('ejercicio')) return 'POST_ENTRENAMIENTO';
    if (ctx.includes('almuerzo')) return 'TARDE';
    if (ctx.includes('noche') || ctx.includes('cena')) return 'NOCHE';
    
    return 'MANANA';
  }
}