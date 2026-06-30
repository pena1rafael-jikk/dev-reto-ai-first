import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar" *ngIf="auth.isAuthenticated()">
      <div class="navbar-inner">
        <a routerLink="/convocatorias" class="navbar-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Portal SECOP
        </a>
        <div class="navbar-links">
          <a routerLink="/convocatorias" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact:false}">Convocatorias</a>
          <a routerLink="/bookmarks" routerLinkActive="active-link">Guardados</a>
          <a routerLink="/profile" routerLinkActive="active-link">Perfil</a>
          <div class="nav-divider" aria-hidden="true"></div>
          <button class="btn-nav" (click)="auth.logout()" aria-label="Cerrar sesión">Salir</button>
        </div>
      </div>
    </nav>
    <router-outlet />
  `
})
export class AppComponent {
  auth = inject(AuthService);
}
