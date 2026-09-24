import { Injectable, computed, signal } from '@angular/core';
import { CartItem, Movie } from '../models/movie.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly STORAGE_KEY = 'cinestore_cart';

  cartItems = signal<CartItem[]>(this.loadCart());
  isCartOpen = signal<boolean>(false);

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

  addToCart(movie: Movie, quantity = 1) {
    this.cartItems.update((current) => {
      const existing = current.find((item) => item.movie.id === movie.id);
      let updated: CartItem[];
      if (existing) {
        updated = current.map((item) =>
          item.movie.id === movie.id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      } else {
        updated = [...current, { movie, quantity }];
      }
      this.saveCart(updated);
      return updated;
    });
  }

  updateQuantity(movieId: number, delta: number) {
    this.cartItems.update((current) => {
      const updated = current
        .map((item) => {
          if (item.movie.id === movieId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);

      this.saveCart(updated);
      return updated;
    });
  }

  removeFromCart(movieId: number) {
    this.cartItems.update((current) => {
      const updated = current.filter((item) => item.movie.id !== movieId);
      this.saveCart(updated);
      return updated;
    });
  }

  clearCart() {
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
