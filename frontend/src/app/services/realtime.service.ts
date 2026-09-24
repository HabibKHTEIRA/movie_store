import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { MovieEvent } from '../models/movie.model';
import { CartService } from './cart.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private cartService = inject(CartService);
  private eventSource: EventSource | null = null;
  private eventSubject = new Subject<MovieEvent>();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  public events$ = this.eventSubject.asObservable();

  constructor() {
    this.connect();
  }

  private connect() {
    if (typeof window === 'undefined' || !('EventSource' in window)) return;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      this.eventSource = new EventSource(`${environment.apiUrl}/notifications/stream`);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
      };

      this.eventSource.addEventListener('MOVIE_UPDATE', (event: MessageEvent) => {
        try {
          const data: MovieEvent = JSON.parse(event.data);
          this.eventSubject.next(data);
          this.cartService.updateMovieRealtime(data.movieId, data.price, data.copies);
        } catch (e) {
          console.error('Erreur parsing SSE:', e);
        }
      });

      this.eventSource.onerror = () => {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        // Retry borné avec backoff raisonnable (maximum 5 tentatives) sans boucle infinie
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(2000 * this.reconnectAttempts, 20000);
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connect(), delay);
        } else {
          console.warn('Flux SSE : limite maximale de reconnexions atteinte.');
        }
      };
    } catch (e) {
      console.warn('Impossible d’établir la connexion SSE:', e);
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
