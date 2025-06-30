export interface PrimitiveControlFisico {
    id: string;
    clienteId: string;
    planId: string | null;
  
    fechaControl: Date;
  
    peso: number | null;
    grasaCorporal: number | null;
    masaMuscular: number | null;
  
    medidasAdicionales: Record<string, any> | null;
  
    nivelEnergia: number | null;
    estadoAnimo: number | null;
    notas: string | null;
  
    realizadoPor: string | null;
    proximaCita: Date | null;
  
    fechaCreacion: Date;
    fechaActualizacion: Date;
  }
  
  export class ControlFisico {
    private constructor(private readonly _attributes: PrimitiveControlFisico) {}
  
    static create(
      control: Omit<PrimitiveControlFisico, 'id' | 'fechaCreacion' | 'fechaActualizacion'>
    ): ControlFisico {
      const now = new Date();
      return new ControlFisico({
        id: crypto.randomUUID(),
        ...control,
        fechaCreacion: now,
        fechaActualizacion: now
      });
    }
  
    static fromPrimitives(primitives: PrimitiveControlFisico): ControlFisico {
      return new ControlFisico(primitives);
    }
  
    // Getters
    get id(): string {
      return this._attributes.id;
    }
  
    get clienteId(): string {
      return this._attributes.clienteId;
    }
  
    get planId(): string | null {
      return this._attributes.planId;
    }
  
    get fechaControl(): Date {
      return this._attributes.fechaControl;
    }
  
    get peso(): number | null {
      return this._attributes.peso;
    }
  
    get grasaCorporal(): number | null {
      return this._attributes.grasaCorporal;
    }
  
    get masaMuscular(): number | null {
      return this._attributes.masaMuscular;
    }
  
    get medidasAdicionales(): Record<string, any> | null {
      return this._attributes.medidasAdicionales;
    }
  
    get nivelEnergia(): number | null {
      return this._attributes.nivelEnergia;
    }
  
    get estadoAnimo(): number | null {
      return this._attributes.estadoAnimo;
    }
  
    get notas(): string | null {
      return this._attributes.notas;
    }
  
    get realizadoPor(): string | null {
      return this._attributes.realizadoPor;
    }
  
    get proximaCita(): Date | null {
      return this._attributes.proximaCita;
    }
  
    get fechaCreacion(): Date {
      return this._attributes.fechaCreacion;
    }
  
    get fechaActualizacion(): Date {
      return this._attributes.fechaActualizacion;
    }
  
    // Métodos de negocio
    tieneNotas(): boolean {
      return !!this.notas && this.notas.trim().length > 0;
    }
  
    tieneMedidasAdicionales(): boolean {
      return this.medidasAdicionales !== null && Object.keys(this.medidasAdicionales).length > 0;
    }
  
    updateNotas(nuevasNotas: string | null): ControlFisico {
      return new ControlFisico({
        ...this._attributes,
        notas: nuevasNotas,
        fechaActualizacion: new Date()
      });
    }
  
    updateMedidasAdicionales(nuevasMedidas: Record<string, any>): ControlFisico {
      return new ControlFisico({
        ...this._attributes,
        medidasAdicionales: nuevasMedidas,
        fechaActualizacion: new Date()
      });
    }
  
    actualizarPeso(peso: number | null): ControlFisico {
      return new ControlFisico({
        ...this._attributes,
        peso,
        fechaActualizacion: new Date()
      });
    }
  
    toPrimitives(): PrimitiveControlFisico {
      return { ...this._attributes };
    }
  }
  