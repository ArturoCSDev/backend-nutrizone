import { UsuarioRepository } from '../../../auth/domain/repositories/usuario.repository';
import { ClienteRepository } from '../../../client/domain/repositories/cliente.repository';
import { PreferenciaClienteRepository } from '../../../client/domain/repositories/preferencia-cliente.repository';
import { PlanNutricionalRepository } from '../../domain/repositories/plan-nutricional.repository';
import { RecomendacionNutricionalRepository } from '../../domain/repositories/recomendacion-nutricional.repository';
import { ControlFisicoRepository } from '../../domain/repositories/control-fisico.repository';
import { ProductoRepository } from '../../../products/domain/repositories/producto.repository';
import { NotFoundException } from '../../../../shared/core/exceptions/not-found.exception';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';
import { HorarioUtil } from '../../../../shared/infrastructure/utils/horario.util';
import { 
  VerAsesoriaCompletaDto, 
  VerAsesoriaCompletaResponse,
  ClienteCompletaInfo,
  PlanActivoCompleto,
  RecomendacionesCompletas,
  RecomendacionDetallada,
  ControlesFisicosCompletos,
  ControlFisicoDetallado,
  TendenciaMetrica,
  EstadisticasCliente,
  ResumenAsesoria
} from './ver-asesoria-completa.dto';

export class VerAsesoriaCompletaUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly clienteRepository: ClienteRepository,
    private readonly preferenciaClienteRepository: PreferenciaClienteRepository,
    private readonly planNutricionalRepository: PlanNutricionalRepository,
    private readonly recomendacionNutricionalRepository: RecomendacionNutricionalRepository,
    private readonly controlFisicoRepository: ControlFisicoRepository,
    private readonly productoRepository: ProductoRepository
  ) {}

  async execute(dto: VerAsesoriaCompletaDto): Promise<VerAsesoriaCompletaResponse> {
    logger.info('Iniciando consulta de asesoría completa', { 
      clienteId: dto.clienteId,
      diasHistorial: dto.diasHistorial || 90
    });

    // Configurar opciones por defecto
    const options = {
      diasHistorial: dto.diasHistorial || 90,
      includeHistorialControles: dto.includeHistorialControles ?? true,
      includeRecomendacionesHistoricas: dto.includeRecomendacionesHistoricas ?? false,
      includeProductosDetalle: dto.includeProductosDetalle ?? true,
      includeEstadisticas: dto.includeEstadisticas ?? true
    };

    // 1. Obtener información completa del cliente
    const cliente = await this.getClienteCompleto(dto.clienteId);
    
    // 2. Obtener plan activo
    const planActivo = await this.getPlanActivoCompleto(dto.clienteId);
    
    // 3. Obtener recomendaciones
    const recomendaciones = await this.getRecomendacionesCompletas(
      dto.clienteId, 
      options.includeRecomendacionesHistoricas,
      options.includeProductosDetalle
    );
    
    // 4. Obtener controles físicos
    const controlesFisicos = await this.getControlesFisicosCompletos(
      dto.clienteId,
      options.diasHistorial,
      options.includeHistorialControles
    );
    
    // 5. Calcular estadísticas (si se requiere)
    const estadisticas = options.includeEstadisticas 
      ? await this.calcularEstadisticas(dto.clienteId, planActivo, recomendaciones, controlesFisicos)
      : undefined;
    
    // 6. Generar resumen y alertas
    const resumen = this.generarResumenAsesoria(
      cliente,
      planActivo,
      recomendaciones,
      controlesFisicos,
      estadisticas
    );

    logger.success('Asesoría completa obtenida exitosamente', {
      clienteId: dto.clienteId,
      planActivo: !!planActivo,
      recomendacionesActivas: recomendaciones.activas.length,
      controlesHistorial: controlesFisicos.historial.length,
      tieneEstadisticas: !!estadisticas
    });

    return {
      cliente,
      planActivo,
      recomendaciones,
      controlesFisicos,
      estadisticas,
      resumen,
      metadata: {
        fechaConsulta: new Date().toISOString(),
        diasHistorial: options.diasHistorial,
        ultimaActualizacion: new Date().toISOString()
      }
    };
  }

  private async getClienteCompleto(clienteId: string): Promise<ClienteCompletaInfo> {
    const cliente = await this.clienteRepository.findById(clienteId);
    if (!cliente) {
      throw new NotFoundException('Cliente', { clienteId });
    }

    const usuario = await this.usuarioRepository.findById(cliente.usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario asociado al cliente', { clienteId });
    }

    const preferencias = await this.preferenciaClienteRepository.findByClienteId(clienteId);

    return {
      id: cliente.id,
      usuarioId: cliente.usuarioId,
      email: usuario.email,
      dni: usuario.dni,
      nombreCompleto: usuario.nombreCompleto,
      edad: cliente.edad,
      peso: cliente.peso ? Number(cliente.peso) : null,
      altura: cliente.altura ? Number(cliente.altura) : null,
      genero: cliente.genero,
      telefono: cliente.telefono,
      nivelActividad: cliente.nivelActividad,
      grasaCorporal: cliente.grasaCorporal ? Number(cliente.grasaCorporal) : null,
      masaMuscular: cliente.masaMuscular ? Number(cliente.masaMuscular) : null,
      metabolismoBasal: cliente.metabolismoBasal,
      imc: cliente.imc ? Number(cliente.imc) : null,
      hasCompleteProfile: cliente.hasCompleteProfile(),
      active: usuario.active,
      preferencias: preferencias ? {
        id: preferencias.id,
        productosFavoritos: preferencias.productosFavoritos,
        preferenciasDieteticas: preferencias.preferenciasDieteticas,
        alergenos: preferencias.alergenos,
        objetivosFitness: preferencias.objetivosFitness,
        diasEntrenamiento: preferencias.diasEntrenamiento,
        horariosEntrenamiento: preferencias.horariosEntrenamiento,
        horaDespertar: HorarioUtil.dateToHorarioString(preferencias.horaDespertar),
        horaDormir: HorarioUtil.dateToHorarioString(preferencias.horaDormir),
        hasCompleteSchedule: preferencias.hasCompleteSchedule()
      } : null,
      fechaCreacion: cliente.fechaCreacion.toISOString(),
      fechaActualizacion: cliente.fechaActualizacion.toISOString()
    };
  }

  private async getPlanActivoCompleto(clienteId: string): Promise<PlanActivoCompleto | null> {
    const plan = await this.planNutricionalRepository.findActiveByClienteId(clienteId);
    if (!plan) return null;

    const diasRestantes = plan.daysRemaining;
    const progreso = this.calculateProgreso(plan);

    return {
      id: plan.id,
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
      diasRestantes,
      progreso,
      estaActivo: plan.isActive,
      puedeSerModificado: plan.canBeModified(),
      fechaCreacion: plan.fechaCreacion.toISOString(),
      fechaActualizacion: plan.fechaActualizacion.toISOString()
    };
  }

  private async getRecomendacionesCompletas(
    clienteId: string,
    includeHistoricas: boolean,
    includeProductos: boolean
  ): Promise<RecomendacionesCompletas> {
    const todasRecomendaciones = await this.recomendacionNutricionalRepository.findByClienteId(clienteId);
    
    const activas = todasRecomendaciones.filter(rec => rec.isPending);
    const historicas = includeHistoricas ? todasRecomendaciones.filter(rec => !rec.isPending) : [];

    // Obtener productos si se solicita
    const productosMap = new Map();
    if (includeProductos) {
      const productosIds = [...new Set(todasRecomendaciones.map(rec => rec.productoId))];
      const productos = await this.productoRepository.findByIds(productosIds);
      productos.forEach(producto => productosMap.set(producto.id, producto));
    }

    const mapRecomendacion = (rec: any): RecomendacionDetallada => ({
      id: rec.id,
      productoId: rec.productoId,
      tamanoId: rec.tamanoId,
      planId: rec.planId,
      tituloRecomendacion: rec.tituloRecomendacion || '',
      iconoProducto: rec.iconoProducto || '🥤',
      timingRecomendado: rec.timingRecomendado,
      horarioEspecifico: HorarioUtil.dateToHorarioString(rec.horarioEspecifico),
      timingAdicional: rec.timingAdicional,
      prioridad: rec.prioridad,
      razonamiento: rec.razonamiento,
      dosis: rec.dosis || '',
      frecuencia: rec.frecuencia || '',
      respuestaUsuario: rec.respuestaUsuario,
      timingModificado: rec.timingModificado,
      fechaCreacion: rec.fechaCreacion.toISOString(),
      fechaRespuesta: rec.fechaRespuesta?.toISOString() || null,
      esPendiente: rec.isPending,
      esAceptada: rec.isAccepted,
      esRechazada: rec.isRejected,
      haExpirado: rec.hasExpired(),
      producto: productosMap.get(rec.productoId) ? {
        id: productosMap.get(rec.productoId).id,
        nombre: productosMap.get(rec.productoId).nombre,
        descripcion: productosMap.get(rec.productoId).descripcion,
        precio: Number(productosMap.get(rec.productoId).precio),
        proteina: productosMap.get(rec.productoId).proteina,
        calorias: productosMap.get(rec.productoId).calorias,
        categoria: productosMap.get(rec.productoId).categoria?.nombre || null,
        sabor: productosMap.get(rec.productoId).sabor?.nombre || null,
        urlImagen: productosMap.get(rec.productoId).urlImagen
      } : undefined
    });

    // Resumen de recomendaciones
    const pendientes = todasRecomendaciones.filter(rec => rec.isPending).length;
    const aceptadas = todasRecomendaciones.filter(rec => rec.isAccepted).length;
    const rechazadas = todasRecomendaciones.filter(rec => rec.isRejected).length;
    const modificadas = todasRecomendaciones.filter(rec => rec.isModified).length;

    const alta = todasRecomendaciones.filter(rec => rec.hasHighPriority).length;
    const media = todasRecomendaciones.filter(rec => rec.hasMediumPriority).length;
    const baja = todasRecomendaciones.filter(rec => rec.hasLowPriority).length;

    const proximasRecomendaciones = activas
      .filter(rec => rec.hasHighPriority)
      .slice(0, 3)
      .map(mapRecomendacion);

    return {
      activas: activas.map(mapRecomendacion),
      historicas: includeHistoricas ? historicas.map(mapRecomendacion) : undefined,
      resumen: {
        totalActivas: activas.length,
        totalHistoricas: historicas.length,
        pendientes,
        aceptadas,
        rechazadas,
        modificadas,
        porPrioridad: { alta, media, baja }
      },
      proximasRecomendaciones
    };
  }

  private async getControlesFisicosCompletos(
    clienteId: string,
    diasHistorial: number,
    includeHistorial: boolean
  ): Promise<ControlesFisicosCompletos> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasHistorial);

    const todosControles = includeHistorial 
      ? await this.controlFisicoRepository.findByClienteId(clienteId)
      : await this.controlFisicoRepository.findRecentByClienteId(clienteId, 30);

    const controlesFiltrados = todosControles.filter(control => 
      control.fechaControl >= fechaLimite
    );

    const ultimo = controlesFiltrados.length > 0 ? controlesFiltrados[0] : null;

    const mapControl = (control: any): ControlFisicoDetallado => ({
      id: control.id,
      planId: control.planId,
      fechaControl: control.fechaControl.toISOString(),
      peso: control.peso ? Number(control.peso) : null,
      grasaCorporal: control.grasaCorporal ? Number(control.grasaCorporal) : null,
      masaMuscular: control.masaMuscular ? Number(control.masaMuscular) : null,
      medidasAdicionales: control.medidasAdicionales,
      nivelEnergia: control.nivelEnergia,
      estadoAnimo: control.estadoAnimo,
      notas: control.notas,
      realizadoPor: control.realizadoPor,
      proximaCita: control.proximaCita?.toISOString() || null,
      hasCompleteMetrics: control.hasCompleteMetrics(),
      hasSubjectiveEvaluation: control.hasSubjectiveEvaluation(),
      isRecentControl: control.isRecentControl(),
      diasDesdeControl: control.diasDesdeControl,
      fechaCreacion: control.fechaCreacion.toISOString(),
      fechaActualizacion: control.fechaActualizacion.toISOString()
    });

    // Calcular tendencias
    const tendencias = this.calcularTendencias(controlesFiltrados);

    // Calcular resumen
    const controlesConMetricas = controlesFiltrados.filter(c => c.hasCompleteMetrics()).length;
    const controlesConEvaluacion = controlesFiltrados.filter(c => c.hasSubjectiveEvaluation()).length;
    const frecuenciaPromedio = this.calcularFrecuenciaPromedio(controlesFiltrados);

    return {
      ultimo: ultimo ? mapControl(ultimo) : null,
      historial: includeHistorial ? controlesFiltrados.map(mapControl) : [],
      resumen: {
        totalControles: controlesFiltrados.length,
        controlesConMetricas,
        controlesConEvaluacion,
        frecuenciaPromedio,
        ultimoControl: ultimo?.fechaControl.toISOString() || null,
        proximoControl: ultimo?.proximaCita?.toISOString() || null
      },
      tendencias
    };
  }

  private calcularTendencias(controles: any[]): any {
    const calcularTendencia = (campo: string): TendenciaMetrica | null => {
      const valoresConFecha = controles
        .filter(c => c[campo] !== null)
        .map(c => ({
          fecha: c.fechaControl.toISOString(),
          valor: Number(c[campo])
        }))
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

      if (valoresConFecha.length < 2) {
        return valoresConFecha.length === 1 ? {
          actual: valoresConFecha[0].valor,
          anterior: null,
          cambio: null,
          porcentajeCambio: null,
          tendencia: 'sin_datos' as const,
          puntos: valoresConFecha
        } : null;
      }

      const actual = valoresConFecha[valoresConFecha.length - 1].valor;
      const anterior = valoresConFecha[valoresConFecha.length - 2].valor;
      const cambio = actual - anterior;
      const porcentajeCambio = ((cambio / anterior) * 100);

      let tendencia: 'subiendo' | 'bajando' | 'estable' = 'estable';
      if (Math.abs(porcentajeCambio) > 2) {
        tendencia = cambio > 0 ? 'subiendo' : 'bajando';
      }

      return {
        actual,
        anterior,
        cambio,
        porcentajeCambio,
        tendencia,
        puntos: valoresConFecha
      };
    };

    return {
      peso: calcularTendencia('peso'),
      grasaCorporal: calcularTendencia('grasaCorporal'),
      masaMuscular: calcularTendencia('masaMuscular'),
      nivelEnergia: calcularTendencia('nivelEnergia'),
      estadoAnimo: calcularTendencia('estadoAnimo')
    };
  }

  private calcularFrecuenciaPromedio(controles: any[]): number | null {
    if (controles.length < 2) return null;

    const fechas = controles
      .map(c => c.fechaControl.getTime())
      .sort((a, b) => a - b);

    const intervalos = [];
    for (let i = 1; i < fechas.length; i++) {
      const dias = Math.ceil((fechas[i] - fechas[i - 1]) / (1000 * 60 * 60 * 24));
      intervalos.push(dias);
    }

    return Math.round(intervalos.reduce((sum, interval) => sum + interval, 0) / intervalos.length);
  }

  private async calcularEstadisticas(
    clienteId: string,
    planActivo: PlanActivoCompleto | null,
    recomendaciones: RecomendacionesCompletas,
    controlesFisicos: ControlesFisicosCompletos
  ): Promise<EstadisticasCliente> {
    const cliente = await this.clienteRepository.findById(clienteId);
    const todosPlanes = await this.planNutricionalRepository.findByClienteId(clienteId);

    // Tiempo como cliente
    const diasComoCliente = Math.ceil(
      (new Date().getTime() - cliente!.fechaCreacion.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Planes
    const planesCompletados = todosPlanes.filter(p => p.isCompleted).length;
    const planesTotales = todosPlanes.length;

    // Recomendaciones
    const totalRecomendaciones = recomendaciones.resumen.totalActivas + recomendaciones.resumen.totalHistoricas;
    const recomendacionesAceptadas = recomendaciones.resumen.aceptadas;
    const tasaAceptacion = totalRecomendaciones > 0 ? 
      Math.round((recomendacionesAceptadas / totalRecomendaciones) * 100) : 0;

    // Controles
    const controlesRealizados = controlesFisicos.resumen.totalControles;
    const frecuenciaControles = controlesFisicos.resumen.frecuenciaPromedio;

    // Cambios físicos
    const cambiosPeso = {
      inicial: planActivo?.pesoInicial || null,
      actual: controlesFisicos.ultimo?.peso || null,
      cambio: null as number | null
    };
    if (cambiosPeso.inicial && cambiosPeso.actual) {
      cambiosPeso.cambio = cambiosPeso.actual - cambiosPeso.inicial;
    }

    const cambiosComposicion = {
      grasaInicial: planActivo?.grasaInicial || null,
      grasaActual: controlesFisicos.ultimo?.grasaCorporal || null,
      muscularInicial: planActivo?.muscularInicial || null,
      muscularActual: controlesFisicos.ultimo?.masaMuscular || null
    };

    // Nivel de actividad
    const ultimaActividad = controlesFisicos.ultimo?.fechaControl || 
                           recomendaciones.activas[0]?.fechaCreacion || null;
    
    let nivelActividad: 'alto' | 'medio' | 'bajo' = 'bajo';
    if (ultimaActividad) {
      const diasDesdeUltimaActividad = Math.ceil(
        (new Date().getTime() - new Date(ultimaActividad).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diasDesdeUltimaActividad <= 7) nivelActividad = 'alto';
      else if (diasDesdeUltimaActividad <= 30) nivelActividad = 'medio';
    }

    return {
      diasComoCliente,
      planesCompletados,
      planesTotales,
      recomendacionesRecibidas: totalRecomendaciones,
      recomendacionesAceptadas,
      tasaAceptacion,
      controlesRealizados,
      frecuenciaControles,
      cambiosPeso,
      cambiosComposicion,
      ultimaActividad,
      nivelActividad
    };
  }

  private generarResumenAsesoria(
    cliente: ClienteCompletaInfo,
    planActivo: PlanActivoCompleto | null,
    recomendaciones: RecomendacionesCompletas,
    controlesFisicos: ControlesFisicosCompletos,
    estadisticas?: EstadisticasCliente
  ): ResumenAsesoria {
    const alertas: Array<{
      tipo: 'info' | 'warning' | 'error';
      mensaje: string;
      prioridad: 'alta' | 'media' | 'baja';
    }> = [];

    const siguientesPasos: string[] = [];
    const notasImportantes: string[] = [];

    // Determinar estado general
    let estado: 'activo' | 'inactivo' | 'pausado' = 'inactivo';
    if (planActivo?.estaActivo) {
      estado = 'activo';
    } else if (planActivo && !planActivo.estaActivo) {
      estado = 'pausado';
    }

    // Generar alertas
    if (!planActivo) {
      alertas.push({
        tipo: 'warning',
        mensaje: 'El cliente no tiene un plan nutricional activo',
        prioridad: 'alta'
      });
      siguientesPasos.push('Crear un nuevo plan nutricional personalizado');
    }

    if (recomendaciones.resumen.pendientes > 0) {
      alertas.push({
        tipo: 'info',
        mensaje: `Hay ${recomendaciones.resumen.pendientes} recomendaciones pendientes de respuesta`,
        prioridad: 'media'
      });
      siguientesPasos.push('Revisar recomendaciones pendientes con el cliente');
    }

    if (!controlesFisicos.ultimo) {
      alertas.push({
        tipo: 'warning',
        mensaje: 'No hay controles físicos registrados',
        prioridad: 'alta'
      });
      siguientesPasos.push('Programar primer control físico');
    } else {
      const diasSinControl = controlesFisicos.ultimo.diasDesdeControl;
      if (diasSinControl > 30) {
        alertas.push({
          tipo: 'warning',
          mensaje: `Último control físico hace ${diasSinControl} días`,
          prioridad: 'media'
        });
        siguientesPasos.push('Programar nuevo control físico');
      }
    }

    if (!cliente.hasCompleteProfile) {
      alertas.push({
        tipo: 'warning',
        mensaje: 'Perfil del cliente incompleto',
        prioridad: 'media'
      });
      siguientesPasos.push('Completar información del perfil del cliente');
    }

    if (!cliente.preferencias) {
      alertas.push({
        tipo: 'info',
        mensaje: 'No se han configurado preferencias nutricionales',
        prioridad: 'baja'
      });
      siguientesPasos.push('Configurar preferencias alimentarias y objetivos');
    }

    // Notas importantes
    if (cliente.preferencias?.alergenos.length) {
      notasImportantes.push(`⚠️ Alergias: ${cliente.preferencias.alergenos.join(', ')}`);
    }

    if (planActivo?.diasRestantes && planActivo.diasRestantes <= 7) {
      notasImportantes.push(`📅 Plan actual termina en ${planActivo.diasRestantes} días`);
    }

    if (estadisticas?.tasaAceptacion && estadisticas.tasaAceptacion < 50) {
      notasImportantes.push(`📊 Baja tasa de aceptación de recomendaciones (${estadisticas.tasaAceptacion}%)`);
    }

    // Próximo control
    const proximoControl = controlesFisicos.ultimo?.proximaCita || null;

    return {
      estado,
      planActivo: !!planActivo,
      recomendacionesPendientes: recomendaciones.resumen.pendientes,
      proximoControl,
      alertas,
      siguientesPasos,
      notasImportantes
    };
  }

  private calculateProgreso(plan: any): number {
    if (!plan.duracion || !plan.fechaInicio) {
      return 0;
    }

    const now = new Date();
    const fechaInicio = plan.fechaInicio;
    const duracionMs = plan.duracion * 24 * 60 * 60 * 1000;
    const transcurridoMs = now.getTime() - fechaInicio.getTime();
    
    if (transcurridoMs <= 0) return 0;
    if (transcurridoMs >= duracionMs) return 100;

    return Math.round((transcurridoMs / duracionMs) * 100);
  }
}