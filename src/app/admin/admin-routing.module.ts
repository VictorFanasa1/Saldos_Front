import { FormresponsableComponent } from './pages/formresponsable/formresponsable.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ConfiguracionesComponent } from './pages/configuraciones/configuraciones.component';
import { CuentasincidenciasComponent } from './pages/cuentasincidencias/cuentasincidencias.component';
import { CuentasconincidenciasComponent } from './pages/cuentasconincidencias/cuentasconincidencias.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { DashboardComponentAgent } from '../agente/pages/dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'clientes', pathMatch: 'full' },
  {path: 'fomrAdmin/:id/:flag', component: FormresponsableComponent},
  {path: 'configuraciones', component: ConfiguracionesComponent},
  {path: 'incidencias', component: CuentasincidenciasComponent},
  {path: 'conincidencias', component: CuentasconincidenciasComponent},
  {path: 'clientes', component: ClientesComponent},
  {path: 'config', component: ConfiguracionesComponent},
  {path: 'agente', component: DashboardComponentAgent},
  {path: 'cargac', redirectTo: 'clientes', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
