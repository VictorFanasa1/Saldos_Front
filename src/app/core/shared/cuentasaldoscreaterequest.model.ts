
export interface CuentasSaldosCreateRequest {
  sCliente: string | null;
  sNombreCorto: string | null;
  sCuentaOracle: string | null;

  dRetencionCredito: number | null;
  sTerminoPago: string | null;
  dLimiteCredito: number | null;

  dTotalCartera: number | null;
  dPorVencer: number | null;
  dVencido: number | null;
  dVencido7Dias: number | null;
  dVencido8a14Dias: number | null;
  dVencido15a21Dias: number | null;
  dVencido22a28Dias: number | null;

  dTotalCredito: number | null;
  dPagosNoAplicados: number | null;

  sSucursal: string | null;
  sDeposito: string | null;
  sClaseCliente: string | null;
  sPerfilCliente: string | null;
  sNombreCadena: string | null;
  sPerfilCredito: string | null;
  sTipoCartera: string | null;
  sCobrador: string | null;
  sZona: string | null;
  sVendedor: string | null;
  sTerritorioVentas: string | null;
  sBrickKnb: string | null;
  sBrickIms: string | null;

  sGerenciaDivisional: string | null;
  sGerenteDivisional: string | null;
  sGerenciaTerritorial: string | null;
  sGerenteTerritorial: string | null;
  sGerenciaZona: string | null;
  sGerenteZona: string | null;

  sCanalVenta: string | null;
  sProyectoEstrategico: string | null;
  sEstatusCuenta: string | null;

  sCorreo: string | null;
  sTelefono: string | null;


  bProcesado?: boolean;


  dtCreate?: string;
  dtModificacion?: string;

  susuario_registra: string | null,
  susuario_actualiza: string | null,
  periodo_inicio: string | null,
  periodo_fin: string | null,
}
