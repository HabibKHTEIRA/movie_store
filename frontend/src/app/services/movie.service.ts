import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movie, MovieDetail, MoviePageResponse } from '../models/movie.model';
import { ClientIdService } from './client-id.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private http = inject(HttpClient);
  private clientIdService = inject(ClientIdService);
  private readonly API_URL = `${environment.apiUrl}/movies`;

  getMovies(
    search?: string,
    genre?: string,
    year?: number,
    minRating?: number,
    minPrice?: number,
    maxPrice?: number,
    inStockOnly = false,
    page = 0,
    size = 20,
    sort = 'popularity',
  ): Observable<MoviePageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    // Robustesse pour compatibilité maximale avec la base PostgreSQL de production
    const effectiveSearch = search && search.trim() ? search.trim() : '%';
    const effectiveGenre = genre && genre !== 'ALL' ? genre : '%';

    params = params.set('search', effectiveSearch);
    params = params.set('genre', effectiveGenre);

    if (year && year > 0) params = params.set('year', year.toString());
    if (minRating && minRating > 0) params = params.set('minRating', minRating.toString());
    if (minPrice && minPrice > 0) params = params.set('minPrice', minPrice.toString());
    if (maxPrice && maxPrice > 0) params = params.set('maxPrice', maxPrice.toString());
    if (inStockOnly) params = params.set('inStockOnly', 'true');

    return this.http.get<MoviePageResponse>(this.API_URL, { params });
  }

  getMovieDetail(id: number): Observable<MovieDetail> {
    const headers = new HttpHeaders({
      'X-Client-Id': this.clientIdService.getClientId(),
    });
    return this.http.get<MovieDetail>(`${this.API_URL}/${id}`, { headers });
  }

  getGenres(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/genres`);
  }

  getYears(): Observable<number[]> {
    return this.http.get<number[]>(`${this.API_URL}/years`);
  }

  reserveCopies(movieId: number, quantity = 1): Observable<Movie> {
    return this.http.post<Movie>(`${this.API_URL}/${movieId}/reserve`, { quantity });
  }

  releaseCopies(movieId: number, quantity = 1): Observable<Movie> {
    return this.http.post<Movie>(`${this.API_URL}/${movieId}/release`, { quantity });
  }

  getPosterUrl(posterPath?: string, title = 'Cinema'): string {
    if (posterPath && posterPath.trim().length > 2) {
      if (posterPath.startsWith('http')) return posterPath;
      return `https://image.tmdb.org/t/p/w500${posterPath.startsWith('/') ? '' : '/'}${posterPath}`;
    }

    const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 750" width="100%" height="100%">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="50%" stop-color="#1e1b4b" />
            <stop offset="100%" stop-color="#090d16" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="500" height="750" fill="url(#grad)" />
        <circle cx="250" cy="280" r="180" fill="url(#glow)" />
        <g stroke="#f59e0b" stroke-width="3" fill="none" opacity="0.6">
          <circle cx="250" cy="280" r="90" />
          <circle cx="250" cy="280" r="30" fill="#f59e0b" opacity="0.4" />
          <line x1="250" y1="190" x2="250" y2="370" />
          <line x1="160" y1="280" x2="340" y2="280" />
        </g>
        <text x="250" y="440" font-family="'Cinzel', serif" font-size="28" fill="#f59e0b" text-anchor="middle" letter-spacing="6">★ ★ ★ ★ ★</text>
        <text x="250" y="480" font-family="'Outfit', sans-serif" font-weight="600" font-size="14" fill="#94a3b8" text-anchor="middle" letter-spacing="4">ÉDITION COLLECTOR</text>
        <text x="250" y="560" font-family="'Outfit', sans-serif" font-weight="800" font-size="26" fill="#ffffff" text-anchor="middle">
          <tspan x="250" dy="0">${safeTitle.substring(0, 24)}</tspan>
        </text>
        <rect x="180" y="620" width="140" height="32" rx="16" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="250" y="641" font-family="'Outfit', sans-serif" font-weight="700" font-size="13" fill="#f59e0b" text-anchor="middle">CINÉSTORE MASTER</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
}
