export interface Partido {
  id: string;
  fecha: Date;
  hora: string;
  equipo: string;
  rival: string;
  ubicacion: "casa" | "fuera";
  vestuarioLocal?: number;
  vestuarioVisitante?: number;
  equipacion: {
    color: string;
    tipo: string;
  };
  campo?: string;
  resultado?: {
    golesLocal: number;
    golesVisitante: number;
    jugado: boolean;
  };
}

export type PartidoFormData = Omit<Partido, 'id' | 'resultado'>;

export interface ResultadoFormData {
  golesLocal: number;
  golesVisitante: number;
}

export interface EquipoOption {
  value: string;
  label: string;
}

export interface VestuarioOption {
  value: number;
  label: string;
}

export interface EquipacionOption {
  value: string;
  label: string;
}

export const equiposOptions: EquipoOption[] = [
  { value: "CDT A", label: "CDT A" },
  { value: "CDT B", label: "CDT B" },
  { value: "BENJ A", label: "BENJ A" },
  { value: "BENJ B", label: "BENJ B" },
  { value: "BENJ C", label: "BENJ C" },
  { value: "BENJ D", label: "BENJ D" },
  { value: "PREBENJ A", label: "PREBENJ A" },
  { value: "PREBENJ B", label: "PREBENJ B" },
  { value: "ALE A", label: "ALE A" },
  { value: "ALE B", label: "ALE B" },
  { value: "ALE C", label: "ALE C" },
  { value: "INF A", label: "INF A" },
  { value: "INF B", label: "INF B" },
  { value: "INF C", label: "INF C" },
  { value: "JUV A", label: "JUV A" },
  { value: "REG A", label: "REG A" },
  { value: "REG B", label: "REG B" },
];

export const vestuariosOptions: VestuarioOption[] = [
  { value: 1, label: "Vestuario 1" },
  { value: 2, label: "Vestuario 2" },
  { value: 3, label: "Vestuario 3" },
  { value: 4, label: "Vestuario 4" },
  { value: 5, label: "Vestuario 5" },
  { value: 6, label: "Vestuario 6" },
  { value: 7, label: "Vestuario 7" },
];

export const equipacionOptions: EquipacionOption[] = [
  { value: "roja", label: "Roja" },
  { value: "azul", label: "Azul" },
  { value: "blanca", label: "Blanca" },
  { value: "negra", label: "Negra" },
  { value: "amarilla", label: "Amarilla" },
];
