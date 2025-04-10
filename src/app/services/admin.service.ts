import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Order } from '../../interfaces/order.model';
import { DashboardStats } from '../../interfaces/dashboard.model';
import { Product } from '../../interfaces/product.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'https://holy-althea-moaazomar-463f67fb.koyeb.app/admin';

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard-stats`, { withCredentials: true });
  }

  getRecentOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`, { 
        withCredentials: true 
    });
}
  getTopSellingProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/top-selling-products`, { withCredentials: true });
  }

  addProduct(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, formData, { withCredentials: true });
  }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/productList`, { withCredentials: true });
  }
  
  updateProduct(productId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/productList/update`, formData, { withCredentials: true });
  }

  // New method to update the status of an order
  updateOrderStatus(orderId: string, newStatus: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/update`, { orderId, status: newStatus }, { withCredentials: true });
  }

  // New method to update product stock
  updateProductStock(productID: string, amount: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/productList/updateStock`,
      { productID, amount },
      { withCredentials: true }
    );
  }
}
