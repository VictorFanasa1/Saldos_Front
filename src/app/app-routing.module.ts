import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { EstadosCuentaComponent } from './estados-cuenta/estados-cuenta.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: 'carga-ec', component: EstadosCuentaComponent, canActivate: [AuthGuard] },

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },

  {
    path: 'admin',
    
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'AGENTE'] },
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },

  {
    path: 'agente',
    
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['GERENTE'] },
    loadChildren: () => import('./agente/agente.module').then(m => m.AgenteModule)
  },

  { path: '**', redirectTo: 'auth/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'corrected' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
