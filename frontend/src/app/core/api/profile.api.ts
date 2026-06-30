import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class ProfileApi {
  constructor(private http: HttpClient) {}
  get() { return this.http.get<User>('/api/v1/profile'); }
  update(full_name: string) { return this.http.put<User>('/api/v1/profile', { full_name }); }
}
