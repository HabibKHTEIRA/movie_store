import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CartItem, Purchase } from '../models/movie.model';
import { ClientIdService } from './client-id.service';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private http = inject(HttpClient);
  private clientIdService = inject(ClientIdService);
  private readonly API_URL = 'http://localhost:8080/api/purchases';
  private readonly PURCHASED_IDS_KEY = 'cinestore_purchased_ids';

  // Ensemble réactif des IDs de films achetés par ce navigateur
  purchasedMovieIds = signal<Set<number>>(this.loadPurchasedIds());

  private loadPurchasedIds(): Set<number> {
    try {
      const data = localStorage.getItem(this.PURCHASED_IDS_KEY);
      return data ? new Set<number>(JSON.parse(data)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  }

  private savePurchasedId(movieId: number) {
    const current = this.purchasedMovieIds();
    current.add(movieId);
    this.purchasedMovieIds.set(new Set(current));
    try {
      localStorage.setItem(this.PURCHASED_IDS_KEY, JSON.stringify(Array.from(current)));
    } catch (e) {
      console.error('Erreur sauvegarde ID achetés:', e);
    }
  }

  hasPurchased(movieId: number): boolean {
    return this.purchasedMovieIds().has(movieId);
  }

  checkout(items: CartItem[]): Observable<Purchase[]> {
    const headers = new HttpHeaders({
      'X-Client-Id': this.clientIdService.getClientId(),
      'Content-Type': 'application/json'
    });

    const body = {
      items: items.map(item => ({
        movieId: item.movie.id,
        quantity: item.quantity
      }))
    };

    return this.http.post<Purchase[]>(this.API_URL, body, { headers }).pipe(
      tap(purchases => {
        purchases.forEach(p => this.savePurchasedId(p.movieId));
      })
    );
  }

  getMyPurchases(): Observable<Purchase[]> {
    const headers = new HttpHeaders({
      'X-Client-Id': this.clientIdService.getClientId()
    });
    return this.http.get<Purchase[]>(`${this.API_URL}/my-purchases`, { headers }).pipe(
      tap(purchases => {
        purchases.forEach(p => this.savePurchasedId(p.movieId));
      })
    );
  }
}
