import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CartItem } from '../../interfaces/cart.model';
import { NotificationCartService } from './notification-cart.service';
import { Router } from '@angular/router';
import { AuthService } from './auth.service'; // Import AuthService

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'https://holy-althea-moaazomar-463f67fb.koyeb.app/cart';
  private currentCartItems = new BehaviorSubject<CartItem[]>([]);
  currentCartItems$ = this.currentCartItems.asObservable();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationCartService,
    private router: Router,
    private authService: AuthService // Inject AuthService
  ) { }

  preserveCartItems(items: CartItem[]): void {
    this.currentCartItems.next(items);
  }

  addToCart(cartItem: CartItem): Observable<any> {
    if (!this.authService.isLoggedIn()) {
      this.notificationService.showNotification("Please log in to add items to cart", 'error');
      this.router.navigate(['/login']);
      return new Observable(observer => observer.error('User not logged in')); // Return an error observable
    }

    const currentItems = this.currentCartItems.getValue();
    const existingCartItem = currentItems.find(item => item.productID === cartItem.productID && item.color === cartItem.color);
    
    if (existingCartItem) {
      const newAmount = existingCartItem.amount + cartItem.amount;
      return this.updateCartItem(existingCartItem._id, newAmount).pipe(
        tap(() => this.getCartItems().subscribe())
      );
    } else {
      return this.http.post(`${this.apiUrl}/`, cartItem, { withCredentials: true }).pipe(
        tap((response) => {
          console.log('addToCart response:', response);
          this.getCartItems().subscribe();
          this.notificationService.showNotification("Item added to cart", 'success');
        }),
        catchError((error) => {
          console.error('Error adding to cart:', error);
          if (error.status === 401) {
            this.notificationService.showNotification("Session expired, please log in again", 'error');
            this.authService.logout(); 
          } else {
            this.notificationService.showNotification("Failed to add item to cart", 'error');
          }
          throw error;
        })
      );
    }
  }

  getCartItems(): Observable<CartItem[]> {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return new Observable(observer => observer.error('User not logged in'));
    }
    console.log('Fetching cart items with token:', this.authService.getToken()); // Debug
    return this.http.get<any>(`${this.apiUrl}/`).pipe(
      map(response => response.items),
      tap(items => this.currentCartItems.next(items)),
      catchError((error) => {
        console.error('Error fetching cart items:', error);
        if (error.status === 401) {
          this.authService.logout();
        }
        throw error;
      })
    );
  }
  
  
  updateCartItem(cartId: any, amount: number): Observable<any> {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return new Observable(observer => observer.error('User not logged in'));
    }

    return this.http.post(`${this.apiUrl}/save`, { cartId, amount }, { withCredentials: true }).pipe(
      tap(() => {
        this.getCartItems().subscribe();
        this.notificationService.showNotification("Cart item updated", 'updated');
      }),
      catchError((error) => {
        if (error.status === 401) {
          this.authService.logout();
        }
        throw error;
      })
    );
  }

  deleteCartItem(cartId: any): Observable<any> {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return new Observable(observer => observer.error('User not logged in'));
    }

    return this.http.post(`${this.apiUrl}/delete`, { cartId }, { withCredentials: true }).pipe(
      tap(() => {
        this.getCartItems().subscribe();
        this.notificationService.showNotification("Item removed from cart", 'delete');
      }),
      catchError((error) => {
        if (error.status === 401) {
          this.authService.logout();
        }
        throw error;
      })
    );
  }

  clearCartItems(): Observable<any> {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return new Observable(observer => observer.error('User not logged in'));
    }

    return this.http.post(`${this.apiUrl}/clear`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.currentCartItems.next([]);
        this.notificationService.showNotification("Cart cleared", 'info');
      }),
      catchError((error) => {
        if (error.status === 401) {
          this.authService.logout();
        }
        throw error;
      })
    );
  }
}