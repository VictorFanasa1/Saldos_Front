import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { PwaInstallService } from './core/pwa-install.service';
import { map } from 'rxjs/operators';
import { SpinOverlayServiceService } from './shared/spin-overlay/spin-overlay-service.service';
import { UiService } from './shared/service/ui.service';
import { UpdateService } from './core/services/update.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'saldosapp';
  showNavbar = false
   visible$ = this.overlay.state$.pipe(map(s => s.visible));
  src$     = this.overlay.state$.pipe(map(s => s.src ?? 'assets/icons/icon-512x512.png'));
  size$    = this.overlay.state$.pipe(map(s => s.size ?? 160));
  dism$    = this.overlay.state$.pipe(map(s => s.dismissible ?? true));
  showNavbar$!: Observable<boolean>;
  showRepresentante$!: Observable<boolean>;
  showAdmin$!: Observable<boolean>;
  constructor(private overlay: SpinOverlayServiceService, private ui: UiService,  update: UpdateService) {
    this.showNavbar$ = this.ui.showNavbar$;
    this.showRepresentante$ = this.ui.showRepresentante;
    this.showAdmin$ = this.ui.showAdministrativo;
    update.init();
  }
  onClosed() {
    this.overlay.hide();


  }
}
