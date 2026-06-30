import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

const TOKEN_KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated = signal(!!localStorage.getItem(TOKEN_KEY));

  constructor(private http: HttpClient, private router: Router) {}

  register(email: string, password: string, full_name: string) {
    return this.http.post<any>('/api/v1/auth/register', { email, password, full_name }).pipe(
      tap(res => this._saveToken(res.access_token))
    );
  }

  login(email: string, password: string) {
    return this.http.post<any>('/api/v1/auth/login', { email, password }).pipe(
      tap(res => this._saveToken(res.access_token))
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private _saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this.isAuthenticated.set(true);
  }
}
