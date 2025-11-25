export interface CuentasResponse {
  
     
    gerente?: string | null;
    periodo?: string | null;
    clientes_asignados?: number | null; 
    mes?: number | null;                
    cuota_mensual?: number | null;      
    porcentaje?: number | null;         
    
    clientes_auditados?: number | null;
    clientes_restantes?: number | null;
}