// src/shared/infrastructure/adapters/claude/claude.types.ts
import { ObjetivoNutricional, Prioridad, NivelActividad } from '@prisma/client';

// Tipos para entrada
export interface ClienteInfo {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  edad?: number;
  peso?: number;
  altura?: number;
  nivelActividad?: NivelActividad;
  genero?: string;
  grasaCorporal?: number;
  masaMuscular?: number;
  metabolismoBasal?: number;
}

export interface PreferenciasInfo {
  productosFavoritos: string[];
  preferenciasDieteticas: string[];
  alergenos: string[];
  objetivosFitness: ObjetivoNutricional[];
  diasEntrenamiento: string[];
  horariosEntrenamiento: string[];
  horaDespertar?: string;
  horaDormir?: string;
}

export interface ProductoInfo {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  sabor?: string;
  tamano?: string;
  proteina?: number;
  calorias?: number;
  carbohidratos?: number;
  grasas?: number;
  fibra?: number;
  azucar?: number;
  momentosRecomendados: string[];
  precio: number;
}

export interface GeneratePlanInput {
  cliente: ClienteInfo;
  preferencias?: PreferenciasInfo;
  productosDisponibles: ProductoInfo[];
  objetivo: ObjetivoNutricional;
  duracionDias?: number;
}

// Tipos para salida
export interface PlanGeneradoOutput {
  nombre: string;
  descripcion: string;
  duracionDias: number;
  objetivo: ObjetivoNutricional;
  caloriasObjetivo: number;
  proteinaObjetivo: number;
  carbohidratosObjetivo: number;
  grasasObjetivo: number;
  instruccionesGenerales: string;
  recomendaciones: RecomendacionGenerada[];
}

export interface RecomendacionGenerada {
  productoId: string;
  tamanoId?: string;
  tituloRecomendacion: string;
  iconoProducto: string;
  timingRecomendado: string;
  horarioEspecifico?: string; // formato "HH:mm"
  timingAdicional?: string;
  prioridad: Prioridad;
  razonamiento: string;
  dosis: string;
  frecuencia: string;
}

// Tipos para la API de Claude
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeRequest {
  model: string;
  max_tokens: number;
  temperature: number;
  messages: ClaudeMessage[];
}

export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeError {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}