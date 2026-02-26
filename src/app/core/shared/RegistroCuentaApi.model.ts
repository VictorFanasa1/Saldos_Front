export interface RegistroCuentaApi {
  id_registro: number;

  sucursal: string | null;
  cobrador: string | null;
  cliente: string | null;

  cuenta_oracle: string | null;
  perfil: string | null;
  documento: string | null;
  tipo: string | null;
  origen: string | null;

  fecha: string | null;
  fecha_vto: string | null;

  status: string | null;

  dias_vto: number;

  importe_original: number;
  iva: number;
  saldo_debido: number;
}