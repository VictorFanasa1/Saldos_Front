import { FormresponsableComponent } from './pages/formresponsable/formresponsable.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ConfiguracionesComponent } from './pages/configuraciones/configuraciones.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  {path: 'fomrAdmin/:id/:flag', component: FormresponsableComponent},
  {path: 'configuraciones', component: ConfiguracionesComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
