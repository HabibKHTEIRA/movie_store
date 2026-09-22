import { Component, Input, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="movie-card" [class.out-of-stock]="movie.copies <= 0">
      <!-- Image Poster Container -->
      <a [routerLink]="['/movie', movie.id]" class="poster-link">
        <div class="poster-wrapper">
          <img
            [src]="movieService.getPosterUrl(movie.posterPath, movie.title)"
            [alt]="movie.title"
            class="poster-img"
            loading="lazy"
            (error)="onImageError($event)"
          />
          <div class="poster-overlay">
            <span class="btn-view-details">Détails</span>
          </div>

          <!-- Badge Note IMDb -->
          <div class="rating-badge">
            <span class="star-icon">★</span>
            <span class="rating-val">{{ movie.rating.toFixed(1) }}</span>
          </div>

          <!-- Badge Année -->
          <div class="year-badge">{{ movie.year }}</div>
        </div>
      </a>

      <!-- Contenu & Informations Film -->
      <div class="card-content">
        <div class="genres-row">
          <span class="genre-pill" *ngFor="let g of getGenresList()">{{ g }}</span>
        </div>

        <a [routerLink]="['/movie', movie.id]" class="title-link">
          <h3 class="movie-title" [title]="movie.title">{{ movie.title }}</h3>
        </a>

        <!-- Statut Stock -->
        <div class="stock-status-row">
          <span class="stock-text" [class.out]="movie.copies <= 0">
            {{ movie.copies > 0 ? (movie.copies + ' copies') : 'Épuisé' }}
          </span>
        </div>

        <!-- Ligne Prix & Bouton d'Achat -->
        <div class="card-footer">
          <div class="price-container">
            <span class="price-amount">{{ movie.price.toFixed(2) }} €</span>
          </div>

          <button
            class="btn-add-cart"
            [disabled]="movie.copies <= 0"
            (click)="addToCart($event)"
            [title]="movie.copies <= 0 ? 'Rupture de stock' : 'Ajouter au panier'"
          >
            {{ movie.copies > 0 ? 'Ajouter' : 'Rupture' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .movie-card {
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      position: relative;
      transition: box-shadow 0.2s, transform 0.2s;
      height: 100%;
    }
    .movie-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-3px);
    }
    .poster-link {
      display: block;
      position: relative;
      overflow: hidden;
      aspect-ratio: 2 / 3;
      background: #f3f4f6;
    }
    .poster-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .poster-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .movie-card:hover .poster-img {
      transform: scale(1.03);
    }
    .poster-overlay {
      position: absolute;
      inset: 0;
      background: rgba(17, 24, 39, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .movie-card:hover .poster-overlay {
      opacity: 1;
    }
    .btn-view-details {
      padding: 7px 16px;
      border-radius: var(--radius-md);
      background: #ffffff;
      color: #111827;
      font-weight: 700;
      font-size: 0.85rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
    .rating-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--border-color);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #111827;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .star-icon { color: #111827; font-size: 0.85rem; }
    .year-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--border-color);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      font-weight: 600;
      color: #4b5563;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .card-content {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 6px;
    }
    .genres-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .genre-pill {
      font-size: 0.72rem;
      background: #f3f4f6;
      border: 1px solid var(--border-color);
      padding: 2px 7px;
      border-radius: 4px;
      color: #4b5563;
      font-weight: 500;
    }
    .title-link {
      display: block;
      color: inherit;
    }
    .movie-title {
      font-size: 1rem;
      font-weight: 700;
      line-height: 1.35;
      color: #111827;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .title-link:hover .movie-title {
      color: #4b5563;
    }
    .stock-status-row {
      margin-top: 2px;
    }
    .stock-text {
      font-size: 0.8rem;
      color: #6b7280;
      font-weight: 500;
    }
    .stock-text.out {
      color: #b91c1c;
      font-weight: 700;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 10px;
      border-top: 1px solid var(--border-color);
    }
    .price-amount {
      font-size: 1.1rem;
      font-weight: 800;
      color: #111827;
    }
    .btn-add-cart {
      padding: 7px 14px;
      border-radius: var(--radius-md);
      background: #111827;
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-add-cart:hover:not(:disabled) {
      background: #374151;
    }
    .btn-add-cart:disabled {
      background: #e5e7eb;
      color: #9ca3af;
      cursor: not-allowed;
    }
  `]
})
export class MovieCardComponent {
  private cdr = inject(ChangeDetectorRef);
  private _movie!: Movie;

  @Input({ required: true })
  set movie(val: Movie) {
    this._movie = val;
    this.cdr.markForCheck();
  }
  get movie(): Movie {
    return this._movie;
  }

  movieService = inject(MovieService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  getGenresList(): string[] {
    if (!this.movie || !this.movie.genres) return ['Cinéma'];
    return this.movie.genres.split(',').map(g => g.trim()).slice(0, 2);
  }

  addToCart(event: Event) {
    event.stopPropagation();
    if (this.movie.copies <= 0) return;
    this.cartService.addToCart(this.movie, 1);
    this.toastService.show(
      `'${this.movie.title}' ajouté au panier.`,
      'success',
      'Panier'
    );
  }

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.movieService.getPosterUrl(undefined, this.movie.title);
  }
}
