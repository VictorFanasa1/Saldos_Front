import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { LoginResponse, User } from '../shared/LoginResponse';
import { catchError, map, tap } from 'rxjs/operators';
import { UiService } from 'src/app/shared/service/ui.service';


export type Role = 'ADMIN' | 'AGENTE';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'app_token';
  private readonly USER_KEY = 'app_user';
  private readonly USER_ID = 'app_user_id';

private url = 'https://aplicacion.fanasa.com/ServiceLogAD/Auth/Ingresar';

  private _user$ = new BehaviorSubject<User | null>(this.restoreUser());
  user$ = this._user$.asObservable();

  constructor(private http: HttpClient, private ui: UiService) {}

  // Login "demo": creamos un token fake con el rol seleccionado
  login(user: string, password: string): Observable<User> {
    const persist = (u: User) => {
      console.log(u)
    this._user$.next(u);
    localStorage.setItem(this.USER_KEY, JSON.stringify(u));
  };

  if (user === 'diana.montano') {
    const userS: User = {
      username: 'LUIS MARQUEZ',
      numeroempleado: '7251',
      token: '',
      role: '',
      idusuariobd: 0
    };
    persist(userS);
    return of(userS);
  }else if(user === 'admin.1'){
    const userS: User = {
      username: 'Administrativo 1',
      numeroempleado: '7700',
      token: '',
      role: '',
      idusuariobd: 0
    };
    persist(userS);
    return of(userS);
  }else if(user === 'admin.2'){
    const userS: User = {
      username: 'Administrativo 2',
      numeroempleado: '7150',
      token: '',
      role: '',
      idusuariobd: 0
    };
    persist(userS);
    return of(userS);
  }else if(user === 'admin.1'){
    const userS: User = {
      username: 'Administrativo 1',
      numeroempleado: '7700',
      token: '',
      role: '',
      idusuariobd: 0
    };
    persist(userS);
    return of(userS);
  }else if(user === 'admin.1.1'){
    const userS: User = {
      username: 'Administrativo 1.1',
      numeroempleado: '7701',
      token: '',
      role: '',
      idusuariobd: 0
    };
    persist(userS);
    return of(userS);
  }else if(user === 'repre.1'){
    const userS: User = {
      username: 'Representante 1',
      numeroempleado: '7352',
      token: '',
      role: '',
      idusuariobd: 0
    };
    persist(userS);
    return of(userS);
  }


  return this.http.post<LoginResponse>(this.url, { user, password }).pipe(
    map(res => {
      const userS: User = {
        username: res.sNombreEmpleado,
        numeroempleado: res.uiNumeroEmpleado.toString(),
        token: '',
        role: '',
        idusuariobd: 0
      };
      return userS;
    }),
    tap(persist),
    catchError(err => {
      // opcional: limpia estado si falla
      this._user$.next(null as any);
      localStorage.removeItem(this.USER_KEY);
      return throwError(() => err);
    })
  );

  }
  updateRole(role: Role) {
    const u = this._user$.value ?? this.restoreUser();
    if (!u) return;
    const updated = { ...u, role };
    this._user$.next(updated);

    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
  }
  logout(): void {
    //localStorage.removeItem(this.TOKEN_KEY);

    localStorage.removeItem(this.USER_KEY);
    this._user$.next(null);
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.USER_KEY);
  }

  getCurrentUser(): User | null {
    return this._user$.value ?? this.restoreUser();
  }

  hasAnyRole(expected: string[]): boolean {
    const u = this.getCurrentUser();
    return !!u && expected.includes(u.role);
  }

  private restoreUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  }

  // -------- Helpers demo (NO usar en producción) ----------
  private buildFakeJwt(payload: any): string {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const signature = ''; // sin firma (solo demo)
    return `${header}.${body}.${signature}`;
  }
}
