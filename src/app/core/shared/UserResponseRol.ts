export interface UserRolResponse{
    uiRow: Number,
    uiIdUsuario: Number,
    nombreUsario: string,
    id_rol: Number,
    dtCreate: string,
    ubicacion:string,
    dtModificacion: string,
     id_usuario_excel: string
     id_grupo: string
}

export interface getRolUserRequest{
    nombreUsuario: string

}
