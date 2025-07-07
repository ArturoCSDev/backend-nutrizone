import { ControlFisicoRepository } from '../../domain/repositories/control-fisico.repository';
import { ClienteRepository } from '../../../client/domain/repositories/cliente.repository';
import { UsuarioRepository } from '../../../auth/domain/repositories/usuario.repository';
import { NotFoundException } from '../../../../shared/core/exceptions/not-found.exception';
import { GetControlFisicoDto, GetControlFisicoResponse } from './get-control-fisico.dto';

export class GetControlFisicoUseCase {
  constructor(
    private controlFisicoRepository: ControlFisicoRepository,
    private clienteRepository: ClienteRepository,
    private usuarioRepository: UsuarioRepository
  ) {}

  async execute(dto: GetControlFisicoDto): Promise<GetControlFisicoResponse> {
    // 1. Buscar el control físico por ID
    const controlFisico = await this.controlFisicoRepository.findById(dto.id);
    if (!controlFisico) {
      throw new NotFoundException('Control físico no encontrado');
    }

    // 2. Buscar el cliente asociado
    const cliente = await this.clienteRepository.findById(controlFisico.clienteId);
    if (!cliente) {
      throw new NotFoundException('Cliente asociado no encontrado');
    }

    // 3. Buscar información del usuario para obtener el nombre
    const usuario = await this.usuarioRepository.findById(cliente.usuarioId);

    // 4. Preparar información del cliente
    const clienteInfo = {
      id: cliente.id,
      nombre: usuario ? usuario.nombreCompleto : 'Usuario no encontrado',
      edad: cliente.edad,
      peso: cliente.peso ? Number(cliente.peso) : null,
      altura: cliente.altura ? Number(cliente.altura) : null,
      genero: cliente.genero,
      hasCompleteProfile: cliente.hasCompleteProfile(),
      //imc: cliente.imc ? Number(cliente.imc) : null
    };

    // 5. Preparar respuesta completa con todos los datos del control
    return {
      controlFisico: {
        id: controlFisico.id,
        clienteId: controlFisico.clienteId,
        planId: controlFisico.planId,
        fechaControl: controlFisico.fechaControl,
        
        // Métricas físicas
        peso: controlFisico.peso ? Number(controlFisico.peso) : null,
        grasaCorporal: controlFisico.grasaCorporal ? Number(controlFisico.grasaCorporal) : null,
        masaMuscular: controlFisico.masaMuscular ? Number(controlFisico.masaMuscular) : null,
        medidasAdicionales: controlFisico.medidasAdicionales,
        
        // Evaluación subjetiva
        nivelEnergia: controlFisico.nivelEnergia,
        estadoAnimo: controlFisico.estadoAnimo,
        notas: controlFisico.notas,
        
        // Control administrativo
        realizadoPor: controlFisico.realizadoPor,
        proximaCita: controlFisico.proximaCita,
        
        // Metadata calculada usando métodos del dominio
        hasCompleteMetrics: controlFisico.hasCompleteMetrics(),
        hasSubjectiveEvaluation: controlFisico.hasSubjectiveEvaluation(),
        tieneMetricasFisicas: controlFisico.tieneMetricasFisicas,
        tieneEvaluacionSubjetiva: controlFisico.tieneEvaluacionSubjetiva,
        isRecentControl: controlFisico.isRecentControl(),
        diasDesdeControl: controlFisico.diasDesdeControl,
        needsFollowUp: controlFisico.needsFollowUp(),
        
        // Validaciones
        isValidNivelEnergia: controlFisico.isValidNivelEnergia(),
        isValidEstadoAnimo: controlFisico.isValidEstadoAnimo(),
        
        // Timestamps
        fechaCreacion: controlFisico.fechaCreacion,
        fechaActualizacion: controlFisico.fechaActualizacion
      },
      cliente: clienteInfo
    };
  }
}