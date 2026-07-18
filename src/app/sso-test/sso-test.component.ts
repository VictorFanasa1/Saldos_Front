import { Component } from '@angular/core';
import { FanasaSSOService } from '@fanasa/sso/angular-legacy';

@Component({
  selector: 'app-sso-test',
  templateUrl: './sso-test.component.html'
})
export class SsoTestComponent {
  loading = false;
  error: string | null = null;
  token: any = null;
  user: any = null;

  constructor(private sso: FanasaSSOService) {}

  async login() {
    this.loading = true;
    this.error = null;
    this.token = null;
    this.user = null;
    try {
      this.token = await this.sso.loginPopup();
      this.user = this.sso.getUser();
      console.log('Token SSO:', this.token);
      console.log('Usuario SSO:', this.user);
    } catch (e: any) {
      this.error = e?.message ?? String(e);
      console.error('Error SSO:', e);
    } finally {
      this.loading = false;
    }
  }
}
