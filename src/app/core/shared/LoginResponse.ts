export interface LoginResponse {
  uiNumeroEmpleado: number;
  sNombreEmpleado: string;
}

export interface User {
  username: string;
  numeroempleado: string;
  token: string;
  idusuariobd: Number;
  role: 'ADMIN' | 'AGENTE' | 'GERENTE' | '';
}
