import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Observable } from 'rxjs';
import { PwaInstallService } from 'src/app/core/pwa-install.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { UiService } from 'src/app/shared/service/ui.service';
import { SpinOverlayServiceService } from 'src/app/shared/spin-overlay/spin-overlay-service.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
   styleUrls: ['./login.component.css']
})

export class LoginComponent {
  username = '';
  password = '';
  role: 'ADMIN' | 'AGENTE' = 'AGENTE';
  redirectTo: string | null = null;
  isloading =  false
  showPassword = false;
  loading = false;
  currentYear = new Date().getFullYear();
new: any;
canInstall$: Observable<boolean>;

  showIosHint = false;
  showOverlay = false;
  constructor(private ui: UiService, private swUpdate: SwUpdate, private auth: AuthService, private router: Router, private route: ActivatedRoute, private saldosservice: SaldosService, private pwa: PwaInstallService, private overlay: SpinOverlayServiceService) {
     this.canInstall$ = this.pwa.canInstall$;

    // Si es iOS y no está en standalone, mostramos tip manual
    this.showIosHint = this.pwa.isIosLikely() && !this.pwa.isStandalone();
    this.ui.showNavbar(false);
    this.ui.showHeaderset(false);
  }

  ngOnInit(): void {
    this.instalar()
    this.route.queryParamMap.subscribe(p => this.redirectTo = p.get('redirectTo'));
    if (!this.swUpdate.isEnabled) return;
    this.swUpdate.available.subscribe(() => {
      this.askToReload();
    });
  }

  private async askToReload() {
    const res = await Swal.fire({
      title: 'Actualización disponible',
      text: 'Hay una nueva versión de la app. ¿Deseas actualizar ahora?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Luego',
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    if (res.isConfirmed) {
      try {
        await this.swUpdate.activateUpdate(); // activa el nuevo SW
      } catch {
        // si falla la activación igual recargamos, el navegador suele tomar la nueva versión
      }
      document.location.reload(); // recarga para servir los archivos nuevos desde el SW
    }
  }
  onSubmit() {

 this.overlay.show();
    //this.isloading = true
    this.auth.login(this.username, this.password).subscribe({
      next: user=>{

        this.saldosservice.getRolUser({uiIdUsuario : user.numeroempleado}).subscribe({
          next: rol =>{
            const isLoginRoute = this.redirectTo?.startsWith('/auth/login');
            console.log("LOS ROLES")
            console.log(rol.id_rol)
            localStorage.setItem('useridbd', rol.id_usuario_excel)
            localStorage.setItem('id_grupo', rol.id_grupo)
            localStorage.setItem('id_rol', rol.id_rol.toString())
            if(rol.id_rol == 3 && rol.id_grupo == '1'){
              localStorage.setItem('nombre_rol', 'Credito')
            }else if(rol.id_rol == 3 && rol.id_grupo == '2'){
              localStorage.setItem('nombre_rol', 'Cobranza')
            }else{
              localStorage.setItem('nombre_rol', 'Administrador')
            }
            if(rol.id_rol == 1 ||  rol.id_rol == 3){
              user.role = 'ADMIN'
             
            }else if(rol.id_rol == 2){
              user.role = 'AGENTE'
              localStorage.setItem('nombre_rol', 'Representante')
            }
            console.log(user.role)
            console.log(this.redirectTo)
            const target =
          !isLoginRoute && this.redirectTo
            ? this.redirectTo
            : (user.role === 'ADMIN' ? '/admin' : '/agente');
           console.log(target)

           if(user.role === 'ADMIN'){
              this.ui.showNavbar(true)
              this.ui.showAdmin(true)
              this.ui.showHeaderset(true)
              this.ui.showrRepresentante(false)
           }else{
              this.ui.showHeaderset(true)
              this.ui.showNavbar(true)
              this.ui.showrRepresentante(true)
           }
           this.overlay.hide()
            this.router.navigateByUrl(target, { replaceUrl: true });

          }
        })

      },
      error: err => {
         this.isloading = false
          this.overlay.hide();
         Swal.fire({
          title: "ERROR NO SE PUDO INICIAR SESIÓN",
          icon: "error"
         })
      }
    });

  }

  async instalar() {
    const result = await this.pwa.promptInstall();
    // Aquí opcional: SweetAlert2 o un toast con el resultado
    // e.g. accepted/dismissed/unavailable
    console.log('Install outcome:', result);
  }

  cerrarIosHint() {
    this.showIosHint = false;
  }

  abrirOverlay() { this.showOverlay = true; }
  onClosed() { this.showOverlay = false; }
}
