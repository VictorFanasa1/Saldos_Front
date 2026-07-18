export interface ErrorLogRequest {
  idCuenta: number;
  contexto: string;
  mensaje: string;
  detalle?: string;
  folioIntentado?: string;
  usuario?: string;
  fecha: string;
}
