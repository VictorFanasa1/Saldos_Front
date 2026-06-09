import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { PwaInstallService } from 'src/app/core/pwa-install.service';
import { UiService } from '../service/ui.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  nombreuser = ""
  rol = ""
  alias = ""
  tipousuario = ""
  showRepresentante$!: Observable<boolean>;
  showAdmin$!: Observable<boolean>;
  showAdminDown$!: Observable<boolean>;
  showHeader$!: Observable<boolean>;
  canInstall$: Observable<boolean>;

  private destroy$ = new Subject<void>();

  constructor(
    public auth: AuthService,
    private router: Router,
    private ui: UiService,
    public pwa: PwaInstallService
  ) {
    this.showHeader$ = this.ui.showHeader;
    this.showRepresentante$ = this.ui.showRepresentante;
    this.showAdmin$ = this.ui.showAdministrativo;
    this.showAdminDown$ = this.ui.showadmindown;
    this.canInstall$ = this.pwa.canInstall$;
  }

  ngOnInit() {
    this.auth.user$.pipe(takeUntil(this.destroy$)).subscribe(u => {
      this.rol = u?.role?.toString() ?? '';
      this.nombreuser = u?.username?.toString() ?? '';
      this.alias = u?.username?.toString().charAt(0) ?? '';
      this.tipousuario = localStorage.getItem('nombre_rol') ?? 'NA';
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  closeMenu(){ this.ui.closeSidebar(); }
  toggleSidebar(){ this.ui.toggleSidebar(); }

  async onInstall() {
    await this.pwa.promptInstall();
  }

  logoutSys(){
    this.auth.logout();
    this.router.navigate(['login']);
  }
}
