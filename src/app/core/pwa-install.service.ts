import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt?: BeforeInstallPromptEvent;
  private _canInstall$ = new BehaviorSubject<boolean>(false);


  canInstall$ = this._canInstall$.asObservable();

  constructor(private zone: NgZone) {

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.zone.run(() => {
        this.deferredPrompt = e as BeforeInstallPromptEvent;
        this._canInstall$.next(true);
      });
    });


    window.addEventListener('appinstalled', () => {
      this.zone.run(() => this._canInstall$.next(false));
      this.deferredPrompt = undefined;
    });
  }


  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) return 'unavailable';
    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    // Para no volver a mostrar el banner
    this.deferredPrompt = undefined;
    this._canInstall$.next(false);
    return outcome;
  }


  isIosLikely(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }


  isStandalone(): boolean {
    // iOS Safari
    // @ts-ignore
    const iosStandalone = typeof window !== 'undefined' && (window.navigator as any).standalone;
    // Otros (Chrome/Edge) vía media query
    const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches;
    return !!iosStandalone || !!displayModeStandalone;
  }
}
