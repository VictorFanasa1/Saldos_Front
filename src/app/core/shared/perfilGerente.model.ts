export interface PerfilGerente {
  id: number;
  gerente: string;
  idGerente: string;
  clientesAsignados: number;
  periodo: string;
  mes: string;
  cuotaMensual: number;
  clientesAuditados: number;
  porcentaje: number;
  clientesRestantes: number;
  sucursal: string;
}

export interface PerfilGerenteResponse {
  hayDatos: boolean;
  mensaje: string;
  datos: PerfilGerente | null;
}
