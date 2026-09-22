import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AdminStats, Movie, MoviePageResponse } from '../models/movie.model';

interface AuthResponse {
  token: string;
  username: string;
  role: string;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly TOKEN_KEY = 'cinestore_admin_jwt';
  private readonly BASE_ADMIN_URL = 'http://localhost:8080/api/admin';

  isAdminLoggedIn = signal<boolean>(this.hasValidToken());

  private hasValidToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE_ADMIN_URL}/login`, { username, password }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          this.isAdminLoggedIn.set(true);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAdminLoggedIn.set(false);
  }

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.BASE_ADMIN_URL}/stats`, {
      headers: this.getAuthHeaders()
    });
  }

  getAdminMovies(search?: string, page = 0, size = 20, sortBy?: string, sortDir?: string): Observable<MoviePageResponse> {
    let url = `${this.BASE_ADMIN_URL}/movies?page=${page}&size=${size}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;
    if (sortDir) url += `&sortDir=${encodeURIComponent(sortDir)}`;
    return this.http.get<MoviePageResponse>(url, {
      headers: this.getAuthHeaders()
    });
  }

  updateMovie(id: number, movie: Partial<Movie>): Observable<Movie> {
    return this.http.put<Movie>(`${this.BASE_ADMIN_URL}/movies/${id}`, movie, {
      headers: this.getAuthHeaders()
    });
  }

  addMovie(movie: Partial<Movie>): Observable<Movie> {
    return this.http.post<Movie>(`${this.BASE_ADMIN_URL}/movies`, movie, {
      headers: this.getAuthHeaders()
    });
  }

  deleteMovie(id: number): Observable<any> {
    return this.http.delete(`${this.BASE_ADMIN_URL}/movies/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
