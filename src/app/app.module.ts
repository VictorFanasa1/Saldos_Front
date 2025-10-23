import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthModule } from './auth/auth.module';

import { HttpClientModule } from '@angular/common/http';
import localeEsMx from '@angular/common/locales/es-MX';
import { registerLocaleData } from '@angular/common';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { SpinOverlayComponent } from './shared/spin-overlay/spin-overlay.component';
import { SignaturePadComponent } from './shared/signature-pad/signature-pad.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { AppUpdateAvailableComponent } from './shared/app-update-available/app-update-available.component';
import { HeaderComponent } from './shared/header/header.component';
registerLocaleData(localeEsMx);

@NgModule({
  declarations: [
    AppComponent,
    SpinOverlayComponent,
    SignaturePadComponent,
    NavbarComponent,
    AppUpdateAvailableComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AuthModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'es-MX' }],
  bootstrap: [AppComponent]
})
export class AppModule { }
