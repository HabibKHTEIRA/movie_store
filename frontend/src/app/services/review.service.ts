import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review } from '../models/movie.model';
import { ClientIdService } from './client-id.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);
  private clientIdService = inject(ClientIdService);
  private readonly API_URL = 'http://localhost:8080/api/reviews';

  getReviews(movieId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.API_URL}/movie/${movieId}`);
  }

  addReview(movieId: number, authorName: string, rating: number, comment: string): Observable<Review> {
    const headers = new HttpHeaders({
      'X-Client-Id': this.clientIdService.getClientId(),
      'Content-Type': 'application/json'
    });

    const body = { authorName, rating, comment };
    return this.http.post<Review>(`${this.API_URL}/movie/${movieId}`, body, { headers });
  }
}
