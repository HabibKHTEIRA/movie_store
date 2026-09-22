import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { MovieEvent } from '../models/movie.model';
import { CartService } from './cart.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private cartService = inject(CartService);
  private eventSource: EventSource | null = null;
  private eventSubject = new Subject<MovieEvent>();

  public events$ = this.eventSubject.asObservable();

  constructor() {
    this.connect();
  }

  private connect() {
    if (typeof window === 'undefined' || !('EventSource' in window)) return;

    try {
      this.eventSource = new EventSource(`${environment.apiUrl}/notifications/stream`);

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
        // En cas de perte de connexion, fermer et tenter une reconnexion après 5s
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        setTimeout(() => this.connect(), 5000);
      };
    } catch (e) {
      console.warn('Impossible d’établir la connexion SSE:', e);
    }
  }
}
