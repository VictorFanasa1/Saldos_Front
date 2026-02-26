import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PwaInstallService } from 'src/app/core/pwa-install.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { Ubicacion } from 'src/app/core/shared/ubicaciones.model';
import { UiService } from 'src/app/shared/service/ui.service';
import { SpinOverlayServiceService } from 'src/app/shared/spin-overlay/spin-overlay-service.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  role: 'ADMIN' | 'GERENTE' | 'AGENTE' = 'AGENTE';
  redirectTo: string | null = null;
  showPassword = false;
  loading = false;
  formSubmitted = false;
  shakeCard = false;
  ubicaciones: Ubicacion[] = [];
  canInstall$: Observable<boolean>;
  showIosHint = false;
  showOverlay = false;

  constructor(
    private ui: UiService,
    private swUpdate: SwUpdate,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private saldosservice: SaldosService,
    private pwa: PwaInstallService,
    private overlay: SpinOverlayServiceService
  ) {
    this.canInstall$ = this.pwa.canInstall$;
    this.showIosHint = this.pwa.isIosLikely() && !this.pwa.isStandalone();
    this.ui.showNavbar(false);
    this.ui.showHeaderset(false);
  }

  ngOnInit(): void {
    this.loadUbicaciones$().subscribe({
      next: () => {
        console.log('Ubicaciones cargadas correctamente.');
      },
      error: (err) => {
        console.error('Error al cargar ubicaciones:', err);
      }
    });

    this.instalar();
    this.route.queryParamMap.subscribe((p) => (this.redirectTo = p.get('redirectTo')));

    if (!this.swUpdate.isEnabled) {
      return;
    }

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
        await this.swUpdate.activateUpdate();
      } catch {
        // Si falla la activacion, el reload igual intenta tomar la nueva version.
      }
      document.location.reload();
    }
  }

  onSubmit(form: NgForm): void {
    this.formSubmitted = true;
    form.control.markAllAsTouched();

    if (this.loading) {
      return;
    }

    if (form.invalid) {
      this.triggerInvalidShake();
      return;
    }

    this.loading = true;
    this.overlay.show();

    this.auth.login(this.username, this.password).subscribe({
      next: (user) => {
        this.saldosservice.getRolUser({ nombreUsuario: user.username }).subscribe({
          next: (rol) => {
            const isLoginRoute = this.redirectTo?.startsWith('/auth/login');
            let ubicaciones = '';
            const arreglo = rol.ubicacion.split(',');

            arreglo.forEach((valor) => {
              ubicaciones += `${this.getNombreUbicacion(valor.trim())},`;
            });

            localStorage.setItem('ubicacion', ubicaciones);
            localStorage.setItem('useridbd', rol.id_usuario_excel);
            localStorage.setItem('id_grupo', rol.id_grupo);
            localStorage.setItem('id_rol', rol.id_rol.toString());

            if (rol.id_rol === 4) {
              localStorage.setItem('nombre_rol', 'Cartera');
            } else if (rol.id_rol === 3) {
              localStorage.setItem('nombre_rol', 'Comercial');
            } else if (rol.id_rol === 2) {
              localStorage.setItem('nombre_rol', 'Gerente de Zona');
            } else {
              localStorage.setItem('nombre_rol', 'Administrador');
            }

            let role: 'ADMIN' | 'GERENTE' | 'AGENTE';
            if (rol.id_rol === 1) {
              role = 'ADMIN';
            } else if (rol.id_rol === 2) {
              role = 'GERENTE';
            } else {
              role = 'AGENTE';
            }

            user.role = role;
            this.auth.updateRole(role);

            const target =
              !isLoginRoute && this.redirectTo && this.isRedirectAllowed(role, this.redirectTo)
                ? this.redirectTo
                : role === 'ADMIN' || role === 'AGENTE'
                  ? '/admin'
                  : '/agente';

            if (user.role === 'ADMIN') {
              this.ui.showNavbar(true);
              this.ui.showAdmin(true);
              this.ui.showHeaderset(true);
              this.ui.showrRepresentante(false);
            } else if (user.role === 'GERENTE') {
              this.ui.showHeaderset(true);
              this.ui.showNavbar(true);
              this.ui.showrRepresentante(true);
            }

            this.loading = false;
            this.overlay.hide();
            this.router.navigateByUrl(target, { replaceUrl: true });
          },
          error: () => {
            this.loading = false;
            this.overlay.hide();
            Swal.fire({
              title: 'No se pudo validar el rol del usuario',
              icon: 'error'
            });
          }
        });
      },
      error: () => {
        this.loading = false;
        this.overlay.hide();
        Swal.fire({
          title: 'Error: no se pudo iniciar sesión',
          icon: 'error'
        });
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private triggerInvalidShake(): void {
    this.shakeCard = false;
    requestAnimationFrame(() => {
      this.shakeCard = true;
    });

    setTimeout(() => {
      this.shakeCard = false;
    }, 350);
  }

  async instalar() {
    const result = await this.pwa.promptInstall();
    console.log('Install outcome:', result);
  }

  cerrarIosHint() {
    this.showIosHint = false;
  }

  abrirOverlay() {
    this.showOverlay = true;
  }

  onClosed() {
    this.showOverlay = false;
  }

  loadUbicaciones$(): Observable<any> {
    return this.saldosservice.getUbicaciones().pipe(
      tap((data) => {
        this.ubicaciones = data;
      })
    );
  }

  private isRedirectAllowed(role: 'ADMIN' | 'GERENTE' | 'AGENTE', url: string): boolean {
    if (role === 'GERENTE') {
      return url.startsWith('/agente');
    }
    return url.startsWith('/admin');
  }

  getNombreUbicacion(idUbicacion?: string | null): string {
    if (idUbicacion == null) {
      return 'Sin ubicación';
    }

    const ubicacionEncontrada = this.ubicaciones.find((x) => x.idUbicacion === Number(idUbicacion));
    return ubicacionEncontrada ? ubicacionEncontrada.nombreUbicacion : `Ubicación #${idUbicacion}`;
  }
}
