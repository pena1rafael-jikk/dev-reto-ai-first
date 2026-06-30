import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/convocatorias', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'convocatorias', canActivate: [authGuard], loadComponent: () => import('./features/convocatorias/list/convocatorias-list.component').then(m => m.ConvocatoriasListComponent) },
  { path: 'convocatorias/:id', canActivate: [authGuard], loadComponent: () => import('./features/convocatorias/detail/convocatoria-detail.component').then(m => m.ConvocatoriaDetailComponent) },
  { path: 'bookmarks', canActivate: [authGuard], loadComponent: () => import('./features/bookmarks/bookmarks.component').then(m => m.BookmarksComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
  { path: '**', redirectTo: '/convocatorias' }
];
