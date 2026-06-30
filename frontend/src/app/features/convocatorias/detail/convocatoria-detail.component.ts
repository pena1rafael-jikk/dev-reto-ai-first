import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConvocatoriasApi } from '../../../core/api/convocatorias.api';
import { SecopConvocatoria } from '../../../models/secop.model';

@Component({
  selector: 'app-convocatoria-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="detail-back">
        <a routerLink="/convocatorias" class="btn btn-ghost btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a convocatorias
        </a>
      </div>

      <div class="state-box" *ngIf="loading">
        <span class="spinner spinner-lg" aria-label="Cargando"></span>
        <span>Cargando convocatoria...</span>
      </div>

      <div class="state-box is-error" *ngIf="error && !loading">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ error }}</span>
        <button class="btn btn-outline btn-sm" (click)="load()">Reintentar</button>
      </div>

      <div class="detail-card" *ngIf="item && !loading">
        <div class="detail-header">
          <div style="flex:1">
            <h1 class="page-title" style="font-size:1.25rem">{{ item.nombre_procedimiento || 'Sin título' }}</h1>
            <p style="color:var(--c-muted);font-size:.875rem;margin-top:6px" *ngIf="item.entidad">{{ item.entidad }}</p>
          </div>
          <span class="badge" [class.badge-open]="item.estado_apertura === 'Abierto'" [class.badge-closed]="item.estado_apertura !== 'Abierto'">
            {{ item.estado_apertura || 'N/D' }}
          </span>
        </div>

        <div class="detail-body">
          <div class="detail-field" *ngIf="item.nit_entidad">
            <label>NIT Entidad</label>
            <span>{{ item.nit_entidad }}</span>
          </div>
          <div class="detail-field" *ngIf="item.departamento">
            <label>Departamento</label>
            <span>{{ item.departamento }}</span>
          </div>
          <div class="detail-field" *ngIf="item.ciudad">
            <label>Ciudad</label>
            <span>{{ item.ciudad }}</span>
          </div>
          <div class="detail-field" *ngIf="item.precio_base">
            <label>Precio base</label>
            <span style="color:var(--c-cta);font-weight:600">{{ item.precio_base | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
          </div>
          <div class="detail-field" *ngIf="item.modalidad_contratacion">
            <label>Modalidad</label>
            <span>{{ item.modalidad_contratacion }}</span>
          </div>
          <div class="detail-field" *ngIf="item.tipo_contrato">
            <label>Tipo de contrato</label>
            <span>{{ item.tipo_contrato }}</span>
          </div>
          <div class="detail-field" *ngIf="item.fecha_publicacion">
            <label>Publicación</label>
            <span>{{ item.fecha_publicacion | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="detail-field" *ngIf="item.estado_procedimiento">
            <label>Estado procedimiento</label>
            <span>{{ item.estado_procedimiento }}</span>
          </div>
          <div class="detail-field" *ngIf="item.url_secop" style="grid-column:1/-1">
            <label>Enlace SECOP</label>
            <span><a [href]="item.url_secop" target="_blank" rel="noopener" style="color:var(--c-cta);word-break:break-all">{{ item.url_secop }}</a></span>
          </div>
          <div class="detail-field" *ngIf="item.descripcion_procedimiento" style="grid-column:1/-1">
            <label>Descripción</label>
            <span style="line-height:1.7;color:var(--c-secondary)">{{ item.descripcion_procedimiento }}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConvocatoriaDetailComponent implements OnInit {
  item: SecopConvocatoria | null = null;
  loading = false;
  error = '';
  private id = '';

  constructor(private route: ActivatedRoute, private api: ConvocatoriasApi) {}

  ngOnInit() { this.id = this.route.snapshot.paramMap.get('id') ?? ''; this.load(); }

  load() {
    this.loading = true; this.error = '';
    this.api.getById(this.id).subscribe({
      next: res => { this.item = res.data; this.loading = false; },
      error: () => { this.error = 'No se pudo cargar la convocatoria'; this.loading = false; }
    });
  }
}
