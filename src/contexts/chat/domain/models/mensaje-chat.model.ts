export enum TipoMensaje {
    TEXTO='TEXTO',
    RECOMENDACION='RECOMENDACION',
    PLAN='PLAN'
  }
  
  export interface PrimitiveMensajeChat {
    id: string;
    conversacionId: string;
  
    rol: 'usuario' | 'asistente';
    contenido: string;
    metadatos: Record<string, any> | null;
    tipo: TipoMensaje;
  
    timestamp: Date;
  }
  
  export class MensajeChat {
    private constructor(private readonly _attributes: PrimitiveMensajeChat) {}
  
    static create(
      mensaje: Omit<PrimitiveMensajeChat, 'id' | 'timestamp'>
    ): MensajeChat {
      return new MensajeChat({
        id: crypto.randomUUID(),
        ...mensaje,
        timestamp: new Date()
      });
    }
  
    static fromPrimitives(primitives: PrimitiveMensajeChat): MensajeChat {
      return new MensajeChat(primitives);
    }
  
    // Getters
    get id(): string {
      return this._attributes.id;
    }
  
    get conversacionId(): string {
      return this._attributes.conversacionId;
    }
  
    get rol(): 'usuario' | 'asistente' {
      return this._attributes.rol;
    }
  
    get contenido(): string {
      return this._attributes.contenido;
    }
  
    get metadatos(): Record<string, any> | null {
      return this._attributes.metadatos;
    }
  
    get tipo(): TipoMensaje {
      return this._attributes.tipo;
    }
  
    get timestamp(): Date {
      return this._attributes.timestamp;
    }
  
    // Métodos de lógica
    esDeUsuario(): boolean {
      return this.rol === 'usuario';
    }
  
    esDeAsistente(): boolean {
      return this.rol === 'asistente';
    }
  
    actualizarContenido(nuevoContenido: string): MensajeChat {
      return new MensajeChat({
        ...this._attributes,
        contenido: nuevoContenido
      });
    }
  
    actualizarMetadatos(metadatos: Record<string, any> | null): MensajeChat {
      return new MensajeChat({
        ...this._attributes,
        metadatos
      });
    }
  
    toPrimitives(): PrimitiveMensajeChat {
      return { ...this._attributes };
    }
  }
  