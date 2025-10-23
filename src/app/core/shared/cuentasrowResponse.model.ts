export interface IncidenciasRequest {
  uiRow: number;

  cliente: string;
  nombre_corto: string;
  cuenta_oracle: string;

  retencion_credito: number | null;
  termino_pago: string;
  limite_credito: number | null;
  total_cartera: number | null;
  por_vencer: number | null;
  vencido: number | null;
  vencido_7_dias: number | null;
  vencido_8_14_dias: number | null;
  vencido_15_21_dias: number | null;
  vencido_22_28_dias: number | null;
  total_credito: number | null;
  pagos_no_aplicados: number | null;

  sucursal: string;
  deposito: string;
  clase_cliente: string;
  perfil_cliente: string;
  nombre_cadena: string;
  perfil_credito: string;
  tipo_cartera: string;
  cobrador: string;
  zona: string;
  vendedor: string;
  territorio_ventas: string;
  brick_knb: string;
  brick_ims: string;
  gerencia_divisional: string;
  gerente_divisional: string;
  gerencia_territorial: string;
  gerente_territorial: string;
  gerencia_zona: string;
  gerente_zona: string;
  canal_venta: string;
  proyecto_estrategico: string;
  estatus_cuenta: string;
  correo: string;
  telefono: string;

  procesado: boolean;
  created_at: string;   // ISO string de fecha (o Date si lo prefieres)
  updated_at: string;

  usuario_registra: string;
  usuario_actualiza: string;
  otp: string;
  fecha_solucion: string;

  // columnas de pp (alias únicas)
  pp_uiRow: number;
  pp_uiRowCuenta: number;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  p5: number | null;
  comentarios: string | null;
  evidencia: string | null;
  pp_usuario_registra: string | null;
  pp_usuario_actualiza: string | null;
  p1_razon: string | null;
  p2_razon: string | null;
  p3_razon: string | null;
  p4_razon: string | null;
  p5_razon: string | null;
  folio_soporte: string | null;
  estatus: string | null;
  tipo_incidencia: string | null;
}
