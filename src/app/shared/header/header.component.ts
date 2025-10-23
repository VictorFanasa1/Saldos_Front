import { Component, Input, OnInit } from '@angular/core';
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
isMenuOpen = false;
rol = ""
showHeader$!: Observable<boolean>;
  constructor(public auth: AuthService, private router: Router, private ui: UiService) { this.showHeader$ = this.ui.showHeader}

ngOnInit(){
  /*this.auth.user$.pipe(take(1)).subscribe(u => {
            this.rol = u?.role.toString() ?? ''

          });*/

}
 toggleMenu(){ this.isMenuOpen = !this.isMenuOpen; }
  closeMenu(){ this.isMenuOpen = false; }

  logoutSys(){
    this.auth.logout()
    this.router.navigate(['login']);
  }
}
