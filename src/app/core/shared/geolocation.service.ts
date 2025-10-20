import { Injectable, NgZone } from '@angular/core';
import { Observable, defer } from 'rxjs';

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export type GeoPermissionState = 'granted' | 'prompt' | 'denied' | 'unsupported';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  constructor(private zone: NgZone) {}


  async permissionState(): Promise<GeoPermissionState> {
    if (!('geolocation' in navigator)) return 'unsupported';
    if (!('permissions' in navigator)) return 'prompt';
    try {

      const status = await (navigator as any).permissions.query({ name: 'geolocation' });
      return status.state as GeoPermissionState;
    } catch {
      return 'prompt';
    }
  }


  getCurrentPosition(opts?: PositionOptions): Promise<GeoPoint> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.zone.run(() => resolve(this.toPoint(pos)));
        },
        (err) => this.zone.run(() => reject(this.mapError(err))),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0, ...(opts || {}) }
      );
    });
  }


  watchPosition(opts?: PositionOptions): Observable<GeoPoint> {
    return defer(() => new Observable<GeoPoint>((subscriber) => {
      if (!('geolocation' in navigator)) {
        subscriber.error(new Error('Geolocalización no soportada'));
        return;
      }
      const id = navigator.geolocation.watchPosition(
        (pos) => this.zone.run(() => subscriber.next(this.toPoint(pos))),
        (err) => this.zone.run(() => subscriber.error(this.mapError(err))),
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0, ...(opts || {}) }
      );
      return () => navigator.geolocation.clearWatch(id);
    }));
  }


  private toPoint(pos: GeolocationPosition): GeoPoint {
    const c = pos.coords;
    return {
      lat: c.latitude,
      lng: c.longitude,
      accuracy: c.accuracy,
      altitude: c.altitude,
      altitudeAccuracy: c.altitudeAccuracy,
      heading: c.heading,
      speed: c.speed,
      timestamp: pos.timestamp
    };
  }

  private mapError(err: GeolocationPositionError | any): Error {
    if (!err || typeof err.code !== 'number') return new Error('Error de geolocalización');
    switch (err.code) {
      case err.PERMISSION_DENIED: return new Error('Permiso denegado por el usuario');
      case err.POSITION_UNAVAILABLE: return new Error('Posición no disponible');
      case err.TIMEOUT: return new Error('Tiempo de espera agotado');
      default: return new Error('Error de geolocalización');
    }
  }
}
