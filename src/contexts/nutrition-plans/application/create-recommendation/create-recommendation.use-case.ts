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
        return {
          ...this.buildBaseRecommendation(recomendacion),
          producto: null
        };
      }

      return {
        ...this.buildBaseRecommendation(recomendacion),
        
        // ✅ PRODUCTO COMPLETO CON TODA LA INFORMACIÓN
        producto: {
          // Información básica
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
          
          // ✅ ANÁLISIS NUTRICIONAL COMPLETO
          valorNutricional: this.calculateCompleteNutritionalValue(producto),
          recomendadoPara: this.getDetailedRecommendedUsage(producto),
          beneficios: this.getDetailedBenefits(producto),
          
          // Fechas
          fechaCreacion: producto.fechaCreacion.toISOString(),
          fechaActualizacion: producto.fechaActualizacion.toISOString()
        }
      };
    });
  }

  // ✅ NUEVO: Construir recomendación base
  private buildBaseRecommendation(recomendacion: RecomendacionNutricional) {
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
    };
  }

  // ✅ ANÁLISIS NUTRICIONAL COMPLETO (EXPANDIDO)
  private calculateCompleteNutritionalValue(producto: any) {
    const proteina = producto.proteina || 0;
    const calorias = producto.calorias || 0;
    const carbohidratos = producto.carbohidratos || 0;
    const grasas = producto.grasas || 0;
    const fibra = producto.fibra || 0;
    const azucar = producto.azucar || 0;

    // Calcular macronutrientes
    const macronutrientes = {
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
    };

    // Densidad nutricional
    const densidadProteica = calorias > 0 ? Number((proteina / calorias * 100).toFixed(1)) : 0;
    const caloriasPorGramo = producto.volumen > 0 ? Number((calorias / producto.volumen).toFixed(2)) : 0;

    // Puntuación nutricional
    const puntuacionNutricional = this.calculateAdvancedNutritionalScore(producto);

    // Análisis de calidad
    const calidadProteica = this.getProteinQuality(proteina);
    const perfilCalorico = this.getCaloricProfile(calorias);

    return {
      macronutrientes,
      densidadProteica,
      caloriasPorGramo,
      puntuacionNutricional,
      calidadProteica,
      perfilCalorico,
      
      // ✅ Análisis adicionales
      balanceMacronutrientes: this.analyzeMacroBalance(proteina, carbohidratos, grasas, calorias),
      indiceFibra: this.analyzeFiberContent(fibra, calorias),
      perfilAzucar: this.analyzeSugarContent(azucar, carbohidratos),
      valorSaciedad: this.calculateSatietyValue(proteina, fibra, grasas),
      aptitudDeportiva: this.assessSportsAptitude(proteina, carbohidratos, calorias)
    };
  }

  // ✅ NUEVOS MÉTODOS DE ANÁLISIS DETALLADO
  private calculateAdvancedNutritionalScore(producto: any): { puntuacion: number; categoria: string; descripcion: string } {
    let score = 0;
    const proteina = producto.proteina || 0;
    const calorias = producto.calorias || 0;
    const carbohidratos = producto.carbohidratos || 0;
    const grasas = producto.grasas || 0;
    const fibra = producto.fibra || 0;
    const azucar = producto.azucar || 0;

    // Proteína (40 puntos máximo)
    if (proteina > 25) score += 40;
    else if (proteina > 20) score += 35;
    else if (proteina > 15) score += 25;
    else if (proteina > 10) score += 15;
    else if (proteina > 5) score += 8;

    // Calorías (20 puntos máximo)
    if (calorias < 150) score += 20;
    else if (calorias < 200) score += 15;
    else if (calorias < 300) score += 10;
    else if (calorias < 400) score += 5;

    // Fibra (15 puntos máximo)
    if (fibra > 8) score += 15;
    else if (fibra > 5) score += 12;
    else if (fibra > 3) score += 8;
    else if (fibra > 1) score += 4;

    // Penalización por azúcar (-15 puntos máximo)
    if (azucar > 25) score -= 15;
    else if (azucar > 20) score -= 12;
    else if (azucar > 15) score -= 8;
    else if (azucar > 10) score -= 4;

    // Grasas (10 puntos máximo)
    if (grasas < 3) score += 10;
    else if (grasas < 6) score += 8;
    else if (grasas < 10) score += 5;
    else if (grasas < 15) score += 2;

    // Bonus por balance (15 puntos máximo)
    const proteinRatio = calorias > 0 ? (proteina * 4) / calorias : 0;
    if (proteinRatio > 0.4) score += 15; // Más del 40% de calorías de proteína
    else if (proteinRatio > 0.3) score += 12;
    else if (proteinRatio > 0.2) score += 8;
    else if (proteinRatio > 0.15) score += 5;

    // Normalizar a 0-100
    score = Math.max(0, Math.min(100, score));

    let categoria: string;
    let descripcion: string;

    if (score >= 85) {
      categoria = 'Excelente';
      descripcion = 'Perfil nutricional excepcional, ideal para objetivos deportivos y de salud';
    } else if (score >= 70) {
      categoria = 'Muy Bueno';
      descripcion = 'Excelente perfil nutricional, muy recomendado para suplementación';
    } else if (score >= 55) {
      categoria = 'Bueno';
      descripcion = 'Buen perfil nutricional, adecuado para la mayoría de objetivos';
    } else if (score >= 40) {
      categoria = 'Regular';
      descripcion = 'Perfil nutricional básico, cumple función específica';
    } else {
      categoria = 'Básico';
      descripcion = 'Perfil nutricional básico, considerar alternativas más nutritivas';
    }

    return { puntuacion: score, categoria, descripcion };
  }

  private getProteinQuality(proteina: number): string {
    if (proteina >= 25) return 'Excelente (≥25g) - Ideal para deportistas';
    if (proteina >= 20) return 'Muy Buena (20-24g) - Excelente para mantenimiento';
    if (proteina >= 15) return 'Buena (15-19g) - Adecuada para objetivos generales';
    if (proteina >= 10) return 'Regular (10-14g) - Complemento básico';
    if (proteina >= 5) return 'Baja (5-9g) - Solo como snack';
    return 'Muy Baja (<5g) - No es fuente significativa de proteína';
  }

  private getCaloricProfile(calorias: number): string {
    if (calorias < 100) return 'Muy Bajo (<100 kcal) - Ideal para control de peso';
    if (calorias < 150) return 'Bajo (100-149 kcal) - Excelente para snacks';
    if (calorias < 200) return 'Moderado-Bajo (150-199 kcal) - Bueno entre comidas';
    if (calorias < 300) return 'Moderado (200-299 kcal) - Adecuado como suplemento';
    if (calorias < 400) return 'Alto (300-399 kcal) - Considerar como reemplazo de comida';
    return 'Muy Alto (≥400 kcal) - Usar con precaución en dietas de déficit';
  }

  private analyzeMacroBalance(proteina: number, carbohidratos: number, grasas: number, calorias: number) {
    if (calorias === 0) return 'Sin información calórica disponible';

    const proteinCals = proteina * 4;
    const carbCals = carbohidratos * 4;
    const fatCals = grasas * 9;
    const totalMacroCals = proteinCals + carbCals + fatCals;

    if (totalMacroCals === 0) return 'Sin información de macronutrientes';

    const proteinRatio = proteinCals / totalMacroCals;
    const carbRatio = carbCals / totalMacroCals;
    const fatRatio = fatCals / totalMacroCals;

    if (proteinRatio > 0.5) return 'Alto en proteína - Excelente para desarrollo muscular';
    if (proteinRatio > 0.3 && carbRatio < 0.4) return 'Proteína moderada, bajo en carbohidratos';
    if (carbRatio > 0.5) return 'Alto en carbohidratos - Bueno para energía pre/post entrenamiento';
    if (fatRatio > 0.3) return 'Moderado en grasas - Verificar tipo de grasas';
    return 'Balance equilibrado de macronutrientes';
  }

  private analyzeFiberContent(fibra: number, calorias: number): string {
    if (fibra === 0) return 'Sin fibra declarada';
    if (calorias === 0) return 'Contiene fibra - Sin información calórica para análisis';

    const fibraPerCal = fibra / calorias * 100;
    if (fibraPerCal > 8) return 'Muy alto en fibra - Excelente para saciedad y digestión';
    if (fibraPerCal > 5) return 'Alto en fibra - Bueno para saciedad';
    if (fibraPerCal > 2) return 'Moderado en fibra - Contribuye a la saciedad';
    return 'Bajo en fibra - Principalmente para otros nutrientes';
  }

  private analyzeSugarContent(azucar: number, carbohidratos: number): string {
    if (azucar === 0) return 'Sin azúcares añadidos declarados';
    if (carbohidratos === 0) return 'Contiene azúcar pero sin carbohidratos totales declarados';

    const sugarRatio = azucar / carbohidratos;
    if (sugarRatio > 0.8) return 'Muy alto en azúcar - Usar con moderación';
    if (sugarRatio > 0.6) return 'Alto en azúcar - Mejor post-entrenamiento';
    if (sugarRatio > 0.4) return 'Moderado en azúcar - Aceptable ocasionalmente';
    if (sugarRatio > 0.2) return 'Bajo en azúcar - Buena opción general';
    return 'Muy bajo en azúcar - Excelente opción';
  }

  private calculateSatietyValue(proteina: number, fibra: number, grasas: number): string {
    let satietyScore = 0;
    
    // Proteína tiene el mayor efecto saciante
    satietyScore += proteina * 3;
    
    // Fibra también ayuda mucho
    satietyScore += fibra * 2;
    
    // Grasas ayudan moderadamente
    satietyScore += grasas * 1;

    if (satietyScore > 80) return 'Muy Alto - Excelente para control del apetito';
    if (satietyScore > 60) return 'Alto - Bueno para mantenerse satisfecho';
    if (satietyScore > 40) return 'Moderado - Saciedad básica';
    if (satietyScore > 20) return 'Bajo - Principalmente para otros objetivos';
    return 'Muy Bajo - No contribuye significativamente a la saciedad';
  }

  private assessSportsAptitude(proteina: number, carbohidratos: number, calorias: number): string {
    const proteinRatio = calorias > 0 ? (proteina * 4) / calorias : 0;
    const carbRatio = calorias > 0 ? (carbohidratos * 4) / calorias : 0;

    if (proteina > 20 && proteinRatio > 0.4) {
      return 'Excelente para deportistas - Alta proteína para recuperación';
    }
    
    if (carbohidratos > 20 && carbRatio > 0.5) {
      return 'Bueno para deportes de resistencia - Alto en carbohidratos para energía';
    }
    
    if (proteina > 15 && carbohidratos > 15) {
      return 'Versátil para deportistas - Balance proteína-carbohidratos';
    }
    
    if (proteina > 10) {
      return 'Adecuado para actividad física moderada';
    }
    
    return 'Mejor para objetivos no deportivos específicos';
  }

  // ✅ USO RECOMENDADO DETALLADO (EXPANDIDO)
  private getDetailedRecommendedUsage(producto: any): Array<{
    momento: string;
    razon: string;
    horario: string;
    prioridad: string;
    beneficiosEspecificos: string[];
  }> {
    const momentos = producto.momentosRecomendados || [];
    const proteina = producto.proteina || 0;
    const calorias = producto.calorias || 0;
    const carbohidratos = producto.carbohidratos || 0;
    const categoria = producto.categoria?.nombre?.toLowerCase() || '';

    const recomendaciones = [];

    // Análisis por momento del día con beneficios específicos
    if (momentos.includes('MANANA')) {
      recomendaciones.push({
        momento: 'Mañana / Desayuno',
        razon: `Ideal para comenzar el día con ${proteina}g de proteína y ${calorias} calorías`,
        horario: '07:00 - 09:00',
        prioridad: 'Alta',
        beneficiosEspecificos: [
          'Activa el metabolismo matutino',
          'Proporciona saciedad hasta el almuerzo',
          'Facilita el control de peso durante el día'
        ]
      });
    }

    if (momentos.includes('PRE_ENTRENAMIENTO')) {
      recomendaciones.push({
        momento: 'Pre-Entrenamiento',
        razon: `${carbohidratos}g de carbohidratos para energía rápida disponible`,
        horario: '30-60 min antes del ejercicio',
        prioridad: 'Media',
        beneficiosEspecificos: [
          'Mejora el rendimiento durante el ejercicio',
          'Previene la fatiga prematura',
          'Optimiza la disponibilidad de glucógeno'
        ]
      });
    }

    if (momentos.includes('POST_ENTRENAMIENTO')) {
      recomendaciones.push({
        momento: 'Post-Entrenamiento',
        razon: `${proteina}g de proteína para síntesis muscular y ${carbohidratos}g de carbohidratos para reposición`,
        horario: '0-30 min después del ejercicio',
        prioridad: 'Alta',
        beneficiosEspecificos: [
          'Acelera la recuperación muscular',
          'Repone las reservas de glucógeno',
          'Reduce el catabolismo muscular',
          'Optimiza las adaptaciones al entrenamiento'
        ]
      });
    }

    // Si no hay recomendaciones específicas, crear una general
    if (recomendaciones.length === 0) {
      recomendaciones.push({
        momento: 'Uso General',
        razon: `Suplemento nutricional versátil con ${proteina}g de proteína`,
        horario: 'Según necesidades individuales',
        prioridad: 'Media',
        beneficiosEspecificos: [
          'Complementa la ingesta diaria de proteína',
          'Ayuda a alcanzar objetivos nutricionales',
          'Opción práctica y conveniente'
        ]
      });
    }

    return recomendaciones;
  }

  // ✅ BENEFICIOS DETALLADOS (EXPANDIDO)
  private getDetailedBenefits(producto: any): Array<{
    categoria: string;
    beneficio: string;
    evidencia: string;
    impacto: string;
    explicacion: string;
  }> {
    const beneficios = [];
    const proteina = producto.proteina || 0;
    const calorias = producto.calorias || 0;
    const carbohidratos = producto.carbohidratos || 0;
    const grasas = producto.grasas || 0;
    const fibra = producto.fibra || 0;

    // Beneficios por proteína
    if (proteina > 20) {
      beneficios.push({
        categoria: 'Desarrollo Muscular',
        beneficio: 'Estimula la síntesis de proteína muscular',
        evidencia: `Alto contenido proteico: ${proteina}g por porción`,
        impacto: 'Alto',
        explicacion: 'La proteína es esencial para la construcción y reparación del tejido muscular. Con más de 20g por porción, supera el umbral mínimo para activar efectivamente la síntesis proteica.'
      });
    }

    if (proteina > 15) {
      beneficios.push({
        categoria: 'Recuperación',
        beneficio: 'Acelera la recuperación post-ejercicio',
        evidencia: `Proteína de calidad: ${proteina}g`,
        impacto: 'Medio-Alto',
        explicacion: 'La proteína post-ejercicio ayuda a reparar las microfibras musculares dañadas durante el entrenamiento, reduciendo el tiempo de recuperación.'
      });
    }

    // Beneficios por carbohidratos
    if (carbohidratos > 15) {
      beneficios.push({
        categoria: 'Energía',
        beneficio: 'Proporciona energía rápida y sostenida',
        evidencia: `${carbohidratos}g de carbohidratos disponibles`,
        impacto: 'Medio',
        explicacion: 'Los carbohidratos son la fuente de energía preferida del cuerpo durante el ejercicio de alta intensidad y actividades cognitivas.'
      });
    }

    // Beneficios por fibra
    if (fibra > 3) {
      beneficios.push({
        categoria: 'Salud Digestiva',
        beneficio: 'Mejora la salud digestiva y saciedad',
        evidencia: `${fibra}g de fibra por porción`,
        impacto: 'Medio',
        explicacion: 'La fibra dietética promueve la salud intestinal, mejora la saciedad y puede ayudar en el control del peso.'
      });
    }

    // Beneficios por perfil calórico
    if (calorias > 0 && calorias < 200) {
      beneficios.push({
        categoria: 'Control de Peso',
        beneficio: 'Apoya el control calórico efectivo',
        evidencia: `Moderado aporte calórico: ${calorias} kcal`,
        impacto: 'Medio',
        explicacion: 'Al proporcionar nutrientes esenciales con un aporte calórico controlado, facilita el mantenimiento o pérdida de peso.'
      });
    }

    // Beneficios generales
    beneficios.push({
      categoria: 'Conveniencia',
      beneficio: 'Facilita el cumplimiento nutricional diario',
      evidencia: 'Formato práctico y rápido de preparar',
      impacto: 'Bajo-Medio',
      explicacion: 'La facilidad de preparación y consumo ayuda a mantener la consistencia en la suplementación, factor clave para obtener resultados.'
    });

    return beneficios;
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