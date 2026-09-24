import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminStats, Movie } from '../../models/movie.model';
import { AuthService } from '../../services/auth.service';
import { MovieService } from '../../services/movie.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="admin-page">
      <!-- FORMULAIRE DE CONNEXION ADMIN -->
      <div class="login-wrapper" *ngIf="!authService.isAdminLoggedIn()">
        <div class="login-card">
          <h1 class="login-title">Administration</h1>

          <form (ngSubmit)="handleLogin()" class="login-form">
            <div class="form-group">
              <label>Identifiant</label>
              <input
                type="text"
                [(ngModel)]="loginUsername"
                name="username"
                class="admin-input"
                placeholder="Identifiant"
                required
              />
            </div>

            <div class="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                [(ngModel)]="loginPassword"
                name="password"
                class="admin-input"
                placeholder="Mot de passe"
                required
              />
            </div>

            <button type="submit" class="btn-primary btn-block" [disabled]="isLoggingIn">
              {{ isLoggingIn ? 'Connexion en cours...' : 'Se connecter' }}
            </button>
          </form>
        </div>
      </div>

      <!-- TABLEAU DE BORD ADMINISTRATION -->
      <div class="dashboard-wrapper" *ngIf="authService.isAdminLoggedIn()">
        <!-- Barre Supérieure Admin -->
        <div class="admin-topbar">
          <div class="admin-topbar-left">
            <h1 class="dashboard-title">Administration</h1>
          </div>
          <div class="topbar-actions">
            <button class="btn-primary" (click)="openAddModal()">
              + Nouveau film
            </button>
            <button class="btn-secondary" (click)="handleLogout()">
              Déconnexion
            </button>
          </div>
        </div>

        <!-- Cartes Statistiques (KPIs) -->
        <div class="kpi-grid" *ngIf="stats">
          <div class="kpi-card">
            <div class="kpi-data">
              <span class="kpi-num">{{ stats.totalMovies }}</span>
              <span class="kpi-label">Films au catalogue</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-data">
              <span class="kpi-num">{{ stats.totalSalesCount }}</span>
              <span class="kpi-label">Copies vendues</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-data">
              <span class="kpi-num">{{ stats.totalRevenue.toFixed(2) }} €</span>
              <span class="kpi-label">Chiffre d'Affaires</span>
            </div>
          </div>
        </div>

        <!-- Recherche & Table de Gestion -->
        <div class="table-card">
          <div class="table-header">
            <h2>Inventaire des films</h2>
            <div class="admin-search-box">
              <input
                type="text"
                placeholder="Rechercher par titre..."
                [(ngModel)]="adminSearch"
                (ngModelChange)="onSearchChange()"
              />
            </div>
          </div>

          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="width: 50px;">Affiche</th>
                  <th (click)="toggleSort('title')" class="sortable-th">
                    Titre
                    <span class="sort-icon">{{ getSortIcon('title') }}</span>
                  </th>
                  <th (click)="toggleSort('year')" class="sortable-th" style="width: 100px;">
                    Année
                    <span class="sort-icon">{{ getSortIcon('year') }}</span>
                  </th>
                  <th (click)="toggleSort('rating')" class="sortable-th" style="width: 100px;">
                    Note
                    <span class="sort-icon">{{ getSortIcon('rating') }}</span>
                  </th>
                  <th style="width: 130px;">Prix (€)</th>
                  <th style="width: 140px;">Copies</th>
                  <th style="width: 110px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let movie of adminMovies">
                  <td>
                    <img
                      [src]="movieService.getPosterUrl(movie.posterPath, movie.title)"
                      [alt]="movie.title"
                      class="table-thumb"
                      (error)="onImageError($event, movie.title)"
                    />
                  </td>
                  <td>
                    <div class="movie-cell-title">{{ movie.title }}</div>
                    <div class="table-sub">{{ movie.genres }}</div>
                  </td>
                  <td>{{ movie.year }}</td>
                  <td>★ {{ movie.rating.toFixed(1) }}</td>
                  <td>
                    <div class="editable-cell">
                      <input
                        type="number"
                        step="0.50"
                        min="1"
                        max="999"
                        [(ngModel)]="movie.price"
                        class="cell-input"
                      />
                      <span>€</span>
                    </div>
                  </td>
                  <td>
                    <div class="editable-cell">
                      <input
                        type="number"
                        min="0"
                        max="99999"
                        [(ngModel)]="movie.copies"
                        class="cell-input"
                      />
                    </div>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="btn-save" (click)="saveMovieChanges(movie)" title="Enregistrer">
                        ✓
                      </button>
                      <button class="btn-del" (click)="deleteMovie(movie.id)" title="Supprimer">
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Table Admin -->
          <div class="admin-pagination" *ngIf="adminTotalPages > 1">
            <button [disabled]="adminCurrentPage === 0" (click)="loadAdminMovies(adminCurrentPage - 1)">
              Précédent
            </button>
            <span>Page {{ adminCurrentPage + 1 }} sur {{ adminTotalPages }}</span>
            <button [disabled]="adminCurrentPage >= adminTotalPages - 1" (click)="loadAdminMovies(adminCurrentPage + 1)">
              Suivant
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Ajout Nouveau Film -->
      <div class="modal-backdrop" *ngIf="showAddModal">
        <div class="modal-card">
          <div class="modal-header">
            <h2>Nouveau film</h2>
            <button class="modal-close" (click)="showAddModal = false">×</button>
          </div>

          <form (ngSubmit)="submitNewMovie()" class="add-movie-form">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Titre du film *</label>
                <input type="text" [(ngModel)]="newMovie.title" name="title" required class="admin-input" />
              </div>
              <div class="form-group" style="width: 120px;">
                <label>Année *</label>
                <input type="number" [(ngModel)]="newMovie.year" name="year" required class="admin-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Genres (séparés par virgule)</label>
                <input type="text" [(ngModel)]="newMovie.genres" name="genres" placeholder="Action, Sci-Fi" class="admin-input" />
              </div>
              <div class="form-group" style="width: 140px;">
                <label>Durée (min)</label>
                <input type="number" [(ngModel)]="newMovie.runtime" name="runtime" class="admin-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Prix (€) *</label>
                <input type="number" step="0.5" [(ngModel)]="newMovie.price" name="price" required class="admin-input" />
              </div>
              <div class="form-group flex-1">
                <label>Copies en stock *</label>
                <input type="number" [(ngModel)]="newMovie.copies" name="copies" required class="admin-input" />
              </div>
              <div class="form-group flex-1">
                <label>Note IMDb</label>
                <input type="number" step="0.1" [(ngModel)]="newMovie.rating" name="rating" class="admin-input" />
              </div>
            </div>

            <div class="form-group">
              <label>Affiche TMDB (chemin ou URL)</label>
              <input type="text" [(ngModel)]="newMovie.posterPath" name="posterPath" placeholder="/poster.jpg" class="admin-input" />
            </div>

            <div class="form-group">
              <label>Description / Synopsis</label>
              <textarea rows="3" [(ngModel)]="newMovie.description" name="description" class="admin-input"></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="showAddModal = false">Annuler</button>
              <button type="submit" class="btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 1140px;
      margin: 0 auto;
      padding: 32px 24px 80px;
    }
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 55vh;
    }
    .login-card {
      max-width: 380px;
      width: 100%;
      padding: 32px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .login-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 20px;
      text-align: center;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-group label {
      display: block;
      font-size: 0.8rem;
      color: #374151;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .admin-input {
      width: 100%;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 8px 12px;
      color: #111827;
      font-size: 0.9rem;
      transition: border-color 0.15s;
    }
    .admin-input:focus {
      outline: none;
      border-color: #111827;
    }
    .btn-block {
      width: 100%;
      padding: 10px;
      margin-top: 8px;
    }

    /* Dashboard */
    .admin-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .dashboard-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
    .topbar-actions {
      display: flex;
      gap: 8px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .kpi-card {
      padding: 20px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .kpi-data {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .kpi-num {
      font-size: 1.6rem;
      font-weight: 700;
      color: #111827;
    }
    .kpi-label {
      font-size: 0.8rem;
      color: #6b7280;
    }

    /* Table */
    .table-card {
      padding: 20px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .table-header h2 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    .admin-search-box input {
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 6px 12px;
      color: #111827;
      font-size: 0.85rem;
      width: 220px;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .admin-table th {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
      color: #4b5563;
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .sortable-th {
      cursor: pointer;
      user-select: none;
    }
    .sortable-th:hover {
      background: #f3f4f6;
      color: #111827;
    }
    .sort-icon {
      font-size: 0.75rem;
      margin-left: 4px;
      color: #9ca3af;
    }
    .admin-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
      font-size: 0.88rem;
      color: #374151;
    }
    .admin-table tbody tr:hover {
      background: #f9fafb;
    }
    .table-thumb {
      width: 36px;
      height: 48px;
      object-fit: cover;
      border-radius: 4px;
      background: #f3f4f6;
    }
    .movie-cell-title {
      font-weight: 600;
      color: #111827;
    }
    .table-sub {
      font-size: 0.75rem;
      color: #6b7280;
    }
    .editable-cell {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .cell-input {
      width: 80px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      color: #111827;
      font-weight: 600;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .cell-input:focus {
      outline: none;
      border-color: #111827;
    }
    .row-actions {
      display: flex;
      gap: 6px;
    }
    .btn-save {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #047857;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-save:hover {
      background: #047857;
      color: #ffffff;
    }
    .btn-del {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-del:hover {
      background: #dc2626;
      color: #ffffff;
    }
    .admin-pagination {
      margin-top: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
    }
    .admin-pagination button {
      padding: 6px 12px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      color: #374151;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
    }
    .admin-pagination button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Modal Form */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 4000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      max-width: 540px;
      width: 100%;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 24px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .modal-header h2 {
      font-size: 1.15rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    .modal-close {
      font-size: 1.4rem;
      color: #6b7280;
      background: none;
      border: none;
      cursor: pointer;
    }
    .add-movie-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .flex-1 {
      flex: 1;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
    .btn-primary {
      background: #111827;
      color: #ffffff;
      border: 1px solid #111827;
      border-radius: 6px;
      padding: 8px 14px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) {
      background: #1f2937;
    }
    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px 14px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-secondary:hover {
      background: #e5e7eb;
    }
  `]
})
export class AdminComponent implements OnInit {
  authService = inject(AuthService);
  movieService = inject(MovieService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  loginUsername = '';
  loginPassword = '';
  isLoggingIn = false;

  stats?: AdminStats;
  adminMovies: Movie[] = [];
  adminSearch = '';
  adminCurrentPage = 0;
  adminTotalPages = 0;

  sortBy: 'title' | 'year' | 'rating' | '' = '';
  sortDir: 'asc' | 'desc' = 'asc';

  showAddModal = false;
  newMovie: Partial<Movie> = {
    title: '',
    year: 2024,
    genres: 'Drame',
    runtime: 120,
    price: 15.00,
    copies: 500,
    rating: 7.5,
    posterPath: '',
    description: ''
  };

  private searchTimeout: any;

  ngOnInit() {
    if (this.authService.isAdminLoggedIn()) {
      this.loadDashboardData();
    }
  }

  handleLogin() {
    if (!this.loginUsername || !this.loginPassword) return;

    this.isLoggingIn = true;
    this.cdr.markForCheck();
    this.authService.login(this.loginUsername, this.loginPassword).subscribe({
      next: () => {
        this.isLoggingIn = false;
        this.cdr.detectChanges();
        this.toastService.show('Connexion réussie.', 'success', 'Administration');
        this.loadDashboardData();
      },
      error: (err) => {
        this.isLoggingIn = false;
        this.cdr.detectChanges();
        const msg = err.error?.message || 'Identifiant ou mot de passe incorrect.';
        this.toastService.show(msg, 'error', 'Connexion échouée');
      }
    });
  }

  handleLogout() {
    this.authService.logout();
    this.cdr.detectChanges();
    this.toastService.show('Déconnecté.', 'info');
  }

  loadDashboardData() {
    this.authService.getAdminStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.cdr.detectChanges();
      },
      error: (e) => console.error(e)
    });
    this.loadAdminMovies(0);
  }

  loadAdminMovies(page = 0) {
    this.adminCurrentPage = page;
    this.authService.getAdminMovies(this.adminSearch, page, 20, this.sortBy, this.sortDir).subscribe({
      next: (res) => {
        this.adminMovies = res.content;
        this.adminTotalPages = res.totalPages;
        this.cdr.detectChanges();
      },
      error: (e) => console.error(e)
    });
  }

  toggleSort(field: 'title' | 'year' | 'rating') {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = 'asc';
    }
    this.loadAdminMovies(0);
  }

  getSortIcon(field: 'title' | 'year' | 'rating'): string {
    if (this.sortBy !== field) return '↕';
    return this.sortDir === 'asc' ? '▲' : '▼';
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadAdminMovies(0);
    }, 300);
  }

  saveMovieChanges(movie: Movie) {
    this.authService.updateMovie(movie.id, {
      price: movie.price,
      copies: movie.copies,
      title: movie.title,
      year: movie.year,
      genres: movie.genres
    }).subscribe({
      next: (updated) => {
        this.toastService.show(
          `'${updated.title}' mis à jour : ${updated.price.toFixed(2)}€ | ${updated.copies} copies.`,
          'success',
          'Enregistré'
        );
      },
      error: (err) => {
        this.toastService.show("Erreur lors de la mise à jour.", 'error');
      }
    });
  }

  deleteMovie(id: number) {
    if (confirm('Voulez-vous vraiment supprimer ce film du catalogue ?')) {
      this.authService.deleteMovie(id).subscribe({
        next: () => {
          this.toastService.show('Film supprimé.', 'warning');
          this.loadAdminMovies(this.adminCurrentPage);
        },
        error: () => this.toastService.show('Erreur suppression.', 'error')
      });
    }
  }

  openAddModal() {
    this.newMovie = {
      title: '',
      year: 2024,
      genres: 'Drame',
      runtime: 120,
      price: 15.00,
      copies: 500,
      rating: 7.5,
      posterPath: '',
      description: ''
    };
    this.showAddModal = true;
  }

  submitNewMovie() {
    if (!this.newMovie.title) return;
    this.authService.addMovie(this.newMovie).subscribe({
      next: (created) => {
        this.showAddModal = false;
        this.toastService.show(`Film '${created.title}' ajouté.`, 'success');
        this.loadAdminMovies(0);
        this.authService.getAdminStats().subscribe(s => this.stats = s);
      },
      error: () => this.toastService.show('Erreur création film.', 'error')
    });
  }

  onImageError(event: Event, title: string) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.movieService.getPosterUrl(undefined, title);
  }
}
