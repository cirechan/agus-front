export interface Partido {
  _id?: string;
  equipo: 
    | string 
    | {
        _id: string;
        nombre: string;
        categoria?: string;
      };
  rival: string;
  fecha: Date;
  hora: string;
  ubicacion: "casa" | "fuera";
  temporada: string | { _id: string; nombre: string };
  vestuarioLocal?: number;
  vestuarioVisitante?: number;
  equipacion: {
    color: "roja" | "azul" | "blanca" | "negra";
    tipo: "principal" | "alternativa";
  };
  campo?: string;
  resultado?: {
    golesLocal?: number;
    golesVisitante?: number;
    jugado: boolean;
  };
  observaciones?: string;
  createdAt?: Date;
  updatedAt?: Date;
}




export interface EstadisticasEquipo {
  equipo: string;
  partidosJugados: number;
  victorias: number;
  empates: number;
  derrotas: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
}

export interface PartidoFormData {
  equipo: string;
  rival: string;
  fecha: Date;
  hora: string;
  ubicacion: 'casa' | 'fuera';
  temporada: string;
  vestuarioLocal?: number;
  vestuarioVisitante?: number;
  equipacion: {
    color: 'roja' | 'azul' | 'blanca' | 'negra';
    tipo: 'principal' | 'alternativa';
  };
  campo?: string;
  observaciones?: string;
}

export interface ResultadoFormData {
  golesLocal: number;
  golesVisitante: number;
}
