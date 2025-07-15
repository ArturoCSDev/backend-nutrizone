import { PlanNutricional } from '../../domain/models/plan-nutricional.model';
import { RecomendacionNutricional } from '../../domain/models/recomendacion-nutricional.model';
import { PlanNutricionalRepository } from '../../domain/repositories/plan-nutricional.repository';
import { RecomendacionNutricionalRepository } from '../../domain/repositories/recomendacion-nutricional.repository';
import { ClienteRepository } from '../../../client/domain/repositories/cliente.repository';
import { PreferenciaClienteRepository } from '../../../client/domain/repositories/preferencia-cliente.repository';
import { ProductoRepository } from '../../../products/domain/repositories/producto.repository';
import { ClaudeAdapter } from '../../../../shared/infrastructure/adapters/claude/claude.adapter';
import { CreatePlanNutricionalDto, CreatePlanNutricionalResponseDto } from './create-plan-nutricional.dto';
import { NotFoundException } from '../../../../shared/core/exceptions/not-found.exception';
import { ConflictException } from '../../../../shared/core/exceptions/conflict.exception';
import { ValidationException } from '../../../../shared/core/exceptions/validation.exception';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';
import { HorarioUtil } from '../../../../shared/infrastructure/utils/horario.util'; // NUEVO IMPORT
import { EstadoPlan, RespuestaUsuario } from '@prisma/client';

export class CreatePlanNutricionalUseCase {
  constructor(
    private readonly planNutricionalRepository: PlanNutricionalRepository,
    private readonly recomendacionNutricionalRepository: RecomendacionNutricionalRepository,
    private readonly clienteRepository: ClienteRepository,
    private readonly preferenciaClienteRepository: PreferenciaClienteRepository,
    private readonly productoRepository: ProductoRepository
  ) {}

  async execute(dto: CreatePlanNutricionalDto): Promise<CreatePlanNutricionalResponseDto> {
    logger.info('Iniciando creación de plan nutricional', { clienteId: dto.clienteId });

    // 1. Validar que el cliente existe
    const cliente = await this.clienteRepository.findById(dto.clienteId);
    if (!cliente) {
      throw new NotFoundException('Cliente', { clienteId: dto.clienteId });
    }

    // 2. Verificar que no tenga un plan activo
    const existingActivePlan = await this.planNutricionalRepository.findActiveByClienteId(dto.clienteId);
    if (existingActivePlan) {
      throw new ConflictException(
        'El cliente ya tiene un plan nutricional activo',
        { planId: existingActivePlan.id, clienteId: dto.clienteId }
      );
    }

    // 3. Obtener preferencias del cliente (si existen)
    const preferencias = await this.preferenciaClienteRepository.findByClienteId(dto.clienteId);

    // 4. Obtener productos disponibles
    const productosDisponibles = await this.productoRepository.findMany();
    if (productosDisponibles.length === 0) {
      throw new ValidationException(
        'No hay productos disponibles para crear el plan nutricional'
      );
    }

    // 5. Preparar input para Claude
    const claudeInput = this.prepareClaudeInput(dto, cliente, preferencias, productosDisponibles);

    // 6. Generar plan con Claude
    const planGenerado = await ClaudeAdapter.generateNutritionalPlan(claudeInput);

    // 7. Crear el plan nutricional
    const fechaInicio = dto.fechaInicio ? new Date(dto.fechaInicio) : new Date();
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + planGenerado.duracionDias);

    const planNutricional = PlanNutricional.create({
      clienteId: dto.clienteId,
      nombre: planGenerado.nombre,
      descripcion: planGenerado.descripcion,
      objetivo: dto.objetivo,
      estado: EstadoPlan.ACTIVO,
      fechaInicio,
      fechaFin,
      duracion: planGenerado.duracionDias,
      caloriasObjetivo: planGenerado.caloriasObjetivo,
      proteinaObjetivo: planGenerado.proteinaObjetivo,
      carbohidratosObjetivo: planGenerado.carbohidratosObjetivo,
      grasasObjetivo: planGenerado.grasasObjetivo,
      pesoInicial: dto.pesoInicial || null,
      grasaInicial: dto.grasaInicial || null,
      muscularInicial: dto.muscularInicial || null,
    });

    // 8. Guardar el plan
    const savedPlan = await this.planNutricionalRepository.save(planNutricional);

    // 9. Crear las recomendaciones con validación robusta
    const recomendaciones = planGenerado.recomendaciones.map(rec => {
      // NUEVO: Usar HorarioUtil para parsear horarios de manera segura
      const horarioEspecifico = HorarioUtil.parseHorarioEspecifico(rec.horarioEspecifico);
      
      // Log para debugging si hay problemas
      if (rec.horarioEspecifico && !horarioEspecifico) {
        logger.warn('Horario específico inválido detectado', {
          recomendacion: rec.tituloRecomendacion,
          horarioOriginal: rec.horarioEspecifico,
          planId: savedPlan.id
        });
      }

      return RecomendacionNutricional.create({
        mensajeId: null,
        productoId: rec.productoId,
        tamanoId: rec.tamanoId || null,
        planId: savedPlan.id,
        tituloRecomendacion: rec.tituloRecomendacion,
        iconoProducto: rec.iconoProducto,
        timingRecomendado: rec.timingRecomendado,
        horarioEspecifico, // ACTUALIZADO: Usar la variable validada
        timingAdicional: rec.timingAdicional || null,
        prioridad: rec.prioridad,
        razonamiento: rec.razonamiento,
        dosis: rec.dosis,
        frecuencia: rec.frecuencia,
        respuestaUsuario: RespuestaUsuario.PENDIENTE,
        timingModificado: null,
      });
    });

    // 10. Guardar las recomendaciones
    const savedRecomendaciones = await this.recomendacionNutricionalRepository.saveMany(recomendaciones);

    logger.success('Plan nutricional creado exitosamente', {
      planId: savedPlan.id,
      clienteId: dto.clienteId,
      recomendaciones: savedRecomendaciones.length
    });

    // 11. Retornar respuesta
    return this.buildResponse(savedPlan, savedRecomendaciones, planGenerado.instruccionesGenerales);
  }

  private prepareClaudeInput(
    dto: CreatePlanNutricionalDto,
    cliente: any,
    preferencias: any,
    productos: any[]
  ) {
    return {
      cliente: {
        id: cliente.id,
        nombre: cliente.usuario?.nombre || 'Cliente',
        apellidoPaterno: cliente.usuario?.apellidoPaterno || '',
        apellidoMaterno: cliente.usuario?.apellidoMaterno || '',
        edad: cliente.edad,
        peso: cliente.peso ? Number(cliente.peso) : undefined,
        altura: cliente.altura ? Number(cliente.altura) : undefined,
        nivelActividad: cliente.nivelActividad,
        genero: cliente.genero,
        grasaCorporal: cliente.grasaCorporal ? Number(cliente.grasaCorporal) : undefined,
        masaMuscular: cliente.masaMuscular ? Number(cliente.masaMuscular) : undefined,
        metabolismoBasal: cliente.metabolismoBasal,
      },
      preferencias: preferencias ? {
        productosFavoritos: dto.productosFavoritos || preferencias.productosFavoritos || [],
        preferenciasDieteticas: dto.preferenciasDieteticas || preferencias.preferenciasDieteticas || [],
        alergenos: dto.alergenos || preferencias.alergenos || [],
        objetivosFitness: preferencias.objetivosFitness || [],
        diasEntrenamiento: dto.diasEntrenamiento || preferencias.diasEntrenamiento || [],
        horariosEntrenamiento: dto.horariosEntrenamiento || preferencias.horariosEntrenamiento || [],
        horaDespertar: dto.horaDespertar || preferencias.horaDespertar,
        horaDormir: dto.horaDormir || preferencias.horaDormir,
      } : undefined,
      productosDisponibles: productos.map(producto => ({
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        categoria: producto.categoria?.nombre || 'Sin categoría',
        sabor: producto.sabor?.nombre || 'Sin sabor',
        tamano: producto.tamano?.nombre || 'Sin tamaño',
        proteina: producto.proteina || 0,
        calorias: producto.calorias || 0,
        carbohidratos: producto.carbohidratos || 0,
        grasas: producto.grasas || 0,
        fibra: producto.fibra || 0,
        azucar: producto.azucar || 0,
        momentosRecomendados: producto.momentosRecomendados || [],
        precio: producto.precio ? Number(producto.precio) : 0,
      })),
      objetivo: dto.objetivo,
      duracionDias: dto.duracionDias || 30,
    };
  }

  private buildResponse(
    plan: PlanNutricional,
    recomendaciones: RecomendacionNutricional[],
    instruccionesGenerales: string
  ): CreatePlanNutricionalResponseDto {
    return {
      id: plan.id,
      clienteId: plan.clienteId,
      nombre: plan.nombre,
      descripcion: plan.descripcion || '',
      objetivo: plan.objetivo,
      duracionDias: plan.duracion || 30,
      fechaInicio: plan.fechaInicio.toISOString(),
      fechaFin: plan.fechaFin?.toISOString() || null,
      caloriasObjetivo: plan.caloriasObjetivo || 0,
      proteinaObjetivo: plan.proteinaObjetivo || 0,
      carbohidratosObjetivo: plan.carbohidratosObjetivo || 0,
      grasasObjetivo: plan.grasasObjetivo || 0,
      instruccionesGenerales,
      recomendaciones: recomendaciones.map(rec => ({
        id: rec.id,
        productoId: rec.productoId,
        tamanoId: rec.tamanoId,
        tituloRecomendacion: rec.tituloRecomendacion || '',
        iconoProducto: rec.iconoProducto || '🥤',
        timingRecomendado: rec.timingRecomendado,
        horarioEspecifico: HorarioUtil.dateToHorarioString(rec.horarioEspecifico), // ACTUALIZADO: Usar HorarioUtil
        timingAdicional: rec.timingAdicional,
        prioridad: rec.prioridad,
        razonamiento: rec.razonamiento,
        dosis: rec.dosis || '',
        frecuencia: rec.frecuencia || '',
        respuestaUsuario: rec.respuestaUsuario,
        fechaCreacion: rec.fechaCreacion.toISOString(),
      })),
      fechaCreacion: plan.fechaCreacion.toISOString(),
    };
  }
}