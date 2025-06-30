export interface PrimitiveControlConsultaDiaria {
    id: string;
    clienteId: string;
    fecha: Date;
  
    consultasRealizadas: number;
    limiteConsultas: number;
  
    fechaCreacion: Date;
    fechaActualizacion: Date;
  }
  
  export class ControlConsultaDiaria {
    private constructor(private readonly _attributes: PrimitiveControlConsultaDiaria) {}
  
    static create(
      control: Omit<PrimitiveControlConsultaDiaria, 'id' | 'fechaCreacion' | 'fechaActualizacion'>
    ): ControlConsultaDiaria {
      const now = new Date();
      return new ControlConsultaDiaria({
        id: crypto.randomUUID(),
        ...control,
        consultasRealizadas: 0,
        limiteConsultas: control.limiteConsultas ?? 3,
        fechaCreacion: now,
        fechaActualizacion: now
      });
    }
  
    static fromPrimitives(primitives: PrimitiveControlConsultaDiaria): ControlConsultaDiaria {
      return new ControlConsultaDiaria(primitives);
    }
  
    // Getters
    get id(): string {
      return this._attributes.id;
    }
  
    get clienteId(): string {
      return this._attributes.clienteId;
    }
  
    get fecha(): Date {
      return this._attributes.fecha;
    }
  
    get consultasRealizadas(): number {
      return this._attributes.consultasRealizadas;
    }
  
    get limiteConsultas(): number {
      return this._attributes.limiteConsultas;
    }
  
    get fechaCreacion(): Date {
      return this._attributes.fechaCreacion;
    }
  
    get fechaActualizacion(): Date {
      return this._attributes.fechaActualizacion;
    }
  
    // Lógica de negocio
    puedeConsultar(): boolean {
      return this.consultasRealizadas < this.limiteConsultas;
    }
  
    incrementarConsulta(): ControlConsultaDiaria {
      if (!this.puedeConsultar()) {
        throw new Error('Límite de consultas alcanzado para este día.');
      }
  
      return new ControlConsultaDiaria({
        ...this._attributes,
        consultasRealizadas: this.consultasRealizadas + 1,
        fechaActualizacion: new Date()
      });
    }
  
    reiniciarContador(): ControlConsultaDiaria {
      return new ControlConsultaDiaria({
        ...this._attributes,
        consultasRealizadas: 0,
        fechaActualizacion: new Date()
      });
    }
  
    toPrimitives(): PrimitiveControlConsultaDiaria {
      return { ...this._attributes };
    }
  }
  