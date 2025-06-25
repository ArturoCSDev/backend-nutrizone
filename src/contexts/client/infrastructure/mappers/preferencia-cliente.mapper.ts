import { PreferenciaCliente as PrismaPreferenciaCliente } from '@prisma/client';
import { PreferenciaCliente, PrimitivePreferenciaCliente } from '../../domain/models/preferencia-cliente.model';

export class PreferenciaClienteMapper {
  static toDomain(prismaPreferencia: PrismaPreferenciaCliente): PreferenciaCliente {
    const primitives: PrimitivePreferenciaCliente = {
      id: prismaPreferencia.id,
      clienteId: prismaPreferencia.clienteId,
      productosFavoritos: prismaPreferencia.productosFavoritos,
      preferenciasDieteticas: prismaPreferencia.preferenciasDieteticas,
      alergenos: prismaPreferencia.alergenos,
      objetivosFitness: prismaPreferencia.objetivosFitness,
      diasEntrenamiento: prismaPreferencia.diasEntrenamiento,
      horariosEntrenamiento: prismaPreferencia.horariosEntrenamiento,
      horaDespertar: prismaPreferencia.horaDespertar,
      horaDormir: prismaPreferencia.horaDormir,
      fechaCreacion: prismaPreferencia.fechaCreacion,
      fechaActualizacion: prismaPreferencia.fechaActualizacion,
    };

    return PreferenciaCliente.fromPrimitives(primitives);
  }

  static toPrisma(preferencia: PreferenciaCliente): Omit<PrismaPreferenciaCliente, 'fechaCreacion' | 'fechaActualizacion'> {
    const primitives = preferencia.toPrimitives();
    
    return {
      id: primitives.id,
      clienteId: primitives.clienteId,
      productosFavoritos: primitives.productosFavoritos,
      preferenciasDieteticas: primitives.preferenciasDieteticas,
      alergenos: primitives.alergenos,
      objetivosFitness: primitives.objetivosFitness,
      diasEntrenamiento: primitives.diasEntrenamiento,
      horariosEntrenamiento: primitives.horariosEntrenamiento,
      horaDespertar: primitives.horaDespertar,
      horaDormir: primitives.horaDormir,
    };
  }

  static toDomainList(prismaPreferencias: PrismaPreferenciaCliente[]): PreferenciaCliente[] {
    return prismaPreferencias.map(this.toDomain);
  }
}
