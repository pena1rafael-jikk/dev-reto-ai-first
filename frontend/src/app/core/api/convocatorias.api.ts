import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SecopConvocatoria } from '../../models/secop.model';

@Injectable({ providedIn: 'root' })
export class ConvocatoriasApi {
  constructor(private http: HttpClient) {}

  list(filters: Record<string, string>, limit = 20, offset = 0) {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, v); });
    return this.http.get<{ data: SecopConvocatoria[]; meta: any }>('/api/v1/convocatorias', { params });
  }

  getById(id: string) {
    return this.http.get<{ data: SecopConvocatoria }>(`/api/v1/convocatorias/${id}`);
  }
}
