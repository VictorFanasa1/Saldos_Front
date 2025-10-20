import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { PwaInstallService } from './core/pwa-install.service';
import { map } from 'rxjs/operators';
import { SpinOverlayServiceService } from './shared/spin-overlay/spin-overlay-service.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'saldosapp';
   visible$ = this.overlay.state$.pipe(map(s => s.visible));
  src$     = this.overlay.state$.pipe(map(s => s.src ?? 'assets/icons/icon-512x512.png'));
  size$    = this.overlay.state$.pipe(map(s => s.size ?? 160));
  dism$    = this.overlay.state$.pipe(map(s => s.dismissible ?? true));

  constructor(private overlay: SpinOverlayServiceService) {}
  onClosed() { this.overlay.hide(); }
}
