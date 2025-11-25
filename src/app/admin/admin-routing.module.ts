import { FormresponsableComponent } from './pages/formresponsable/formresponsable.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ConfiguracionesComponent } from './pages/configuraciones/configuraciones.component';
import { CuentasincidenciasComponent } from './pages/cuentasincidencias/cuentasincidencias.component';
import { CuentasconincidenciasComponent } from './pages/cuentasconincidencias/cuentasconincidencias.component';
import { ClientesComponent } from './pages/clientes/clientes.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  {path: 'fomrAdmin/:id/:flag', component: FormresponsableComponent},
  {path: 'configuraciones', component: ConfiguracionesComponent},
  {path: 'incidencias', component: CuentasincidenciasComponent},
  {path: 'conincidencias', component: CuentasconincidenciasComponent},
  {path: 'clientes', component: ClientesComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
