import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MovieDetail } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { CartService } from '../../services/cart.service';
import { RealtimeService } from '../../services/realtime.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="detail-page" *ngIf="movie">
      <!-- Bouton Retour -->
      <div class="breadcrumb-bar">
        <a routerLink="/" class="back-link">
          ← Retour au catalogue
        </a>
      </div>

      <!-- Fiche Film -->
      <div class="movie-card-detail">
        <div class="poster-col">
          <div class="poster-container">
            <img
              [src]="movieService.getPosterUrl(movie.posterPath, movie.title)"
              [alt]="movie.title"
              class="detail-poster"
              (error)="onImageError($event)"
            />
          </div>
        </div>

        <div class="info-col">
          <div class="genres-tags">
            <span class="genre-pill" *ngFor="let g of getGenresList()">{{ g }}</span>
          </div>

          <h1 class="movie-title">{{ movie.title }}</h1>

          <div class="meta-row">
            <div class="meta-item">
              <span class="meta-label">Année</span>
              <span class="meta-val">{{ movie.year }}</span>
            </div>
            <div class="meta-divider"></div>
            <div class="meta-item">
              <span class="meta-label">Durée</span>
              <span class="meta-val">{{ movie.runtime }} min</span>
            </div>
            <div class="meta-divider"></div>
            <div class="meta-item">
              <span class="meta-label">Note IMDb</span>
              <span class="meta-val">★ {{ movie.rating.toFixed(1) }} <small class="votes">({{ movie.numVotes | number }} votes)</small></span>
            </div>
          </div>

          <p class="movie-desc">{{ movie.description }}</p>

          <!-- Zone d'Achat & Stock -->
          <div class="purchase-box">
            <div class="price-stock-info">
              <div class="price-display">
                <span class="price-label">Prix unitaire</span>
                <div class="price-number">{{ movie.price.toFixed(2) }} <span class="currency">€</span></div>
              </div>

              <div class="stock-display">
                <span class="stock-label">Disponibilité :</span>
                <span
                  class="badge-stock"
                  [ngClass]="{
                    'in-stock': movie.copies > 50,
                    'low-stock': movie.copies <= 50 && movie.copies > 0,
                    'out-of-stock': movie.copies <= 0
                  }"
                >
                  <span *ngIf="movie.copies > 50">En stock ({{ movie.copies }} copies)</span>
                  <span *ngIf="movie.copies <= 50 && movie.copies > 0">Stock limité ({{ movie.copies }} copies)</span>
                  <span *ngIf="movie.copies <= 0">Épuisé</span>
                </span>
              </div>
            </div>

            <!-- Contrôles Quantité & Ajout Panier -->
            <div class="actions-row">
              <div class="qty-selector" *ngIf="movie.copies > 0">
                <button (click)="changeQuantity(-1)" [disabled]="orderQuantity <= 1" aria-label="Diminuer">-</button>
                <span class="qty-val">{{ orderQuantity }}</span>
                <button (click)="changeQuantity(1)" [disabled]="orderQuantity >= movie.copies" aria-label="Augmenter">+</button>
              </div>

              <button
                class="btn-buy"
                [disabled]="movie.copies <= 0"
                (click)="addToCart()"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span>{{ movie.copies > 0 ? 'Ajouter au Panier' : 'Indisponible' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-page {
      max-width: 1080px;
      margin: 0 auto;
      padding: 32px 24px 80px;
    }
    .breadcrumb-bar {
      margin-bottom: 24px;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #4b5563;
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      transition: color 0.15s;
    }
    .back-link:hover {
      color: #111827;
    }
    .movie-card-detail {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 40px;
      padding: 32px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .poster-container {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      aspect-ratio: 2 / 3;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
    }
    .detail-poster {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .info-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .genres-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .genre-pill {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      color: #374151;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    .movie-title {
      font-size: clamp(1.6rem, 3.5vw, 2.2rem);
      font-weight: 700;
      color: #111827;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 12px 0;
      border-top: 1px solid #f3f4f6;
      border-bottom: 1px solid #f3f4f6;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .meta-label {
      font-size: 0.72rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .meta-val {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
    }
    .meta-divider {
      width: 1px;
      height: 24px;
      background: #e5e7eb;
    }
    .votes {
      font-size: 0.8rem;
      color: #6b7280;
      font-weight: 400;
    }
    .movie-desc {
      color: #4b5563;
      font-size: 0.95rem;
      line-height: 1.6;
    }
    .purchase-box {
      margin-top: auto;
      padding: 20px;
      border-radius: 8px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .price-stock-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 12px;
    }
    .price-display {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .price-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .price-number {
      font-size: 1.8rem;
      font-weight: 700;
      color: #111827;
      line-height: 1;
    }
    .price-number .currency {
      font-size: 1.3rem;
    }
    .stock-display {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .stock-label {
      font-size: 0.75rem;
      color: #6b7280;
    }
    .badge-stock {
      font-size: 0.8rem;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .badge-stock.in-stock {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .badge-stock.low-stock {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .badge-stock.out-of-stock {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .actions-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .qty-selector {
      display: flex;
      align-items: center;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      overflow: hidden;
    }
    .qty-selector button {
      width: 34px;
      height: 38px;
      background: none;
      border: none;
      color: #111827;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .qty-selector button:hover:not(:disabled) {
      background: #f3f4f6;
    }
    .qty-selector button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .qty-val {
      width: 36px;
      text-align: center;
      font-weight: 600;
      color: #111827;
      font-size: 0.95rem;
    }
    .btn-buy {
      flex: 1;
      height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #111827;
      color: #ffffff;
      border: 1px solid #111827;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .btn-buy:hover:not(:disabled) {
      background: #1f2937;
      border-color: #1f2937;
    }
    .btn-buy:disabled {
      background: #9ca3af;
      border-color: #9ca3af;
      cursor: not-allowed;
    }

    @media (max-width: 800px) {
      .movie-card-detail {
        grid-template-columns: 1fr;
      }
      .poster-container {
        max-width: 260px;
        margin: 0 auto;
      }
      .stock-display {
        align-items: flex-start;
      }
    }
  `]
})
export class MovieDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  movieService = inject(MovieService);
  private cartService = inject(CartService);
  private realtimeService = inject(RealtimeService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  movie?: MovieDetail;
  orderQuantity = 1;
  private realtimeSub?: Subscription;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadMovie(Number(id));
      }
    });

    this.subscribeRealtimeEvents();
  }

  ngOnDestroy() {
    if (this.realtimeSub) {
      this.realtimeSub.unsubscribe();
    }
  }

  loadMovie(id: number) {
    this.movieService.getMovieDetail(id).subscribe({
      next: (data) => {
        this.movie = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement film:', err);
        this.cdr.detectChanges();
      }
    });
  }

  getGenresList(): string[] {
    if (!this.movie || !this.movie.genres) return ['Cinéma'];
    return this.movie.genres.split(',').map(g => g.trim());
  }

  changeQuantity(delta: number) {
    if (!this.movie) return;
    const next = this.orderQuantity + delta;
    if (next >= 1 && next <= this.movie.copies) {
      this.orderQuantity = next;
    }
  }

  addToCart() {
    if (this.movie && this.movie.copies > 0) {
      this.cartService.addToCart(this.movie, this.orderQuantity);
      this.toastService.show(
        `${this.orderQuantity} copie(s) de '${this.movie.title}' ajoutée(s) au panier.`,
        'success',
        'Panier'
      );
      this.cartService.openCart();
    }
  }

  onImageError(event: any) {
    if (this.movie) {
      event.target.src = this.movieService.getPosterUrl('', this.movie.title);
    }
  }

  private subscribeRealtimeEvents() {
    this.realtimeSub = this.realtimeService.events$.subscribe((event) => {
      if (this.movie && this.movie.id === event.movieId) {
        this.movie = {
          ...this.movie,
          copies: event.copies !== undefined ? event.copies : this.movie.copies,
          price: event.price !== undefined ? event.price : this.movie.price
        };
        this.cdr.detectChanges();
      }
    });
  }
}
