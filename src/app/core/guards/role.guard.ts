import { Injectable, NgZone } from '@angular/core';
import { CanActivate, CanLoad, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SaldosService } from '../services/saldos.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UiService } from 'src/app/shared/service/ui.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate, CanLoad {

  constructor(private auth: AuthService, private router: Router, private saldosservice: SaldosService, private ui: UiService, private zone: NgZone) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot)
  : Observable<boolean | UrlTree> | boolean | UrlTree {
    const expected: string[] = route.data?.roles || [];
    if (expected.length === 0) return true;

    const user = this.auth.getCurrentUser();
    if (!user) {
      return this.router.createUrlTree(['/auth/login'], { queryParams: { redirectTo: state.url } });
    }


    if (user.role) {
      return expected.includes(user.role)
        ? true
        : this.router.createUrlTree(['/auth/login'], { queryParams: { redirectTo: state.url } });
    }


    return this.saldosservice.getRolUser({ uiIdUsuario: user.numeroempleado }).pipe(
      map(rolResp => {

        const role: 'ADMIN' | 'AGENTE' = (rolResp.id_rol === 1 || rolResp.id_rol === 3) ? 'ADMIN' : 'AGENTE';
        this.auth.updateRole(role); // ← persistimos el rol

        return expected.includes(role)
          ? true
          : this.router.createUrlTree(['/auth/login'], { queryParams: { redirectTo: state.url } });
      }),
      catchError(() =>
        of(this.router.createUrlTree(['/auth/login'], { queryParams: { redirectTo: state.url } }))
      )
    );
  }

  canLoad(route: Route, segments: UrlSegment[]): boolean | UrlTree {
    const expected: string[] = route.data?.roles || [];
    if (expected.length === 0) return true;
    if (this.auth.hasAnyRole(expected)) return true;
    const url = '/' + segments.map(s => s.path).join('/');
    return this.router.createUrlTree(['/auth/login'], { queryParams: { redirectTo: url } });
  }

  }
