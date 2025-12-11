import { Component, OnInit } from '@angular/core';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { RolesModel } from 'src/app/core/shared/roles.mnodel';
import { Ubicacion } from 'src/app/core/shared/ubicaciones.model';
import { CrearUsuarioDto, Usuario } from 'src/app/core/shared/Usuarios.model';
import { concatMap, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-configuraciones',
  templateUrl: './configuraciones.component.html',
  styleUrls: ['./configuraciones.component.css']
})
export class ConfiguracionesComponent implements OnInit {
  usuarios: Usuario[] = [];
    ubicaciones: Ubicacion[] = [];
    roles: RolesModel[] = [];
    ubicacionesAsignadas: [] = []
  searchTerm: string = '';

  selectedUsuario: Usuario | null = null;
  newUserPayload: Usuario | null = null;
  isSaving: boolean = false;

  errorMessage: string = '';

  constructor(private usuarioService:  SaldosService) { }

  ngOnInit(): void {
    this.iniciarCargaSecuencial()
    this.newUserPayload =  {
        uiRow: 0,
        uiIdUsuario: 0,
        nombreUsario: '',
        id_rol: 0,
        dtCreate: '',        
        dtModificacion: '', 
        id_usuario_excel: '',
        ubicacion: '',
        nombre_usuario_ad: '',
        id_grupo: '',
        password: ''
      }
  }

iniciarCargaSecuencial(): void {
  this.loadUbicaciones$().pipe(

    concatMap(() => this.loadRoles()),
   
    concatMap(() => this.loadUsuarios())
    
  ).subscribe({
    next: () => {
      // Todo este bloque solo se ejecuta cuando las 3 funciones han terminado exitosamente
      console.log('🎉 ¡Todas las cargas completadas en orden secuencial! 🎉');
      console.log('Datos finales:', this.ubicaciones, this.roles, this.usuarios);
    },
    error: (err) => {
      console.error('Ocurrió un error en alguna de las etapas:', err);
    }
  });
}
 loadUsuarios() : Observable<any>{

    return this.usuarioService.getUsuarios().pipe(
    tap(data => {
      this.usuarios = data;
      console.log('Usuarios cargados.');
    })
  );


  }
getNombreUbicacion(idUbicacion?: string | null): string {
    if (idUbicacion == null) return 'Sin ubicación';
    const u = this.ubicaciones.find(x => x.idUbicacion === Number(idUbicacion));
    return u ? u.nombreUbicacion : `Ubicación #${idUbicacion}`;
  }

  getNombreDelRol(idRol?: number | null): string{
    //console.log("El id recibido" + idRol)
    if(idRol == null) return 'No se definio el rol';
    
    //console.log("Busqueda principal: " + JSON.stringify(this.roles.find(x => x.idRol == '1')?.nombre))
    const u = this.roles.find(x => x.idRol == idRol.toString());
    //console.log("Encontrado: " + u)
     return u ? (u.nombre ?? 'Sin rol especifico') : 'Sin rol especifico';
  }
   loadUbicaciones$(): Observable<any>{
    return this.usuarioService.getUbicaciones().pipe(
      tap(data => {
        this.ubicaciones = data;
        console.log('Ubicaciones cargadas.');
      })
    );
  }
 loadRoles(): Observable<any>{
    return this.usuarioService.getRoles().pipe(
      tap(data => {
        this.roles = data;
        console.log('Roles cargados.');
      })
    );
  }
 // Lista filtrada por nombre
  get filteredUsuarios(): Usuario[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.usuarios;
    return this.usuarios.filter(u =>
      (u.nombreUsario || '').toLowerCase().includes(term)
    );
  }

  // Cuando se da clic en "Editar"
  onEdit(usuario: Usuario): void {
    // Clonamos para no tocar el original hasta guardar
    this.selectedUsuario = { ...usuario };
    this.errorMessage = '';
  }

  // Guardar cambios desde el modal
  onSave(): void {
    if (!this.selectedUsuario) return;

    this.isSaving = true;
    this.errorMessage = '';

    const id = this.selectedUsuario.uiRow;
    // Armamos el DTO sin uiRow, dtCreate y dtModificacion si tu API lo requiere
    const payload: CrearUsuarioDto = {
      uiRow: id,
      uiIdUsuario: this.selectedUsuario.uiIdUsuario,
      nombreUsario: this.selectedUsuario.nombreUsario,
      ubicacion: this.selectedUsuario.ubicacion?.toString(),
      id_rol: this.selectedUsuario.id_rol,
      id_usuario_excel: this.selectedUsuario.id_usuario_excel,
      id_grupo: this.selectedUsuario.id_grupo
    };

    this.usuarioService.updateUsuario(id, payload).subscribe({
      next: () => {
        this.isSaving = false;
        // Actualizamos la lista en memoria
        const idx = this.usuarios.findIndex(u => u.uiRow === id);
        if (idx !== -1) {
          this.usuarios[idx] = { ...this.usuarios[idx], ...this.selectedUsuario };
        }
        // Cerramos modal vía JS de Bootstrap o data-bs-dismiss
        const modalEl = document.getElementById('editUsuarioModal');
        if (modalEl) {
          const modal = (window as any).bootstrap?.Modal.getInstance(modalEl)
            || new (window as any).bootstrap.Modal(modalEl);
          modal.hide();
        }
      },
      error: (err) => {
        console.error(err);
        this.isSaving = false;
        this.errorMessage = 'Ocurrió un error al guardar los cambios.';
      }
    });
  }

  onSaveNewUser(): void{

    if (!this.newUserPayload) return;

    this.isSaving = true;
    this.errorMessage = '';


    const payload: CrearUsuarioDto = {
      uiRow: 0,
      uiIdUsuario: this.newUserPayload.uiIdUsuario,
      nombreUsario: this.newUserPayload.nombreUsario,
      nombre_usuario_ad: this.newUserPayload.nombre_usuario_ad,
      password: this.newUserPayload.password,
      ubicacion: this.newUserPayload.ubicacion?.toString(),
      id_rol: this.newUserPayload.id_rol,
      id_usuario_excel: this.newUserPayload.id_usuario_excel,
      id_grupo: this.newUserPayload.id_grupo
    };

     this.usuarioService.createUsuario( payload).subscribe({
      next: () => {
        this.isSaving = false;
        
        // Cerramos modal vía JS de Bootstrap o data-bs-dismiss
        const modalEl = document.getElementById('newUsuarioModal');
        if (modalEl) {
          const modal = (window as any).bootstrap?.Modal.getInstance(modalEl)
            || new (window as any).bootstrap.Modal(modalEl);
          modal.hide();
          location.reload();
        }
      },
      error: (err) => {
        console.error(err);
        this.isSaving = false;
        this.errorMessage = 'Ocurrió un error al guardar los cambios.';
      }
    });
  }

}
