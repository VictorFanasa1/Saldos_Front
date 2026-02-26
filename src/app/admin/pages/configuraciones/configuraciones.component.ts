import { Component, OnInit } from '@angular/core';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { RolesModel } from 'src/app/core/shared/roles.mnodel';
import { Ubicacion } from 'src/app/core/shared/ubicaciones.model';
import { CrearUsuarioDto, Usuario } from 'src/app/core/shared/Usuarios.model';
import { concatMap, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { UiService } from 'src/app/shared/service/ui.service';
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
  rol = "0"
  selectedUsuario: Usuario | null = null;
  selectedUbicaciones: number[] = [];
  newUserPayload: Usuario | null = null;
  newUserUbicaciones: number[] = [];
  isSaving: boolean = false;
 showfirstcard= true;
  errorMessage: string = '';

  constructor(private usuarioService:  SaldosService, private ui: UiService) { }

  ngOnInit(): void {
    this.rol = localStorage.getItem('id_rol') ?? '0'

    if(this.rol == '3'){
      this.setMenuAdmin()
      this.showfirstcard = false
    }else{
      this.setMenu();
      this.showfirstcard = true
    }
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
        password: '',
        correo: ''
      }
    this.newUserUbicaciones = [];
  }
 setMenu(){
    this.ui.showNavbar(true)
              this.ui.showAdmin(true)
              this.ui.showHeaderset(true)
              this.ui.showrRepresentante(false)
               this.ui.showAdminDownSet(false)
  }
  setMenuAdmin(){
    this.ui.showNavbar(true)
              this.ui.showAdmin(false)
              this.ui.showHeaderset(true)
              this.ui.showrRepresentante(false)
              this.ui.showAdminDownSet(true)
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
    //this.selectedUsuario.id_rol = 0
    this.selectedUbicaciones = this.parseUbicaciones(this.selectedUsuario.ubicacion);
    this.errorMessage = '';
  }

  // Guardar cambios desde el modal
  onSave(): void {
    if (!this.selectedUsuario) return;

    this.isSaving = true;
    this.errorMessage = '';
    let grupo = "0"
   
    if(this.selectedUsuario.id_rol === 3){
      grupo = "2"
    }else if(this.selectedUsuario.id_rol === 4){
      grupo = "1"
    }
    const id = this.selectedUsuario.uiRow;
    // Armamos el DTO sin uiRow, dtCreate y dtModificacion si tu API lo requiere
    const payload: CrearUsuarioDto = {
      uiRow: id,
      uiIdUsuario: this.selectedUsuario.uiIdUsuario,
      nombreUsario: this.selectedUsuario.nombreUsario,
      ubicacion: this.joinUbicaciones(this.selectedUbicaciones),
      id_rol: this.selectedUsuario.id_rol,
      id_usuario_excel: this.selectedUsuario.id_usuario_excel,
      id_grupo: grupo,
      correo: this.selectedUsuario.correo
    };
    this.selectedUsuario.ubicacion = payload.ubicacion;

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
    let grupo = "0"
    if(this.newUserPayload.id_rol === 3){
      grupo = "2"
    }else if(this.newUserPayload.id_rol === 4){
      grupo = "1"
    }
 
    const payload: CrearUsuarioDto = {
      uiRow: 0,
      uiIdUsuario: this.newUserPayload.uiIdUsuario,
      nombreUsario: this.newUserPayload.nombreUsario,
      nombre_usuario_ad: this.newUserPayload.nombre_usuario_ad,
      password: this.newUserPayload.password,
      ubicacion: this.joinUbicaciones(this.newUserUbicaciones),
      id_rol: this.newUserPayload.id_rol,
      id_usuario_excel: this.newUserPayload.id_usuario_excel,
      id_grupo: grupo
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
          //location.reload();
        }
      },
      error: (err) => {
        console.error(err);
        this.isSaving = false;
        this.errorMessage = 'Ocurrió un error al guardar los cambios.';
      }
    });
  }

  getNombreUbicaciones(ubicaciones?: string | null): string {
    const ids = this.parseUbicaciones(ubicaciones);
    if (ids.length === 0) return 'Sin ubicaciИn';
    return ids.map(id => this.getNombreUbicacion(String(id))).join(', ');
  }

  private parseUbicaciones(value?: string | null): number[] {
    if (!value) return [];
    return value
      .split(',')
      .map(v => Number(v.trim()))
      .filter(v => !Number.isNaN(v));
  }

  private joinUbicaciones(ids: number[]): string {
    return (ids || [])
      .filter(v => typeof v === 'number' && Number.isFinite(v))
      .map(String)
      .join(',');
  }

}
