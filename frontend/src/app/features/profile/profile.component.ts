import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProfileApi } from '../../core/api/profile.api';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Mi perfil</h1>
        <p class="page-sub">Gestiona tu información personal</p>
      </div>

      <div class="state-box" *ngIf="loading">
        <span class="spinner spinner-lg" aria-label="Cargando"></span>
        <span>Cargando perfil...</span>
      </div>

      <div class="profile-card" *ngIf="user && !loading">
        <div class="profile-header">
          <div class="avatar" aria-hidden="true">{{ initial }}</div>
          <div>
            <div class="profile-name">{{ user.full_name || 'Sin nombre' }}</div>
            <div class="profile-email">{{ user.email }}</div>
          </div>
        </div>

        <div class="profile-body">
          <form [formGroup]="form" (ngSubmit)="save()" novalidate>
            <div class="form-group" style="margin-bottom:20px">
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

            <div class="form-group" style="margin-bottom:20px">
              <label class="form-label">Correo electrónico</label>
              <input class="form-input" [value]="user.email" type="email" disabled style="opacity:.6;cursor:not-allowed" />
              <span class="form-hint">El correo no se puede modificar</span>
            </div>

            <div class="alert alert-success" role="status" *ngIf="saved" style="margin-bottom:16px">
              Perfil actualizado correctamente
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
              <span class="spinner" *ngIf="saving" aria-hidden="true"></span>
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  loading = false;
  saving = false;
  saved = false;
  get initial() { return (this.user?.full_name || this.user?.email || '?')[0].toUpperCase(); }

  form = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(1)]]
  });

  constructor(private api: ProfileApi, private fb: FormBuilder) {}

  ngOnInit() {
    this.loading = true;
    this.api.get().subscribe({
      next: u => { this.user = u; this.form.patchValue({ full_name: u.full_name }); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.saved = false;
    this.api.update(this.form.value.full_name!).subscribe({
      next: u => { this.user = u; this.saving = false; this.saved = true; },
      error: () => { this.saving = false; }
    });
  }
}
