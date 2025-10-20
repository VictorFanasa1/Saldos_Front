import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
export interface SpinOverlayState {
  visible: boolean;
  src?: string;
  size?: number;
  dismissible?: boolean;
}
@Injectable({
  providedIn: 'root'
})
export class SpinOverlayServiceService {

  constructor() { }

  private readonly _state$ = new BehaviorSubject<SpinOverlayState>({ visible: false });
  readonly state$ = this._state$.asObservable();

  show(opts: Partial<SpinOverlayState> = {}) {
    const current = this._state$.value;
    this._state$.next({
      visible: true,
      src: opts.src ?? current.src ?? 'assets/icons/icon-512x512.png',
      size: opts.size ?? current.size ?? 160,
      dismissible: opts.dismissible ?? true,
    });
  }

  hide() {
    this._state$.next({ ...this._state$.value, visible: false });
  }
}
