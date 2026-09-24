import { Injectable, computed, signal, inject } from '@angular/core';
import { CartItem, Movie } from '../models/movie.model';
import { MovieService } from './movie.service';
import { ToastService } from './toast.service';

interface PendingRelease {
  quantity: number;
  timer: ReturnType<typeof setTimeout>;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly STORAGE_KEY = 'cinestore_cart';
  private movieService = inject(MovieService);
  private toastService = inject(ToastService);

  cartItems = signal<CartItem[]>(this.loadCart());
  isCartOpen = signal<boolean>(false);

  // Registre des remises en stock temporisées (5 secondes de délai de grâce)
  private pendingReleases = new Map<number, PendingRelease>();

  totalCount = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.quantity, 0);
  });

  totalAmount = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.movie.price * item.quantity, 0);
  });

  private loadCart(): CartItem[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveCart(items: CartItem[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Erreur sauvegarde panier:', e);
    }
  }

  /**
   * Ajout immédiat au panier avec réservation temps réel du stock auprès du backend.
   * La mise à jour est diffusée à tous les utilisateurs sans rechargement de page.
   */
  addToCart(movie: Movie, quantity = 1) {
    if (quantity <= 0) return;

    // 1. Vérification si une libération de stock était en attente pour ce film
    const pending = this.pendingReleases.get(movie.id);
    let netToReserve = quantity;

    if (pending) {
      if (pending.quantity >= quantity) {
        // La quantité en attente couvre l'ajout : on compense simplement
        pending.quantity -= quantity;
        netToReserve = 0;
        if (pending.quantity === 0) {
          clearTimeout(pending.timer);
          this.pendingReleases.delete(movie.id);
        }
      } else {
        // La quantité en attente couvre une partie : on réserve le surplus
        netToReserve = quantity - pending.quantity;
        clearTimeout(pending.timer);
        this.pendingReleases.delete(movie.id);
      }
    }

    // 2. Appel serveur si un surplus doit être réservé
    if (netToReserve > 0) {
      this.movieService.reserveCopies(movie.id, netToReserve).subscribe({
        next: (updatedMovie) => {
          // Mise à jour locale immédiate de l'affichage
          this.applyAddToCartLocal(updatedMovie, quantity);
        },
        error: (err) => {
          const msg = err.error?.message || 'Stock insuffisant pour ajouter ce film.';
          this.toastService.show(msg, 'error', 'Stock indisponible');
        },
      });
    } else {
      // Stock déjà pré-réservé dans le délai de 5s
      this.applyAddToCartLocal(movie, quantity);
    }
  }

  private applyAddToCartLocal(movie: Movie, quantity: number) {
    this.cartItems.update((current) => {
      const existing = current.find((item) => item.movie.id === movie.id);
      let updated: CartItem[];
      if (existing) {
        updated = current.map((item) =>
          item.movie.id === movie.id
            ? { ...item, quantity: item.quantity + quantity, movie: { ...item.movie, copies: movie.copies } }
            : item,
        );
      } else {
        updated = [...current, { movie, quantity }];
      }
      this.saveCart(updated);
      return updated;
    });
  }

  /**
   * Modification de quantité :
   * - Augmentation : réservation immédiate.
   * - Diminution : délai d'attente de 5 secondes avant restitution effective du stock.
   */
  updateQuantity(movieId: number, delta: number) {
    if (delta === 0) return;

    if (delta > 0) {
      // Augmentation : réservation immédiate
      const item = this.cartItems().find((i) => i.movie.id === movieId);
      if (item) {
        this.addToCart(item.movie, delta);
      }
    } else {
      // Diminution : mise à jour UI immédiate + temporisation de 5 secondes avant libération
      const releaseQty = Math.abs(delta);
      this.cartItems.update((current) => {
        const updated = current
          .map((item) => {
            if (item.movie.id === movieId) {
              const newQty = item.quantity - releaseQty;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter((item): item is CartItem => item !== null);

        this.saveCart(updated);
        return updated;
      });

      this.scheduleRelease(movieId, releaseQty);
    }
  }

  /**
   * Suppression d'un film du panier :
   * Mise à jour UI immédiate + attente de 5 secondes avant remise en stock effective.
   */
  removeFromCart(movieId: number) {
    const item = this.cartItems().find((i) => i.movie.id === movieId);
    if (!item) return;

    const qtyToRelease = item.quantity;

    this.cartItems.update((current) => {
      const updated = current.filter((i) => i.movie.id !== movieId);
      this.saveCart(updated);
      return updated;
    });

    this.scheduleRelease(movieId, qtyToRelease);
  }

  /**
   * Planifie la libération du stock avec un délai de grâce de 5 secondes.
   * Si l'utilisateur ré-augmente ou modifie pendant ces 5s, le timer est réinitialisé.
   */
  private scheduleRelease(movieId: number, quantity: number) {
    const existing = this.pendingReleases.get(movieId);
    let totalToRelease = quantity;

    if (existing) {
      clearTimeout(existing.timer);
      totalToRelease += existing.quantity;
    }

    const timer = setTimeout(() => {
      this.executeReleaseStock(movieId, totalToRelease);
      this.pendingReleases.delete(movieId);
    }, 5000); // 5 secondes

    this.pendingReleases.set(movieId, { quantity: totalToRelease, timer });
  }

  private executeReleaseStock(movieId: number, quantity: number) {
    if (quantity <= 0) return;
    this.movieService.releaseCopies(movieId, quantity).subscribe({
      next: () => {
        // Le backend diffuse l'événement SSE STOCK_CHANGED à tous les clients
      },
      error: (err) => {
        console.error(`Erreur remise en stock film #${movieId}:`, err);
      },
    });
  }

  cancelAllPendingReleases() {
    this.pendingReleases.forEach((pending) => {
      clearTimeout(pending.timer);
    });
    this.pendingReleases.clear();
  }

  clearCart() {
    this.cancelAllPendingReleases();
    this.cartItems.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  toggleCart() {
    this.isCartOpen.update((open) => !open);
  }

  openCart() {
    this.isCartOpen.set(true);
  }

  closeCart() {
    this.isCartOpen.set(false);
  }

  updateMovieRealtime(movieId: number, price?: number, copies?: number) {
    this.cartItems.update((current) => {
      let changed = false;
      const updated = current.map((item) => {
        if (item.movie.id === movieId) {
          changed = true;
          return {
            ...item,
            movie: {
              ...item.movie,
              price: price !== undefined ? price : item.movie.price,
              copies: copies !== undefined ? copies : item.movie.copies,
            },
          };
        }
        return item;
      });
      if (changed) {
        this.saveCart(updated);
        return updated;
      }
      return current;
    });
  }
}
