export interface Usuario {
  uiRow: number;
  uiIdUsuario?: number;
  nombreUsario?: string;
  id_rol?: number;
  dtCreate: string;        
  dtModificacion: string; 
  id_usuario_excel?: string;
  ubicacion?: string;
  nombre_usuario_ad?: string;
  id_grupo?: string;
  password?: string;
}

export type CrearUsuarioDto = Omit<Usuario,  'dtCreate' | 'dtModificacion'>;