import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { PurchaseService } from '../../services/purchase.service';
import { MovieService } from '../../services/movie.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Backdrop -->
    <div
      class="cart-backdrop"
      *ngIf="cartService.isCartOpen()"
      (click)="cartService.closeCart()"
    ></div>

    <!-- Tiroir latéral Panier -->
    <aside class="cart-drawer" [class.open]="cartService.isCartOpen()">
      <div class="cart-header">
        <div class="header-title-box">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h2>Panier</h2>
        </div>
        <button class="btn-close" (click)="cartService.closeCart()" aria-label="Fermer">×</button>
      </div>

      <!-- État Panier Vide -->
      <div class="empty-cart" *ngIf="cartService.cartItems().length === 0">
        <div class="empty-cart-icon">🛒</div>
        <h3>Votre panier est vide</h3>
      </div>

      <!-- Liste des Articles du Panier -->
      <div class="cart-body" *ngIf="cartService.cartItems().length > 0">
        <div class="cart-item" *ngFor="let item of cartService.cartItems()">
          <img
            [src]="movieService.getPosterUrl(item.movie.posterPath, item.movie.title)"
            [alt]="item.movie.title"
            class="item-thumb"
          />

          <div class="item-info">
            <h4 class="item-title">{{ item.movie.title }}</h4>
            <div class="item-meta">{{ item.movie.year }} • Stock: {{ item.movie.copies }}</div>
            <div class="item-price">{{ item.movie.price.toFixed(2) }} €</div>

            <div class="item-controls">
              <div class="qty-btn-group">
                <button (click)="cartService.updateQuantity(item.movie.id, -1)" aria-label="Moins">-</button>
                <span>{{ item.quantity }}</span>
                <button
                  (click)="cartService.updateQuantity(item.movie.id, 1)"
                  [disabled]="item.quantity >= item.movie.copies"
                  aria-label="Plus"
                >+</button>
              </div>

              <button class="btn-remove" (click)="cartService.removeFromCart(item.movie.id)">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pied du Panier & Bouton d'Achat -->
      <div class="cart-footer" *ngIf="cartService.cartItems().length > 0">
        <div class="summary-line">
          <span>Articles</span>
          <span>{{ cartService.totalCount() }}</span>
        </div>
        <div class="summary-line total">
          <span>Total</span>
          <span class="total-price">{{ cartService.totalAmount().toFixed(2) }} €</span>
        </div>

        <button
          class="btn-checkout"
          [disabled]="isPurchasing"
          (click)="handleCheckout()"
        >
          <span *ngIf="!isPurchasing">Valider l'achat ({{ cartService.totalAmount().toFixed(2) }} €)</span>
          <span *ngIf="isPurchasing">Finalisation de l'achat...</span>
        </button>
      </div>
    </aside>

    <!-- Modal Célébration Achat Réussi -->
    <div class="modal-backdrop" *ngIf="showSuccessModal">
      <div class="modal-box">
        <div class="modal-icon">✓</div>
        <h2 class="modal-title">Commande Confirmée !</h2>
        <p class="modal-text">
          Votre achat a été validé avec succès et le stock a été mis à jour.
        </p>
        <div class="modal-actions">
          <a routerLink="/my-purchases" class="btn-primary" (click)="showSuccessModal = false">
            Voir mes achats
          </a>
          <button class="btn-secondary" (click)="showSuccessModal = false">
            Fermer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 2000;
    }
    .cart-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 400px;
      background: #ffffff;
      border-left: 1px solid #e5e7eb;
      z-index: 2001;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.25s ease-out;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.08);
    }
    .cart-drawer.open {
      transform: translateX(0);
    }
    .cart-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e5e7eb;
    }
    .header-title-box {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #111827;
    }
    .header-title-box h2 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
    .btn-close {
      font-size: 1.5rem;
      color: #6b7280;
      background: none;
      border: none;
      cursor: pointer;
      line-height: 1;
      padding: 4px;
    }
    .btn-close:hover {
      color: #111827;
    }
    .empty-cart {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
      gap: 12px;
    }
    .empty-cart-icon {
      font-size: 2.8rem;
    }
    .empty-cart h3 {
      color: #374151;
      font-size: 1.05rem;
      font-weight: 600;
      margin: 0;
    }
    .cart-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .cart-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .item-thumb {
      width: 60px;
      height: 85px;
      object-fit: cover;
      border-radius: 4px;
      background: #e5e7eb;
    }
    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .item-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #111827;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin: 0;
    }
    .item-meta {
      font-size: 0.75rem;
      color: #6b7280;
    }
    .item-price {
      font-weight: 700;
      color: #111827;
      font-size: 0.95rem;
    }
    .item-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6px;
    }
    .qty-btn-group {
      display: flex;
      align-items: center;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      overflow: hidden;
    }
    .qty-btn-group button {
      width: 24px;
      height: 24px;
      background: none;
      border: none;
      color: #111827;
      font-weight: 600;
      cursor: pointer;
    }
    .qty-btn-group button:hover:not(:disabled) {
      background: #f3f4f6;
    }
    .qty-btn-group button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .qty-btn-group span {
      width: 24px;
      text-align: center;
      font-size: 0.8rem;
      font-weight: 600;
      color: #111827;
    }
    .btn-remove {
      font-size: 0.75rem;
      color: #dc2626;
      background: transparent;
      border: none;
      padding: 4px 6px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-remove:hover {
      text-decoration: underline;
    }
    .cart-footer {
      padding: 16px 20px;
      background: #ffffff;
      border-top: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      color: #4b5563;
      font-size: 0.85rem;
    }
    .summary-line.total {
      font-size: 1rem;
      font-weight: 700;
      color: #111827;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }
    .total-price {
      color: #111827;
      font-size: 1.15rem;
      font-weight: 700;
    }
    .btn-checkout {
      width: 100%;
      padding: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      background: #111827;
      color: #ffffff;
      border: 1px solid #111827;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-checkout:hover:not(:disabled) {
      background: #1f2937;
    }
    .btn-checkout:disabled {
      background: #9ca3af;
      border-color: #9ca3af;
      cursor: not-allowed;
    }

    /* Modal Confirmation */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-box {
      max-width: 400px;
      width: 100%;
      padding: 28px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    .modal-icon {
      width: 48px;
      height: 48px;
      background: #ecfdf5;
      color: #047857;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
    }
    .modal-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
    .modal-text {
      color: #4b5563;
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0;
    }
    .modal-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      width: 100%;
    }
    .modal-actions .btn-primary {
      flex: 1;
      padding: 8px 12px;
      background: #111827;
      color: #ffffff;
      border: 1px solid #111827;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
    }
    .modal-actions .btn-secondary {
      flex: 1;
      padding: 8px 12px;
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }
  `]
})
export class CartDrawerComponent {
  cartService = inject(CartService);
  private purchaseService = inject(PurchaseService);
  movieService = inject(MovieService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  isPurchasing = false;
  showSuccessModal = false;

  handleCheckout() {
    const items = this.cartService.cartItems();
    if (items.length === 0) return;

    this.isPurchasing = true;
    this.cdr.markForCheck();

    this.purchaseService.checkout(items).subscribe({
      next: (purchases) => {
        this.isPurchasing = false;
        this.cartService.clearCart();
        this.cartService.closeCart();
        this.showSuccessModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isPurchasing = false;
        this.cdr.detectChanges();
        const msg = err.error?.message || "Erreur lors de la validation de l'achat.";
        this.toastService.show(msg, 'error', 'Échec de la commande');
      }
    });
  }
}
