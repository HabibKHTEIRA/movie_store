import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { RealtimeService } from '../../services/realtime.service';
import { MovieCardComponent } from '../movie-card/movie-card.component';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MovieCardComponent],
  template: `
    <div class="catalog-page">
      <!-- BARRE DE RECHERCHE & FILTRES EN LISTES DÉROULANTES -->
      <section class="filters-bar">
        <!-- Recherche par titre -->
        <div class="search-box">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Rechercher un film..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
          />
          <button class="clear-btn" *ngIf="searchQuery" (click)="clearSearch()">×</button>
        </div>

        <!-- Filtre Année en liste déroulante -->
        <div class="select-group">
          <select [(ngModel)]="selectedYear" (change)="onFilterChange()" class="filter-select">
            <option [ngValue]="null">Toutes les années</option>
            <option *ngFor="let yr of availableYears" [ngValue]="yr">
              {{ yr }}
            </option>
          </select>
        </div>

        <!-- Filtre Tags / Genres en liste déroulante -->
        <div class="select-group">
          <select [(ngModel)]="selectedGenre" (change)="onFilterChange()" class="filter-select">
            <option value="ALL">Tous les genres</option>
            <option *ngFor="let g of availableGenres" [value]="g">
              {{ g }}
            </option>
          </select>
        </div>

        <!-- Tri en liste déroulante -->
        <div class="select-group">
          <select [(ngModel)]="selectedSort" (change)="onFilterChange()" class="filter-select">
            <option value="popularity">Trier : Popularité</option>
            <option value="rating">Trier : Meilleure note</option>
            <option value="price_asc">Trier : Prix croissant</option>
            <option value="price_desc">Trier : Prix décroissant</option>
            <option value="year_desc">Trier : Plus récent</option>
            <option value="year_asc">Trier : Plus ancien</option>
            <option value="title_asc">Trier : Titre (A-Z)</option>
          </select>
        </div>
      </section>

      <!-- Grille Principale des Films (20 par page) -->
      <section class="movies-section">
        <!-- Skeleton Loading pendant le chargement -->
        <div class="skeleton-grid" *ngIf="isLoading">
          <div class="skeleton-card" *ngFor="let s of [1,2,3,4,5,6,7,8,9,10,11,12]">
            <div class="skeleton-poster"></div>
            <div class="skeleton-line title"></div>
            <div class="skeleton-line meta"></div>
            <div class="skeleton-line price"></div>
          </div>
        </div>

        <!-- État Erreur Serveur -->
        <div class="empty-state" *ngIf="!isLoading && loadError">
          <h3>Impossible de charger les films</h3>
          <p>Assurez-vous que le serveur backend est bien démarré sur le port 8080.</p>
          <button class="btn-primary" (click)="loadMovies()">Réessayer</button>
        </div>

        <!-- État Aucun Résultat -->
        <div class="empty-state" *ngIf="!isLoading && !loadError && movies.length === 0">
          <h3>Aucun film trouvé</h3>
          <p>Aucun résultat ne correspond à vos critères de recherche.</p>
          <button class="btn-secondary" (click)="resetFilters()">Réinitialiser</button>
        </div>

        <!-- Grille des Films -->
        <div class="movies-grid" *ngIf="!isLoading && !loadError && movies.length > 0">
          <app-movie-card
            *ngFor="let movie of movies; trackBy: trackMovieById"
            [movie]="movie"
          ></app-movie-card>
        </div>

        <!-- Pagination Numérotée (1..n) -->
        <nav class="pagination-nav" *ngIf="!isLoading && totalPages > 1" aria-label="Pagination">
          <button
            class="page-nav-btn"
            [disabled]="currentPage === 0"
            (click)="goToPage(0)"
            title="Première page"
          >
            «
          </button>

          <button
            class="page-nav-btn"
            [disabled]="currentPage === 0"
            (click)="goToPage(currentPage - 1)"
          >
            ←
          </button>

          <div class="page-numbers">
            <ng-container *ngFor="let p of getVisiblePageNumbers()">
              <button
                *ngIf="p !== -1"
                class="page-num-btn"
                [class.active]="p === currentPage"
                (click)="goToPage(p)"
              >
                {{ p + 1 }}
              </button>
              <span *ngIf="p === -1" class="page-ellipsis">...</span>
            </ng-container>
          </div>

          <button
            class="page-nav-btn"
            [disabled]="currentPage >= totalPages - 1"
            (click)="goToPage(currentPage + 1)"
          >
            →
          </button>

          <button
            class="page-nav-btn"
            [disabled]="currentPage >= totalPages - 1"
            (click)="goToPage(totalPages - 1)"
            title="Dernière page"
          >
            »
          </button>
        </nav>
      </section>
    </div>
  `,
  styles: [`
    .catalog-page {
      max-width: 1300px;
      margin: 0 auto;
      padding: 30px 24px 60px;
    }

    /* BARRE DE FILTRES EN LISTES DÉROULANTES */
    .filters-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
      flex-wrap: wrap;
      background: #ffffff;
      padding: 16px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
    }
    .search-box {
      flex: 2;
      min-width: 240px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f9fafb;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 9px 14px;
      transition: border-color 0.15s;
    }
    .search-box:focus-within {
      border-color: #111827;
      background: #ffffff;
    }
    .search-box input {
      flex: 1;
      border: none;
      background: transparent;
      color: #111827;
      font-size: 0.95rem;
      outline: none;
    }
    .clear-btn {
      color: #9ca3af;
      font-size: 1.2rem;
      line-height: 1;
      padding: 0 4px;
    }
    .clear-btn:hover {
      color: #111827;
    }
    .select-group {
      flex: 1;
      min-width: 170px;
    }
    .filter-select {
      width: 100%;
      background: #f9fafb;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: #111827;
      padding: 10px 14px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      outline: none;
      transition: border-color 0.15s;
    }
    .filter-select:focus {
      border-color: #111827;
      background: #ffffff;
    }

    /* Grille des Films */
    .movies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 24px;
    }

    /* Skeleton Loading */
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 24px;
    }
    .skeleton-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .skeleton-poster {
      aspect-ratio: 2 / 3;
      border-radius: var(--radius-md);
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    .skeleton-line {
      height: 14px;
      border-radius: 4px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    .skeleton-line.title { width: 80%; height: 16px; }
    .skeleton-line.meta { width: 45%; }
    .skeleton-line.price { width: 35%; margin-top: 6px; }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* États Vide & Erreur */
    .empty-state {
      padding: 60px 20px;
      text-align: center;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin: 30px 0;
    }
    .empty-state h3 { color: #111827; font-size: 1.2rem; }
    .empty-state p { color: #6b7280; font-size: 0.95rem; }

    /* PAGINATION (1..n) */
    .pagination-nav {
      margin-top: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .page-nav-btn {
      padding: 8px 14px;
      border-radius: var(--radius-md);
      background: #ffffff;
      border: 1px solid var(--border-color);
      color: #111827;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .page-nav-btn:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #d1d5db;
    }
    .page-nav-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
    .page-numbers {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .page-num-btn {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      background: #ffffff;
      border: 1px solid var(--border-color);
      color: #4b5563;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .page-num-btn:hover {
      background: #f3f4f6;
      color: #111827;
    }
    .page-num-btn.active {
      background: #111827;
      color: #ffffff;
      border-color: #111827;
      font-weight: 700;
    }
    .page-ellipsis {
      padding: 0 4px;
      color: #9ca3af;
      font-weight: 700;
    }

    @media (max-width: 768px) {
      .catalog-page { padding: 20px 16px 40px; }
      .filters-bar { flex-direction: column; align-items: stretch; }
      .select-group { width: 100%; }
    }
  `]
})
export class MovieListComponent implements OnInit, OnDestroy {
  private movieService = inject(MovieService);
  private realtimeService = inject(RealtimeService);
  private cdr = inject(ChangeDetectorRef);

  movies: Movie[] = [];
  availableGenres: string[] = [];
  availableYears: number[] = [];

  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  readonly pageSize = 20; // Exactement 20 films par page

  isLoading = true;
  loadError = false;

  // Filtres en listes déroulantes
  searchQuery = '';
  selectedYear: number | null = null;
  selectedGenre = 'ALL';
  selectedSort = 'popularity';

  private searchTimeout: any;
  private realtimeSub?: Subscription;

  ngOnInit() {
    this.loadFilterOptions();
    this.loadMovies();
    this.subscribeRealtimeEvents();
  }

  ngOnDestroy() {
    if (this.realtimeSub) {
      this.realtimeSub.unsubscribe();
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  trackMovieById(index: number, movie: Movie): number {
    return movie.id;
  }

  loadFilterOptions() {
    this.movieService.getGenres().subscribe({
      next: (genres) => {
        this.availableGenres = genres;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur chargement genres:', err)
    });

    this.movieService.getYears().subscribe({
      next: (years) => {
        this.availableYears = years;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur chargement années:', err)
    });
  }

  loadMovies() {
    this.isLoading = true;
    this.loadError = false;
    this.cdr.markForCheck();

    this.movieService.getMovies(
      this.searchQuery,
      this.selectedGenre,
      this.selectedYear ? this.selectedYear : undefined,
      undefined,
      undefined,
      undefined,
      false,
      this.currentPage,
      this.pageSize, // Exactement 20 films par page
      this.selectedSort
    ).subscribe({
      next: (res) => {
        this.movies = res.content || [];
        this.totalElements = res.totalElements || 0;
        this.totalPages = res.totalPages || 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement films:', err);
        this.loadError = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 0;
      this.loadMovies();
    }, 300);
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 0;
    this.loadMovies();
  }

  onFilterChange() {
    this.currentPage = 0;
    this.loadMovies();
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedYear = null;
    this.selectedGenre = 'ALL';
    this.selectedSort = 'popularity';
    this.currentPage = 0;
    this.loadMovies();
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadMovies();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getVisiblePageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const pages: number[] = [];
    pages.push(0);

    let start = Math.max(1, current - 2);
    let end = Math.min(total - 2, current + 2);

    if (start > 1) {
      pages.push(-1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 2) {
      pages.push(-1);
    }

    pages.push(total - 1);
    return pages;
  }

  private subscribeRealtimeEvents() {
    this.realtimeSub = this.realtimeService.events$.subscribe((event) => {
      let updated = false;
      this.movies = this.movies.map(m => {
        if (m.id === event.movieId) {
          updated = true;
          return {
            ...m,
            copies: event.copies !== undefined ? event.copies : m.copies,
            price: event.price !== undefined ? event.price : m.price
          };
        }
        return m;
      });
      if (updated) {
        this.cdr.detectChanges();
      }
    });
  }
}
