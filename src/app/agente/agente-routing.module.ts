import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FormagenteComponent } from './pages/formagente/formagente.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'fomrAgente/:id', component: FormagenteComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AgenteRoutingModule { }