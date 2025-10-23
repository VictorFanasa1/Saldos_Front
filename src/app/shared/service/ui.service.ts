import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UiService {
  private _showNavbar = new BehaviorSubject<boolean>(true);
  private _showRepresentate   = new BehaviorSubject<boolean>(false);
private _showAdministrativo = new BehaviorSubject<boolean>(false);
private _showAddminDown = new BehaviorSubject<boolean>(false);
private _showHeader         = new BehaviorSubject<boolean>(false);
  showNavbar$ = this._showNavbar.asObservable();
  showRepresentante = this._showRepresentate.asObservable();
  showAdministrativo = this._showAdministrativo.asObservable();
  showHeader = this._showHeader.asObservable();
  showadmindown = this._showAddminDown.asObservable()
  showNavbar(val: boolean){ this._showNavbar.next(val); }
  showAdmin(val: boolean) {this._showAdministrativo.next(val);}
  showrRepresentante(val:boolean){this._showRepresentate.next(val);}
  showHeaderset(val:boolean){this._showHeader.next(val);}
  showAdminDownSet(val:boolean){this._showAddminDown.next(val);}
}
