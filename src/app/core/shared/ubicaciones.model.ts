export interface Ubicacion {
  idUbicacion: number;
  nombreUbicacion: string;
  fechaCreacion: string; 
  activo: number;  
}


export type CrearUbicacionDto = Omit<Ubicacion, 'idUbicacion' | 'fechaCreacion'>;