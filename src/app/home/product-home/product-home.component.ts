import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HomeProductsService } from '../../services/Homeproducts.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../../interfaces/product.model';
import { CartItem } from '../../../interfaces/cart.model';

@Component({
  selector: 'app-product-home',
  templateUrl: './product-home.component.html',
  styleUrls: ['./product-home.component.css'],
})
export class ProductHomeComponent implements OnInit {
  products: Product[] = [];
  selectedCategory: string = '';
  limit: number = 5;
  skip: number = 0;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productsService: HomeProductsService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.route.queryParams.subscribe(params => {
      const gender = params['gender'] || '';
      if (gender !== this.selectedCategory) {
        this.selectedCategory = gender;
        this.loadProducts(this.selectedCategory, true);
      }
    });
  }

  loadProducts(category: string = this.selectedCategory, reset: boolean = false) {
    this.isLoading = true;
    if (reset) {
      this.products = [];
      this.skip = 0;
    }
    console.log('Loading products - Category:', category, 'Limit:', this.limit, 'Skip:', this.skip);
    this.productsService.getProducts(category, this.limit, this.skip).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.products = [
            ...this.products,
            ...response.map((product) => ({
              ...product,
              image: product.image.map(img => `https://holy-althea-moaazomar-463f67fb.koyeb.app/images/${img}`),
              amount: 1,
              selectedColor: product.colors?.[0] || ''
            })),
          ];
        }
      },
      error: (err) => {
        console.error('Error fetching products:', err.status, err.error);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  selectColor(product: Product, color: string) {
    product.selectedColor = color;
  }

  selectCategory(category: string) {
    this.selectedCategory = category === 'all' ? '' : category;
    this.loadProducts(this.selectedCategory, true);
  }

  loadMore() {
    this.skip += this.limit;
    this.loadProducts(this.selectedCategory);
  }

  applyFilter(event: Event): void {
    event.preventDefault();
    this.router.navigate([], {
      queryParams: { gender: this.selectedCategory },
      queryParamsHandling: 'merge',
    });
    this.resetProducts();
  }

  resetProducts(): void {
    this.products = [];
    this.skip = 0;
    this.loadProducts(this.selectedCategory, true);
  }

  addToCart(product: Product & { amount?: number }) {
    const cartItem: CartItem = {
      productID: product._id,
      name: product.name,
      price: product.price,
      image: product.image[0],
      amount: product.amount || 1,
      color: product.selectedColor || product.colors[0]
    };

    this.cartService.addToCart(cartItem).subscribe({
      next: (response) => {
        console.log('Product added to cart:', response);
        product.amount = 1;
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
      },
    });
  }
}