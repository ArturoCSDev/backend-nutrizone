import { IsNotEmpty, IsUUID, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerAsesoriaCompletaDto {
  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  @IsUUID(4, { message: 'El ID del cliente debe ser un UUID válido' })
  clienteId: string;

  // Opciones para limitar datos históricos
  @IsOptional()
  @IsNumber({}, { message: 'Los días de historial deben ser un número' })
  @Min(7, { message: 'Mínimo 7 días de historial' })
  @Max(365, { message: 'Máximo 365 días de historial' })
  @Transform(({ value }) => parseInt(value))
  diasHistorial?: number; // Por defecto 90 días

  // Opciones para incluir/excluir secciones
  @IsOptional()
  @IsBoolean({ message: 'includeHistorialControles debe ser booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeHistorialControles?: boolean; // Por defecto true

  @IsOptional()
  @IsBoolean({ message: 'includeRecomendacionesHistoricas debe ser booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeRecomendacionesHistoricas?: boolean; // Por defecto false

  @IsOptional()
  @IsBoolean({ message: 'includeProductosDetalle debe ser booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeProductosDetalle?: boolean; // Por defecto true

  @IsOptional()
  @IsBoolean({ message: 'includeEstadisticas debe ser booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeEstadisticas?: boolean; // Por defecto true
}

// DTO para la respuesta completa
export interface VerAsesoriaCompletaResponse {
  cliente: ClienteCompletaInfo;
  planActivo: PlanActivoCompleto | null;
  recomendaciones: RecomendacionesCompletas;
  controlesFisicos: ControlesFisicosCompletos;
  estadisticas?: EstadisticasCliente;
  resumen: ResumenAsesoria;
  metadata: {
    fechaConsulta: string;
    diasHistorial: number;
    ultimaActualizacion: string;
  };
}

// Información completa del cliente
export interface ClienteCompletaInfo {
  // Datos básicos
  id: string;
  usuarioId: string;
  email: string;
  dni: string;
  nombreCompleto: string;
  edad: number | null;
  peso: number | null;
  altura: number | null;
  genero: string | null;
  telefono: string | null;
  nivelActividad: string | null;
  
  // Información física
  grasaCorporal: number | null;
  masaMuscular: number | null;
  metabolismoBasal: number | null;
  imc: number | null;
  
  // Estado del perfil
  hasCompleteProfile: boolean;
  active: boolean;
  
  // Preferencias
  preferencias: {
    id: string;
    productosFavoritos: string[];
    preferenciasDieteticas: string[];
    alergenos: string[];
    objetivosFitness: string[];
    diasEntrenamiento: string[];
    horariosEntrenamiento: string[];
    horaDespertar: string | null;
    horaDormir: string | null;
    hasCompleteSchedule: boolean;
  } | null;
  
  // Fechas
  fechaCreacion: string;
  fechaActualizacion: string;
}

// Plan activo completo
export interface PlanActivoCompleto {
  id: string;
  nombre: string;
  descripcion: string;
  objetivo: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string | null;
  duracion: number | null;
  
  // Objetivos nutricionales
  caloriasObjetivo: number | null;
  proteinaObjetivo: number | null;
  carbohidratosObjetivo: number | null;
  grasasObjetivo: number | null;
  
  // Datos iniciales
  pesoInicial: number | null;
  grasaInicial: number | null;
  muscularInicial: number | null;
  
  // Progreso
  diasRestantes: number | null;
  progreso: number; // 0-100
  estaActivo: boolean;
  puedeSerModificado: boolean;
  
  // Fechas
  fechaCreacion: string;
  fechaActualizacion: string;
}

// Recomendaciones completas
export interface RecomendacionesCompletas {
  activas: RecomendacionDetallada[];
  historicas?: RecomendacionDetallada[];
  resumen: {
    totalActivas: number;
    totalHistoricas: number;
    pendientes: number;
    aceptadas: number;
    rechazadas: number;
    modificadas: number;
    porPrioridad: {
      alta: number;
      media: number;
      baja: number;
    };
  };
  proximasRecomendaciones: RecomendacionDetallada[];
}

export interface RecomendacionDetallada {
  id: string;
  productoId: string;
  tamanoId: string | null;
  planId: string | null;
  tituloRecomendacion: string;
  iconoProducto: string;
  timingRecomendado: string;
  horarioEspecifico: string | null;
  timingAdicional: string | null;
  prioridad: string;
  razonamiento: string;
  dosis: string;
  frecuencia: string;
  respuestaUsuario: string;
  timingModificado: string | null;
  fechaCreacion: string;
  fechaRespuesta: string | null;
  
  // Estado
  esPendiente: boolean;
  esAceptada: boolean;
  esRechazada: boolean;
  haExpirado: boolean;
  
  // Producto (si se incluye)
  producto?: {
    id: string;
    nombre: string;
    descripcion: string | null;
    precio: number;
    proteina: number | null;
    calorias: number | null;
    categoria: string | null;
    sabor: string | null;
    urlImagen: string | null;
  };
}

// Controles físicos completos
export interface ControlesFisicosCompletos {
  ultimo: ControlFisicoDetallado | null;
  historial: ControlFisicoDetallado[];
  resumen: {
    totalControles: number;
    controlesConMetricas: number;
    controlesConEvaluacion: number;
    frecuenciaPromedio: number | null; // días entre controles
    ultimoControl: string | null;
    proximoControl: string | null;
  };
  tendencias: {
    peso: TendenciaMetrica | null;
    grasaCorporal: TendenciaMetrica | null;
    masaMuscular: TendenciaMetrica | null;
    nivelEnergia: TendenciaMetrica | null;
    estadoAnimo: TendenciaMetrica | null;
  };
}

export interface ControlFisicoDetallado {
  id: string;
  planId: string | null;
  fechaControl: string;
  
  // Métricas físicas
  peso: number | null;
  grasaCorporal: number | null;
  masaMuscular: number | null;
  medidasAdicionales: any | null;
  
  // Evaluación subjetiva
  nivelEnergia: number | null;
  estadoAnimo: number | null;
  notas: string | null;
  
  // Control administrativo
  realizadoPor: string | null;
  proximaCita: string | null;
  
  // Metadata
  hasCompleteMetrics: boolean;
  hasSubjectiveEvaluation: boolean;
  isRecentControl: boolean;
  diasDesdeControl: number;
  
  // Fechas
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface TendenciaMetrica {
  actual: number | null;
  anterior: number | null;
  cambio: number | null;
  porcentajeCambio: number | null;
  tendencia: 'subiendo' | 'bajando' | 'estable' | 'sin_datos';
  puntos: Array<{
    fecha: string;
    valor: number;
  }>;
}

// Estadísticas del cliente
export interface EstadisticasCliente {
  // Tiempo como cliente
  diasComoCliente: number;
  planesCompletados: number;
  planesTotales: number;
  
  // Actividad
  recomendacionesRecibidas: number;
  recomendacionesAceptadas: number;
  tasaAceptacion: number; // 0-100
  
  // Controles físicos
  controlesRealizados: number;
  frecuenciaControles: number | null; // días promedio
  
  // Progreso físico (si hay datos)
  cambiosPeso: {
    inicial: number | null;
    actual: number | null;
    cambio: number | null;
  };
  cambiosComposicion: {
    grasaInicial: number | null;
    grasaActual: number | null;
    muscularInicial: number | null;
    muscularActual: number | null;
  };
  
  // Engagement
  ultimaActividad: string | null;
  nivelActividad: 'alto' | 'medio' | 'bajo';
}

// Resumen de la asesoría
export interface ResumenAsesoria {
  estado: 'activo' | 'inactivo' | 'pausado';
  planActivo: boolean;
  recomendacionesPendientes: number;
  proximoControl: string | null;
  alertas: Array<{
    tipo: 'info' | 'warning' | 'error';
    mensaje: string;
    prioridad: 'alta' | 'media' | 'baja';
  }>;
  siguientesPasos: string[];
  notasImportantes: string[];
}