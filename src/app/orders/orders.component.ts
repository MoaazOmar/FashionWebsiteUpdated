import { Component, OnInit } from '@angular/core';
import { OrderService } from '../services/order.service';
import { jsPDF } from 'jspdf';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'; // Import DomSanitizer

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  selectedOrder: any = null;
  isLoggedIn: boolean = false;

  // SVG illustrations as constants
  private readonly noOrdersSvgString = `
    <svg class="w-64 h-64 mx-auto" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path d="M100,20 L140,70 L60,70 Z" fill="none" stroke="#5D5CDE" stroke-width="3"/>
      <line x1="100" y1="20" x2="100" y2="5" stroke="#9CA3AF" stroke-width="2"/>
      <circle cx="100" cy="5" r="3" fill="#9CA3AF"/>
      <path d="M70,70 L60,140 L140,140 L130,70" fill="none" stroke="#5D5CDE" stroke-width="3"/>
      <path d="M85,75 C85,95 115,95 115,75" fill="none" stroke="#5D5CDE" stroke-width="2"/>
      <circle cx="90" cy="110" r="2" fill="#4B5563"/>
      <circle cx="110" cy="110" r="2" fill="#4B5563"/>
      <path d="M90,125 Q100,120 110,125" fill="none" stroke="#4B5563" stroke-width="2"/>
      <rect x="60" y="150" width="80" height="40" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-dasharray="4"/>
      <line x1="60" y1="150" x2="140" y2="190" stroke="#9CA3AF" stroke-width="1" stroke-dasharray="4"/>
      <line x1="60" y1="190" x2="140" y2="150" stroke="#9CA3AF" stroke-width="1" stroke-dasharray="4"/>
    </svg>
  `;

  private readonly notLoggedInSvgString = `
    <svg class="w-64 h-64 mx-auto" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="70" y="80" width="60" height="70" rx="5" fill="none" stroke="#5D5CDE" stroke-width="3"/>
      <path d="M70,100 C70,70 130,70 130,100" fill="none" stroke="#5D5CDE" stroke-width="3"/>
      <circle cx="100" cy="115" r="20" fill="none" stroke="#6B7280" stroke-width="3"/>
      <rect x="90" y="110" width="20" height="20" rx="2" fill="#6B7280"/>
      <circle cx="100" cy="115" r="5" fill="white"/>
      <line x1="100" y1="115" x2="100" y2="120" stroke="white" stroke-width="2"/>
      <circle cx="85" cy="150" r="2" fill="#4B5563"/>
      <circle cx="115" cy="150" r="2" fill="#4B5563"/>
      <path d="M95,160 Q100,165 105,160" fill="none" stroke="#4B5563" stroke-width="2"/>
    </svg>
  `;

  // Safe HTML properties for SVGs
  noOrdersSvg: SafeHtml;
  notLoggedInSvg: SafeHtml;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer // Inject DomSanitizer
  ) {
    // Sanitize SVGs to make them safe for [innerHTML]
    this.noOrdersSvg = this.sanitizer.bypassSecurityTrustHtml(this.noOrdersSvgString);
    this.notLoggedInSvg = this.sanitizer.bypassSecurityTrustHtml(this.notLoggedInSvgString);
  }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.isLoggedIn = this.authService.isLoggedIn();
      if (this.isLoggedIn) {
        this.fetchOrders();
      }
    });
  }

  fetchOrders() {
    this.orderService.getOrderToDisplay().subscribe({
      next: (response: any) => {
        console.log('Order response:', response);
        if (response && response.orders) {
          this.orders = response.orders;
          console.log('Orders set:', this.orders);
        } else {
          console.warn('No orders found.');
        }
      },
      error: (err) => {
        console.error('Error fetching orders:', err);
      }
    });
  }

  navigateToShopping() {
    this.router.navigate(['/shopping']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  downloadPDF(order: any) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(255, 0, 0);
    doc.text(`Order #${order._id}`, 10, 10);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    let yPosition = 20;
    doc.text(`Date: ${new Date(order.timestamp).toLocaleDateString()}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Customer: ${order.customerName}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Address: ${order.address}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Total: $${order.totalPrice}`, 10, yPosition);
    
    yPosition += 5;

    doc.setFontSize(14);
    doc.text('Items:', 10, yPosition);
    yPosition += 10;

    const startY = yPosition;
    const itemWidth = 180;
    const itemHeight = 10;

    doc.setFillColor(200, 200, 200);
    doc.rect(10, yPosition, itemWidth, itemHeight, 'F');
    doc.setTextColor(0);
    doc.text('Item', 12, yPosition + 7);
    doc.text('Quantity', 100, yPosition + 7);
    doc.text('Price', 150, yPosition + 7);
    yPosition += itemHeight;

    order.items.forEach((item: any) => {
      doc.setFillColor(255, 255, 255);
      doc.rect(10, yPosition, itemWidth, itemHeight, 'F');
      doc.setTextColor(0);
      doc.text(item.name, 12, yPosition + 7);
      doc.text(item.amount.toString(), 100, yPosition + 7);
      doc.text(`$${item.price}`, 150, yPosition + 7);
      yPosition += itemHeight;
    });

    yPosition += 10;
    doc.setFontSize(12);
    doc.text('Thank you for your order!', 10, yPosition);

    doc.save(`order-${order._id}.pdf`);
  }
}