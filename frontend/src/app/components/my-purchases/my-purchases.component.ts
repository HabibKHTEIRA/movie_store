import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Purchase } from '../../models/movie.model';
import { PurchaseService } from '../../services/purchase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-my-purchases',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="purchases-page">
      <div class="header-section">
        <h1 class="page-title">Mes Achats</h1>
        <p class="page-subtitle">
          Retrouvez l'historique de vos achats effectués lors de votre session.
        </p>
      </div>

      <!-- État Chargement -->
      <div class="loading-box" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Chargement de vos achats...</p>
      </div>

      <!-- État Erreur Serveur -->
      <div class="error-state" *ngIf="!isLoading && loadError">
        <div class="error-icon">⚠️</div>
        <h2>Connexion au serveur impossible</h2>
        <p>Le serveur backend n'a pas répondu. Veuillez vérifier la connexion.</p>
        <button class="btn-primary" (click)="loadPurchases()">Réessayer</button>
      </div>

      <!-- État Aucun Achat -->
      <div class="empty-state" *ngIf="!isLoading && !loadError && purchases.length === 0">
        <div class="empty-icon">🎬</div>
        <h2>Aucun achat enregistré</h2>
        <p>Vous n'avez pas encore acheté de film au cours de cette session.</p>
        <a routerLink="/" class="btn-primary">Consulter le catalogue</a>
      </div>

      <!-- Grille des Achats -->
      <div class="purchases-grid" *ngIf="!isLoading && !loadError && purchases.length > 0">
        <div class="purchase-card" *ngFor="let p of purchases">
          <div class="card-main">
            <h3 class="movie-title">{{ p.movieTitle }}</h3>

            <div class="details-list">
              <div class="detail-row">
                <span class="d-label">Quantité :</span>
                <span class="d-val">{{ p.quantity }}</span>
              </div>
              <div class="detail-row">
                <span class="d-label">Montant :</span>
                <span class="d-val price">{{ p.pricePaid.toFixed(2) }} €</span>
              </div>
              <div class="detail-row">
                <span class="d-label">Date :</span>
                <span class="d-val">{{ p.purchaseDate | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <a [routerLink]="['/movie', p.movieId]" class="btn-secondary btn-sm">
              Voir la fiche
            </a>
            <button class="btn-primary btn-sm" (click)="simulateStream(p.movieTitle)">
              Visionner
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .purchases-page {
      max-width: 1080px;
      margin: 0 auto;
      padding: 32px 24px 80px;
    }
    .header-section {
      margin-bottom: 32px;
    }
    .page-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 6px;
    }
    .page-subtitle {
      color: #6b7280;
      font-size: 0.95rem;
    }
    .loading-box {
      text-align: center;
      padding: 60px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #6b7280;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e5e7eb;
      border-top-color: #111827;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .empty-state, .error-state {
      max-width: 440px;
      margin: 40px auto;
      text-align: center;
      padding: 40px 24px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .empty-icon, .error-icon {
      font-size: 2.5rem;
    }
    .empty-state h2, .error-state h2 {
      font-size: 1.15rem;
      color: #111827;
      margin: 0;
    }
    .empty-state p, .error-state p {
      color: #6b7280;
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0;
    }
    .purchases-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .purchase-card {
      padding: 20px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .movie-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 14px;
    }
    .details-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 18px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
    }
    .d-label {
      color: #6b7280;
    }
    .d-val {
      color: #111827;
      font-weight: 500;
    }
    .d-val.price {
      font-weight: 700;
      color: #111827;
    }
    .card-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
      padding-top: 14px;
      border-top: 1px solid #f3f4f6;
    }
    .btn-sm {
      flex: 1;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-primary.btn-sm {
      background: #111827;
      color: #ffffff;
      border: 1px solid #111827;
    }
    .btn-primary.btn-sm:hover {
      background: #1f2937;
    }
    .btn-secondary.btn-sm {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #e5e7eb;
    }
    .btn-secondary.btn-sm:hover {
      background: #e5e7eb;
    }
  `]
})
export class MyPurchasesComponent implements OnInit {
  private purchaseService = inject(PurchaseService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  purchases: Purchase[] = [];
  isLoading = true;
  loadError = false;

  ngOnInit() {
    this.loadPurchases();
  }

  loadPurchases() {
    this.isLoading = true;
    this.loadError = false;
    this.cdr.markForCheck();

    this.purchaseService.getMyPurchases().subscribe({
      next: (data) => {
        this.purchases = this.aggregatePurchases(data || []);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement achats:', err);
        this.loadError = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private aggregatePurchases(items: Purchase[]): Purchase[] {
    const map = new Map<number, Purchase>();
    for (const p of items) {
      const existing = map.get(p.movieId);
      if (existing) {
        existing.quantity += p.quantity;
        existing.pricePaid += p.pricePaid;
        if (p.purchaseDate && (!existing.purchaseDate || new Date(p.purchaseDate) > new Date(existing.purchaseDate))) {
          existing.purchaseDate = p.purchaseDate;
        }
      } else {
        map.set(p.movieId, { ...p });
      }
    }
    return Array.from(map.values());
  }

  simulateStream(movieTitle: string) {
    this.toastService.show(
      `Lancement du film '${movieTitle}'. Bon visionnage !`,
      'info',
      'Lecteur Vidéo'
    );
  }
}
