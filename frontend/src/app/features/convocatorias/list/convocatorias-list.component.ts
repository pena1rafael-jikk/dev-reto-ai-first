import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConvocatoriasApi } from '../../../core/api/convocatorias.api';
import { BookmarksApi } from '../../../core/api/bookmarks.api';
import { SecopConvocatoria } from '../../../models/secop.model';

@Component({
  selector: 'app-convocatorias-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Convocatorias SECOP</h1>
        <p class="page-sub">Consulta en tiempo real desde datos.gov.co</p>
      </div>

      <div class="filter-bar">
        <div class="form-group" style="flex:2;min-width:200px">
          <label class="form-label" for="q">Buscar</label>
          <input id="q" class="form-input" [formControl]="filters.controls.q" type="search" placeholder="Palabra clave..." />
        </div>
        <div class="form-group">
          <label class="form-label" for="entidad">Entidad</label>
          <input id="entidad" class="form-input" [formControl]="filters.controls.entidad" placeholder="Nombre de entidad" />
        </div>
        <div class="form-group">
          <label class="form-label" for="departamento">Departamento</label>
          <input id="departamento" class="form-input" [formControl]="filters.controls.departamento" placeholder="Ej: Bogotá" />
        </div>
        <div class="form-group" style="flex:0;min-width:auto">
          <label class="form-label" style="visibility:hidden">Buscar</label>
          <button class="btn btn-primary" (click)="search()" [disabled]="loading" style="white-space:nowrap">
            <span class="spinner" *ngIf="loading" aria-hidden="true"></span>
            {{ loading ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>
      </div>

      <div class="state-box" *ngIf="loading && items.length === 0">
        <span class="spinner spinner-lg" aria-label="Cargando"></span>
        <span>Consultando convocatorias...</span>
      </div>

      <div class="state-box is-error" *ngIf="error && !loading">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ error }}</span>
        <button class="btn btn-outline btn-sm" (click)="search()">Reintentar</button>
      </div>

      <div class="state-box" *ngIf="!loading && !error && items.length === 0">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>No se encontraron convocatorias con esos filtros</span>
      </div>

      <div class="card-grid" *ngIf="items.length > 0">
        <div class="conv-card" *ngFor="let c of items">
          <div class="conv-card-top">
            <h2 class="conv-title">{{ c.nombre_procedimiento || 'Sin título' }}</h2>
            <span class="badge" [class.badge-open]="c.estado_apertura === 'Abierto'" [class.badge-closed]="c.estado_apertura !== 'Abierto'">
              {{ c.estado_apertura || 'N/D' }}
            </span>
          </div>

          <div class="conv-meta">
            <div class="conv-meta-row" *ngIf="c.entidad">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              {{ c.entidad }}
            </div>
            <div class="conv-meta-row" *ngIf="c.departamento">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ c.departamento }}{{ c.ciudad ? ' · ' + c.ciudad : '' }}
            </div>
          </div>

          <div class="conv-price" *ngIf="c.precio_base">
            {{ c.precio_base | currency:'COP':'symbol-narrow':'1.0-0' }}
          </div>

          <div class="conv-actions">
            <a [routerLink]="['/convocatorias', c.secop_process_id]" class="btn btn-ghost btn-sm">Ver detalle</a>
            <button
              class="btn btn-outline btn-sm"
              (click)="save(c)"
              [disabled]="saving[c.secop_process_id!] || saved[c.secop_process_id!]"
              style="margin-left:auto"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              {{ saved[c.secop_process_id!] ? 'Guardado' : saving[c.secop_process_id!] ? '...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConvocatoriasListComponent implements OnInit {
  filters = this.fb.group({ q: [''], entidad: [''], departamento: [''] });
  items: SecopConvocatoria[] = [];
  loading = false;
  error = '';
  saving: Record<string, boolean> = {};
  saved: Record<string, boolean> = {};

  constructor(private api: ConvocatoriasApi, private bookmarksApi: BookmarksApi, private fb: FormBuilder) {}

  ngOnInit() { this.search(); }

  search() {
    this.loading = true;
    this.error = '';
    this.api.list(this.filters.value as Record<string, string>).subscribe({
      next: res => { this.items = res.data; this.loading = false; },
      error: () => { this.error = 'Error al cargar convocatorias. Verifica tu conexión.'; this.loading = false; }
    });
  }

  save(c: SecopConvocatoria) {
    if (!c.secop_process_id) return;
    this.saving[c.secop_process_id] = true;
    this.bookmarksApi.create(c.secop_process_id).subscribe({
      next: () => { this.saving[c.secop_process_id!] = false; this.saved[c.secop_process_id!] = true; },
      error: () => { this.saving[c.secop_process_id!] = false; }
    });
  }
}
