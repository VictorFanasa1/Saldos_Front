import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { SaldosService } from 'src/app/core/services/saldos.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})

export class LoginComponent {
  username = '';
  password = '';
  role: 'ADMIN' | 'AGENTE' = 'AGENTE';
  redirectTo: string | null = null;
  isloading =  false
  showPassword = false;
  loading = false;
  currentYear = new Date().getFullYear();
new: any;
  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute, private saldosservice: SaldosService) {

  }

  ngOnInit(): void {

    this.route.queryParamMap.subscribe(p => this.redirectTo = p.get('redirectTo'));
  }
  onSubmit() {
    this.isloading = true
    this.auth.login(this.username, this.password).subscribe({
      next: user=>{

        this.saldosservice.getRolUser({uiIdUsuario : user.numeroempleado}).subscribe({
          next: rol =>{
            const isLoginRoute = this.redirectTo?.startsWith('/auth/login');
            console.log("LOS ROLES")
            console.log(rol.id_rol)
            localStorage.setItem('useridbd', rol.id_usuario_excel)
            if(rol.id_rol == 1 ||  rol.id_rol == 3){
              user.role = 'ADMIN'
            }else if(rol.id_rol == 2){
              user.role = 'AGENTE'
            }
            console.log(user.role)
            console.log(this.redirectTo)
            const target =
          !isLoginRoute && this.redirectTo
            ? this.redirectTo
            : (user.role === 'ADMIN' ? '/admin' : '/agente');
           console.log(target)
           this.isloading = false
            this.router.navigateByUrl(target, { replaceUrl: true });

          }
        })

      },
      error: err => {

      }
    });

  }
}
