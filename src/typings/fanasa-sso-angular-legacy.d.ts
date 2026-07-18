declare module '@fanasa/sso/angular-legacy' {
  import { InjectionToken, ModuleWithProviders, Provider } from '@angular/core';

  export interface FanasaSSOConfig {
    ssoUrl: string;
    redirectUri: string;
    clientName?: string;
    popup?: { width?: number; height?: number };
  }

  export interface SSOToken {
    idToken: string;
    accessToken?: string;
    tokenType: string;
    expiresAt: number;
    scope: string;
  }

  export interface SSOUser {
    name: string;
    email: string;
    objectId: string;
    tenantId: string;
    raw: Record<string, any>;
  }

  export const FANASA_SSO: InjectionToken<any>;

  export class FanasaSSOService {
    constructor(config: FanasaSSOConfig);
    loginPopup(redirectUri?: string): Promise<SSOToken>;
    loginRedirect(redirectUri?: string): void;
    handleRedirectCallback(): SSOToken | null;
    isAuthenticated(): boolean;
    getToken(): SSOToken | null;
    getUser(): SSOUser | null;
    logout(): void;
  }

  export class FanasaSSOGuard {
    constructor(service: FanasaSSOService);
    canActivate(): boolean;
  }

  export function provideFanasaSSO(config: FanasaSSOConfig): Provider[];

  export const FanasaSSOModule: {
    forRoot(config: FanasaSSOConfig): ModuleWithProviders<object>;
  };
}
