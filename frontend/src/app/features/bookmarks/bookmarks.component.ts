import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookmarksApi } from '../../core/api/bookmarks.api';
import { Bookmark } from '../../models/bookmark.model';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Mis guardados</h1>
        <p class="page-sub">Convocatorias que marcaste para seguimiento</p>
      </div>

      <div class="state-box" *ngIf="loading">
        <span class="spinner spinner-lg" aria-label="Cargando"></span>
        <span>Cargando guardados...</span>
      </div>

      <div class="state-box is-error" *ngIf="error && !loading">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ error }}</span>
        <button class="btn btn-outline btn-sm" (click)="load()">Reintentar</button>
      </div>

      <div class="state-box" *ngIf="!loading && !error && items.length === 0">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <strong style="color:var(--c-primary)">Sin convocatorias guardadas</strong>
        <span>Ve a Convocatorias y guarda las que te interesen</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px" *ngIf="items.length > 0">
        <div class="bookmark-card" *ngFor="let b of items">
          <div class="bookmark-info">
            <div class="bookmark-title">{{ b.nombre_procedimiento || 'Sin título' }}</div>
            <div class="bookmark-meta">
              <span *ngIf="b.entidad">{{ b.entidad }}</span>
              <span *ngIf="b.entidad && b.departamento"> · </span>
              <span *ngIf="b.departamento">{{ b.departamento }}</span>
              <span *ngIf="b.precio_base" style="margin-left:8px;color:var(--c-cta);font-weight:600">
                {{ b.precio_base | currency:'COP':'symbol-narrow':'1.0-0' }}
              </span>
            </div>
          </div>
          <button
            class="btn btn-danger btn-sm"
            (click)="remove(b.id)"
            [disabled]="removing[b.id]"
            aria-label="Eliminar guardado"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
            {{ removing[b.id] ? '...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class BookmarksComponent implements OnInit {
  items: Bookmark[] = [];
  loading = false;
  error = '';
  removing: Record<number, boolean> = {};

  constructor(private api: BookmarksApi) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    this.api.list().subscribe({
      next: res => { this.items = res.data; this.loading = false; },
      error: () => { this.error = 'Error al cargar guardados'; this.loading = false; }
    });
  }

  remove(id: number) {
    this.removing[id] = true;
    this.api.delete(id).subscribe({
      next: () => { this.removing[id] = false; this.load(); },
      error: () => { this.removing[id] = false; }
    });
  }
}
