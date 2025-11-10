import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { UiService } from '../service/ui.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit  {
  isMenuOpen = false;
  showNavbar = false
  nombreuser = ""
  rol = ""
  alias = ""
  tipousuario = ""
  showRepresentante$!: Observable<boolean>;
  showAdmin$!: Observable<boolean>;
  showAdminDown$!: Observable<boolean>;
  constructor(public auth: AuthService, private ui: UiService) {
    this.showRepresentante$ = this.ui.showRepresentante;
    this.showAdmin$ = this.ui.showAdministrativo;
    this.showAdminDown$ = this.ui.showadmindown;
  }
ngOnInit() {

this.auth.user$.pipe(take(1)).subscribe(u => {
            this.rol = u?.role.toString() ?? ''
            this.nombreuser = u?.username.toString() ?? ''
            this.alias = u?.username.toString().charAt(0) ?? ''
            
          });

  this.tipousuario = localStorage.getItem('nombre_rol') ?? 'NA'

}

setPermissions(){

}

  toggleMenu(){ this.isMenuOpen = !this.isMenuOpen; }
  closeMenu(){ this.isMenuOpen = false; }


}
