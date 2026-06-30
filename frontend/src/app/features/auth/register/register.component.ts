import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Portal SECOP
        </div>

        <div>
          <h1 class="auth-heading">Crear cuenta</h1>
          <p class="auth-sub">Accede a convocatorias públicas de Colombia</p>
        </div>

        <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="form-group">
            <label class="form-label" for="full_name">Nombre completo</label>
            <input
              id="full_name"
              class="form-input"
              [class.is-invalid]="form.get('full_name')?.invalid && form.get('full_name')?.touched"
              formControlName="full_name"
              type="text"
              placeholder="Tu nombre"
              autocomplete="name"
            />
            <span class="form-error" *ngIf="form.get('full_name')?.invalid && form.get('full_name')?.touched">
              El nombre es obligatorio
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Correo electrónico</label>
            <input
              id="email"
              class="form-input"
              [class.is-invalid]="form.get('email')?.invalid && form.get('email')?.touched"
              formControlName="email"
              type="email"
              placeholder="correo@ejemplo.com"
              autocomplete="email"
            />
            <span class="form-error" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
              Ingresa un correo electrónico válido
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Contraseña</label>
            <input
              id="password"
              class="form-input"
              [class.is-invalid]="form.get('password')?.invalid && form.get('password')?.touched"
              formControlName="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autocomplete="new-password"
            />
            <span class="form-error" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
              La contraseña debe tener al menos 8 caracteres
            </span>
          </div>

          <div class="alert alert-error" role="alert" *ngIf="error">{{ error }}</div>

          <button type="submit" class="btn btn-primary btn-full" [disabled]="form.invalid || loading">
            <span class="spinner" *ngIf="loading" aria-hidden="true"></span>
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <p class="auth-link">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  form = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(1)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    const { email, password, full_name } = this.form.value;
    this.auth.register(email!, password!, full_name!).subscribe({
      next: () => this.router.navigate(['/convocatorias']),
      error: (err) => {
        this.error = err.error?.detail?.message ?? 'Error al crear la cuenta. Intenta nuevamente.';
        this.loading = false;
      }
    });
  }
}
