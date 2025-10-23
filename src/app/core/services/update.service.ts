// src/app/core/services/update.service.ts
import { Injectable, NgZone } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { environment } from 'src/environments/environment.prod';
function parseSemver(v: string){ const [M=0,m=0,p=0] = v.split('.').map(n => +n||0); return {M,m,p}; }
function isIOSStandalone(): boolean {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
         ((navigator as any).standalone === true);
}
@Injectable({ providedIn: 'root' })
export class UpdateService {
  private KEY = 'app_last_version';
  constructor(private sw: SwUpdate, private zone: NgZone) {}

  async init(){

    const current = environment.appVersion;
    const prev = localStorage.getItem(this.KEY);

    // 1) Primer uso → guarda y sigue
    if (!prev) { localStorage.setItem(this.KEY, current); return; }

    // 2) ¿Cambio mayor?
    const {M:curM} = parseSemver(current);
    const {M:prevM} = parseSemver(prev);
    if (curM > prevM) {
      // Cambio mayor → estrategia dura
      await this.handleMajorUpgrade();
    }

    // 3) Actualiza marca (si cambió)
    if (prev !== current) localStorage.setItem(this.KEY, current);
  }

  private async handleMajorUpgrade(){
    // 1) Intenta activar update normal si está lista
    try { await this.sw.activateUpdate(); } catch {}

    // 2) iOS PWA: no podemos “limpiar” programáticamente → mostrar guía
    if (isIOSStandalone()) {
      window.dispatchEvent(new CustomEvent('pwa-reinstall-needed'));
      return;
    }

    // 3) Android/Desktop → hard reset programático
    try {
      // Unregister SW
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));

      // Borra Cache Storage
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch {}

    // 4) Recarga “limpia” forzando URL única para evitar SW viejo intermedio
    this.zone.runOutsideAngular(() => {
      const url = `${location.origin}${location.pathname}?v=${Date.now()}`;
      location.replace(url);
    });
  }
}
