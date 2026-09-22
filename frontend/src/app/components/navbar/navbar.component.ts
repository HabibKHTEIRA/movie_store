import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar-header">
      <div class="navbar-container">
        <!-- Logo MS & Nom Movie Store -->
        <a routerLink="/" class="brand-logo">
          <span class="logo-badge">MS</span>
          <span class="brand-name">Movie Store</span>
        </a>

        <!-- Liens & Actions -->
        <nav class="nav-actions">
          <a routerLink="/my-purchases" routerLinkActive="active" class="nav-link">
            Mes Achats
          </a>

          <button class="cart-button" (click)="cartService.toggleCart()" aria-label="Ouvrir le panier">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span class="cart-label">Panier</span>
            <span class="cart-count" *ngIf="cartService.totalCount() > 0">
              ({{ cartService.totalCount() }})
            </span>
          </button>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .navbar-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .navbar-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      background: #111827;
      color: #ffffff;
      font-weight: 800;
      font-size: 1.1rem;
      border-radius: var(--radius-sm);
      letter-spacing: -0.5px;
    }
    .brand-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.3px;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .nav-link {
      color: #4b5563;
      font-size: 0.92rem;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: var(--radius-md);
      transition: background 0.15s, color 0.15s;
    }
    .nav-link:hover, .nav-link.active {
      color: #111827;
      background: #f3f4f6;
    }
    .cart-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #111827;
      color: #ffffff;
      border-radius: var(--radius-md);
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .cart-button:hover {
      background: #1f2937;
    }
    .cart-label {
      font-weight: 600;
    }
    .cart-count {
      font-size: 0.85rem;
      font-weight: 700;
    }
  `]
})
export class NavbarComponent {
  cartService = inject(CartService);
}
