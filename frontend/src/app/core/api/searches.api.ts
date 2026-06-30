import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SavedSearch } from '../../models/saved-search.model';

@Injectable({ providedIn: 'root' })
export class SearchesApi {
  constructor(private http: HttpClient) {}
  list() { return this.http.get<{ data: SavedSearch[] }>('/api/v1/searches'); }
  create(name: string, query_params: Record<string, string>) {
    return this.http.post<{ data: SavedSearch }>('/api/v1/searches', { name, query_params });
  }
  update(id: number, body: Partial<{ name: string; query_params: Record<string, string> }>) {
    return this.http.put<{ data: SavedSearch }>(`/api/v1/searches/${id}`, body);
  }
  delete(id: number) { return this.http.delete<{ data: any }>(`/api/v1/searches/${id}`); }
}
