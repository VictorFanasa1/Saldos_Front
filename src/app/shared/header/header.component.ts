import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { UiService } from '../service/ui.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit  {
  nombreuser = ""
  rol = ""
  alias = ""
  tipousuario = ""
  showRepresentante$!: Observable<boolean>;
  showAdmin$!: Observable<boolean>;
  showAdminDown$!: Observable<boolean>;
showHeader$!: Observable<boolean>;
  constructor(public auth: AuthService, 
    private router: Router, 
    private ui: UiService) { 
      this.showHeader$ = this.ui.showHeader
       this.showRepresentante$ = this.ui.showRepresentante;
    this.showAdmin$ = this.ui.showAdministrativo;
    this.showAdminDown$ = this.ui.showadmindown;
    }

ngOnInit(){
 this.auth.user$.pipe(take(1)).subscribe(u => {
            this.rol = u?.role.toString() ?? ''
            this.nombreuser = u?.username.toString() ?? ''
            this.alias = u?.username.toString().charAt(0) ?? ''
            
          });

 this.tipousuario = localStorage.getItem('nombre_rol') ?? 'NA'

}
  closeMenu(){ this.ui.closeSidebar(); }
  toggleSidebar(){ this.ui.toggleSidebar(); }

  logoutSys(){
    this.auth.logout()
    
    this.router.navigate(['login']);
  }
}
