import { Component, OnInit } from '@angular/core';
import { DashboardStats } from '../../../interfaces/dashboard.model';
import { Product } from '../../../interfaces/product.model';
import { Order } from '../../../interfaces/order.model';
import { AdminService } from '../../services/admin.service';
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  recentOrders: Order[] = [];
  topProducts: Product[] = [];
  isLoading = true;
  error: string | null = null;
  constructor(private dashboardService: AdminService) { }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadRecentOrders();
    this.loadTopSellingProducts();
  }
  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    // Fetch dashboard stats
    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        console.log('Received stats:', stats);
        this.stats = stats;

      },
      error: (err) => {
        this.error = 'Failed to load dashboard stats. Please try again later.';
        console.error(err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  loadRecentOrders(): void {
    this.dashboardService.getRecentOrders().subscribe({
      next: (orders) => {
        this.recentOrders = orders.slice(0, 5);
      },
      error: (err) => {
        console.error('Detailed error:', err);
        this.error = err.error?.message || 'Failed to load recent orders';
        if (err.error?.error) {
          console.error('Server error details:', err.error.error);
        }
      }
    });
  } loadTopSellingProducts(): void {
    this.dashboardService.getTopSellingProducts().subscribe({
      next: (products) => {
        console.log('Top Selling Products Response:', products);
        this.topProducts = products;
        console.log('Assigned topProducts:', this.topProducts);

      },
      error: (err) => {
        console.error('Error fetching top selling products:', err);
        this.error = 'Failed to load top selling products. Please try again later.';
      },
      complete: () => {
        console.log('Top selling products fetch complete');
        this.isLoading = false;
      }
    });
  }

  retry(): void {
    this.loadDashboardData();
    this.loadRecentOrders();
    this.loadTopSellingProducts();

  }
}
