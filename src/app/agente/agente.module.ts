import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AgenteRoutingModule } from './agente-routing.module';
import { AgenteComponent } from './agente.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FormagenteComponent } from './pages/formagente/formagente.component';






@NgModule({
  declarations: [
    AgenteComponent,
    DashboardComponent,
    FormagenteComponent
  ],
  imports: [
    CommonModule,
   ReactiveFormsModule,
    AgenteRoutingModule,
    FormsModule
  ]
})
export class AgenteModule { }
