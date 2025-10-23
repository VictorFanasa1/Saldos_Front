import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FormresponsableComponent } from './pages/formresponsable/formresponsable.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfiguracionesComponent } from './pages/configuraciones/configuraciones.component';
import { CuentasincidenciasComponent } from './pages/cuentasincidencias/cuentasincidencias.component';
import { CuentasconincidenciasComponent } from './pages/cuentasconincidencias/cuentasconincidencias.component';



@NgModule({
  declarations: [
    AdminComponent,
    DashboardComponent,
    FormresponsableComponent,
    ConfiguracionesComponent,
    CuentasincidenciasComponent,
    CuentasconincidenciasComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class AdminModule { }
