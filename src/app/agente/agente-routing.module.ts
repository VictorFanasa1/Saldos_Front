import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponentAgent } from './pages/dashboard/dashboard.component';
import { FormagenteComponent } from './pages/formagente/formagente.component';
import { EstadoCuentaComponent } from './pages/estado-cuenta/estado-cuenta.component';

const routes: Routes = [
  { path: '', component: DashboardComponentAgent },
  { path: 'fomrAgente/:id', component: FormagenteComponent},
  {path: 'edocuenta/:idcuenta',component: EstadoCuentaComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AgenteRoutingModule { }