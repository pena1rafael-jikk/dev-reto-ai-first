import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Bookmark } from '../../models/bookmark.model';

@Injectable({ providedIn: 'root' })
export class BookmarksApi {
  constructor(private http: HttpClient) {}

  list(filters: Record<string, string> = {}, limit = 20, offset = 0) {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, v); });
    return this.http.get<{ data: Bookmark[]; meta: any }>('/api/v1/bookmarks', { params });
  }

  create(secop_process_id: string) {
    return this.http.post<{ data: Bookmark }>('/api/v1/bookmarks', { secop_process_id });
  }

  delete(id: number) {
    return this.http.delete<{ data: any }>(`/api/v1/bookmarks/${id}`);
  }
}
