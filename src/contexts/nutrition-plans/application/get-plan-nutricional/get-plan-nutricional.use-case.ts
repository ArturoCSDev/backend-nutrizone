import { PlanNutricionalRepository } from '../../domain/repositories/plan-nutricional.repository';
import { RecomendacionNutricionalRepository } from '../../domain/repositories/recomendacion-nutricional.repository';
import { ClienteRepository } from '../../../client/domain/repositories/cliente.repository';
import { ProductoRepository } from '../../../products/domain/repositories/producto.repository';
import { 
  GetPlanNutricionalDto, 
  GetPlanByClienteDto,
  GetPlanNutricionalResponseDto,
  ClienteInfoDto,
  RecomendacionDetalladaDto,
  ProductoInfoDto,
  ResumenRecomendacionesDto
} from './get-plan-nutricional.dto';
import { NotFoundException } from '../../../../shared/core/exceptions/not-found.exception';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';
import { PlanNutricional } from '../../domain/models/plan-nutricional.model';
import { RecomendacionNutricional } from '../../domain/models/recomendacion-nutricional.model';
import { Prioridad } from '@prisma/client';
import { HorarioUtil } from '../../../../shared/infrastructure/utils/horario.util';

export class GetPlanNutricionalUseCase {
  constructor(
    private readonly planNutricionalRepository: PlanNutricionalRepository,
    private readonly recomendacionNutricionalRepository: RecomendacionNutricionalRepository,
    private readonly clienteRepository: ClienteRepository,
    private readonly productoRepository: ProductoRepository
  ) {}

  async execute(dto: GetPlanNutricionalDto): Promise<GetPlanNutricionalResponseDto> {
    logger.info('Obteniendo plan nutricional', { 
      planId: dto.planId,
      includeCliente: dto.includeCliente,
      includeRecomendaciones: dto.includeRecomendaciones,
      includeProductos: dto.includeProductos
    });

    // 1. Buscar el plan nutricional
    const plan = await this.planNutricionalRepository.findById(dto.planId);
    if (!plan) {
      throw new NotFoundException('Plan nutricional', { planId: dto.planId });
    }

    logger.debug('Plan encontrado', { 
      planId: plan.id,
      clienteId: plan.clienteId,
      nombre: plan.nombre,
      pesoInicial: plan.pesoInicial,
      grasaInicial: plan.grasaInicial,
      muscularInicial: plan.muscularInicial
    });

    // 2. Obtener información del cliente si se solicita
    let cliente: ClienteInfoDto | undefined;
    if (dto.includeCliente) {
      try {
        logger.debug('Buscando cliente', { clienteId: plan.clienteId });
        
        const clienteEntity = await this.clienteRepository.findById(plan.clienteId);
        
        logger.debug('Resultado búsqueda cliente', { 
          clienteId: plan.clienteId, 
          encontrado: !!clienteEntity,
          clienteData: clienteEntity ? {
            id: clienteEntity.id,
            edad: clienteEntity.edad,
            peso: clienteEntity.peso ? Number(clienteEntity.peso) : null,
            altura: clienteEntity.altura ? Number(clienteEntity.altura) : null,
            hasUsuario: !!(clienteEntity as any).usuario,
            usuario: (clienteEntity as any).usuario
          } : null
        });
        
        if (clienteEntity) {
          cliente = this.mapClienteToDto(clienteEntity);
          logger.debug('Cliente mapeado exitosamente', { 
            clienteId: cliente.id,
            nombreCompleto: cliente.nombreCompleto,
            peso: cliente.peso,
            altura: cliente.altura
          });
        } else {
          logger.warn('Cliente no encontrado en base de datos', { clienteId: plan.clienteId });
        }
      } catch (error) {
        logger.error('Error obteniendo cliente', { 
          clienteId: plan.clienteId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // 3. Obtener recomendaciones si se solicita
    let recomendaciones: RecomendacionDetalladaDto[] = [];
    let resumenRecomendaciones: ResumenRecomendacionesDto | undefined;
    
    if (dto.includeRecomendaciones) {
      try {
        logger.debug('Buscando recomendaciones', { planId: dto.planId });
        
        const recomendacionesEntity = await this.recomendacionNutricionalRepository.findByPlanId(dto.planId);
        
        logger.debug('Recomendaciones encontradas', { 
          planId: dto.planId,
          total: recomendacionesEntity.length,
          recomendaciones: recomendacionesEntity.map(r => ({
            id: r.id,
            titulo: r.tituloRecomendacion,
            timing: r.timingRecomendado,
            prioridad: r.prioridad
          }))
        });
        
        // Filtrar solo pendientes si se solicita
        const recomendacionesFiltradas = dto.onlyPendingRecomendaciones
          ? recomendacionesEntity.filter(rec => rec.isPending)
          : recomendacionesEntity;

        logger.debug('Recomendaciones después del filtro', { 
          filtradas: recomendacionesFiltradas.length,
          filtroAplicado: dto.onlyPendingRecomendaciones
        });

        // Obtener información de productos si se solicita
        const productosMap = new Map();
        if (dto.includeProductos && recomendacionesFiltradas.length > 0) {
          const productosIds = [...new Set(recomendacionesFiltradas.map(rec => rec.productoId))];
          logger.debug('Buscando productos', { productosIds });
          
          const productos = await this.productoRepository.findByIds(productosIds);
          logger.debug('Productos encontrados', { 
            solicitados: productosIds.length,
            encontrados: productos.length
          });
          
          productos.forEach(producto => {
            productosMap.set(producto.id, producto);
          });
        }

        // Mapear recomendaciones
        recomendaciones = recomendacionesFiltradas.map(rec => 
          this.mapRecomendacionToDto(rec, productosMap.get(rec.productoId))
        );

        // Crear resumen de recomendaciones
        resumenRecomendaciones = this.createResumenRecomendaciones(recomendacionesEntity, recomendaciones);
        
        logger.debug('Recomendaciones procesadas exitosamente', { 
          mapeadas: recomendaciones.length,
          tieneResumen: !!resumenRecomendaciones
        });
      } catch (error) {
        logger.error('Error obteniendo recomendaciones', { 
          planId: dto.planId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    logger.success('Plan nutricional obtenido exitosamente', {
      planId: dto.planId,
      clienteId: plan.clienteId,
      tieneCliente: !!cliente,
      recomendaciones: recomendaciones.length,
      tieneResumen: !!resumenRecomendaciones
    });

    // 4. Construir respuesta
    return this.buildResponse(plan, cliente, recomendaciones, resumenRecomendaciones);
  }

  private mapClienteToDto(cliente: any): ClienteInfoDto {
    // Acceder al usuario incluido en la consulta
    const usuario = cliente.usuario;
    
    logger.debug('Mapeando cliente a DTO', { 
      clienteId: cliente.id,
      hasUsuario: !!usuario,
      usuarioData: usuario ? {
        nombre: usuario.nombre,
        apellidoPaterno: usuario.apellidoPaterno,
        apellidoMaterno: usuario.apellidoMaterno
      } : null
    });

    return {
      id: cliente.id,
      nombre: usuario?.nombre || '',
      apellidoPaterno: usuario?.apellidoPaterno || '',
      apellidoMaterno: usuario?.apellidoMaterno || '',
      nombreCompleto: `${usuario?.nombre || ''} ${usuario?.apellidoPaterno || ''} ${usuario?.apellidoMaterno || ''}`.trim(),
      edad: cliente.edad,
      peso: cliente.peso ? Number(cliente.peso) : null,
      altura: cliente.altura ? Number(cliente.altura) : null,
      nivelActividad: cliente.nivelActividad,
      genero: cliente.genero
    };
  }

  private mapRecomendacionToDto(
    recomendacion: RecomendacionNutricional,
    producto?: any
  ): RecomendacionDetalladaDto {
    return {
      id: recomendacion.id,
      productoId: recomendacion.productoId,
      tamanoId: recomendacion.tamanoId,
      tituloRecomendacion: recomendacion.tituloRecomendacion || '',
      iconoProducto: recomendacion.iconoProducto || '🥤',
      timingRecomendado: recomendacion.timingRecomendado,
      horarioEspecifico: HorarioUtil.dateToHorarioString(recomendacion.horarioEspecifico), // USAR HorarioUtil
      timingAdicional: recomendacion.timingAdicional,
      prioridad: recomendacion.prioridad,
      razonamiento: recomendacion.razonamiento,
      dosis: recomendacion.dosis || '',
      frecuencia: recomendacion.frecuencia || '',
      respuestaUsuario: recomendacion.respuestaUsuario,
      timingModificado: recomendacion.timingModificado,
      fechaCreacion: recomendacion.fechaCreacion.toISOString(),
      fechaRespuesta: recomendacion.fechaRespuesta?.toISOString() || null,
      
      // Información adicional
      esPendiente: recomendacion.isPending,
      esAceptada: recomendacion.isAccepted,
      esRechazada: recomendacion.isRejected,
      haExpirado: recomendacion.hasExpired(),
      
      // Información del producto
      producto: producto ? this.mapProductoToDto(producto) : undefined
    };
  }

  async executeByCliente(dto: GetPlanByClienteDto): Promise<GetPlanNutricionalResponseDto[]> {
    logger.info('Obteniendo planes nutricionales por cliente', { clienteId: dto.clienteId });

    // 1. Verificar que el cliente existe
    const cliente = await this.clienteRepository.findById(dto.clienteId);
    if (!cliente) {
      throw new NotFoundException('Cliente', { clienteId: dto.clienteId });
    }

    // 2. Obtener planes
    const planes = dto.onlyActive
      ? [await this.planNutricionalRepository.findActiveByClienteId(dto.clienteId)].filter(Boolean)
      : await this.planNutricionalRepository.findByClienteId(dto.clienteId);

    if (planes.length === 0) {
      return [];
    }

    // 3. Mapear cada plan
    const planesResponse = await Promise.all(
      planes.map(async (plan) => {
        const planDto: GetPlanNutricionalDto = {
          planId: plan!.id,
          includeRecomendaciones: dto.includeRecomendaciones,
          includeProductos: dto.includeProductos,
          includeCliente: false, // Ya tenemos la info del cliente
        };

        const response = await this.execute(planDto);
        return {
          ...response,
          cliente: this.mapClienteToDto(cliente)
        };
      })
    );

    logger.success('Planes nutricionales obtenidos exitosamente', {
      clienteId: dto.clienteId,
      planesEncontrados: planesResponse.length
    });

    return planesResponse;
  }

  private buildResponse(
    plan: PlanNutricional,
    cliente?: ClienteInfoDto,
    recomendaciones?: RecomendacionDetalladaDto[],
    resumenRecomendaciones?: ResumenRecomendacionesDto
  ): GetPlanNutricionalResponseDto {
    // Calcular información adicional
    const diasRestantes = plan.daysRemaining;
    const progreso = this.calculateProgreso(plan);

    return {
      id: plan.id,
      clienteId: plan.clienteId,
      nombre: plan.nombre,
      descripcion: plan.descripcion || '',
      objetivo: plan.objetivo,
      estado: plan.estado,
      fechaInicio: plan.fechaInicio.toISOString(),
      fechaFin: plan.fechaFin?.toISOString() || null,
      duracion: plan.duracion,
      caloriasObjetivo: plan.caloriasObjetivo,
      proteinaObjetivo: plan.proteinaObjetivo,
      carbohidratosObjetivo: plan.carbohidratosObjetivo,
      grasasObjetivo: plan.grasasObjetivo,
      pesoInicial: plan.pesoInicial,
      grasaInicial: plan.grasaInicial,
      muscularInicial: plan.muscularInicial,
      fechaCreacion: plan.fechaCreacion.toISOString(),
      fechaActualizacion: plan.fechaActualizacion.toISOString(),
      
      // Información calculada
      diasRestantes,
      progreso,
      estaActivo: plan.isActive,
      puedeSerModificado: plan.canBeModified(),
      
      // Relaciones opcionales
      cliente,
      recomendaciones,
      resumenRecomendaciones
    };
  }

  private mapProductoToDto(producto: any): ProductoInfoDto {
    return {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio ? Number(producto.precio) : 0,
      proteina: producto.proteina,
      calorias: producto.calorias,
      carbohidratos: producto.carbohidratos,
      grasas: producto.grasas,
      categoria: producto.categoria?.nombre,
      sabor: producto.sabor?.nombre,
      tamano: producto.tamano?.nombre,
      urlImagen: producto.urlImagen
    };
  }

  private createResumenRecomendaciones(
    todasRecomendaciones: RecomendacionNutricional[],
    recomendacionesDetalladas: RecomendacionDetalladaDto[]
  ): ResumenRecomendacionesDto {
    // Contar por estado
    const pendientes = todasRecomendaciones.filter(rec => rec.isPending).length;
    const aceptadas = todasRecomendaciones.filter(rec => rec.isAccepted).length;
    const rechazadas = todasRecomendaciones.filter(rec => rec.isRejected).length;
    const modificadas = todasRecomendaciones.filter(rec => rec.isModified).length;

    // Contar por prioridad
    const alta = todasRecomendaciones.filter(rec => rec.hasHighPriority).length;
    const media = todasRecomendaciones.filter(rec => rec.hasMediumPriority).length;
    const baja = todasRecomendaciones.filter(rec => rec.hasLowPriority).length;

    // Obtener próximas recomendaciones (pendientes de alta prioridad)
    const proximasRecomendaciones = recomendacionesDetalladas
      .filter(rec => rec.esPendiente && rec.prioridad === Prioridad.ALTA)
      .slice(0, 3);

    return {
      total: todasRecomendaciones.length,
      pendientes,
      aceptadas,
      rechazadas,
      modificadas,
      porPrioridad: {
        alta,
        media,
        baja
      },
      proximasRecomendaciones
    };
  }

  private calculateProgreso(plan: PlanNutricional): number {
    if (!plan.duracion || !plan.fechaInicio) {
      return 0;
    }

    const now = new Date();
    const fechaInicio = plan.fechaInicio;
    const duracionMs = plan.duracion * 24 * 60 * 60 * 1000;
    const transcurridoMs = now.getTime() - fechaInicio.getTime();
    
    if (transcurridoMs <= 0) {
      return 0;
    }

    if (transcurridoMs >= duracionMs) {
      return 100;
    }

    return Math.round((transcurridoMs / duracionMs) * 100);
  }
}