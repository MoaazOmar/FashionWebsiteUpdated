import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShoppinglistService } from '../../services/shoppinglist.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../../interfaces/product.model';
import { Set } from '../../../interfaces/distinctAndCount.model';
import { CartItem } from '../../../interfaces/cart.model';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  animations: [
    trigger('listAnimation', [
      state('in', style({ opacity: 1, transform: 'translateX(0)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateX(-100%)' }),
        animate('300ms ease-in')
      ]),
      transition('* => void', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class ProductsComponent implements OnInit, OnDestroy {
  allProducts: Product[] = [];
  currentPage = 1;
  totalPages: number[] = [];
  productsPerPage = 5;
  searchTerm = '';
  selectedSort = 'newest';
  selectedColor = '';
  colors: string[] = [];
  uniqueCategories: Set[] = [];
  selectedCategory = '';
  DisplayingfullProductsNumber = 0;
  uniqueColors: Set[] = [];
  isDropdownOpen = false;
  isColorDropdownOpen = false;
  isLoading = false;

  private dataSubscription!: Subscription;
  private loadingSubscription!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ShoppinglistService,
    private _CartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadingSubscription = this.productService.getLoadingState().subscribe(isLoading => {
      this.isLoading = isLoading;
    });

    this.dataSubscription = this.productService.getMainData().subscribe(response => {
      if (response) {
        this.updateProducts(response);
      }
    });

    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
      this.productsPerPage = +params['limit'] || 5;
      this.selectedSort = params['sort'] || 'newest';
      this.searchTerm = params['search'] || '';
      this.selectedColor = params['color'] || '';
      this.selectedCategory = params['category'] || '';
      this.loadProducts(params['gender']);
    });
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) this.dataSubscription.unsubscribe();
    if (this.loadingSubscription) this.loadingSubscription.unsubscribe();
  }

  private updateProducts(response: any): void {
    this.allProducts = response.products.map((product: Product) => ({
      ...product,
      image: product.image.map(img => `https://holy-althea-moaazomar-463f67fb.koyeb.app/images/${img}`),
      amount: 1,
      selectedColor: product.colors[0],
    }));

    this.totalPages = Array.from({ length: response.totalPages }, (_, i) => i + 1);
    this.currentPage = response.currentPage || 1;
    this.uniqueCategories = response.categoriesWithCounts || [];
    this.uniqueColors = response.colorsWithCounts || [];
    this.DisplayingfullProductsNumber = this.uniqueCategories.reduce((total, category) => total + (category?.count || 0), 0);
    this.totalPages = response.totalPages > 0 
    ? Array.from({ length: response.totalPages }, (_, i) => i + 1)
    : [];

    // setTimeout(() => {
    //   this.allProducts.forEach((product, index) => {
    //     setTimeout(() => product.visible = true, index * 150);
    //   });
    // }, 300);
  }

  private loadProducts(gender?: string): void {
    const params = {
      gender: gender || 'all', // Dynamic gender handling
      page: this.currentPage,
      limit: this.productsPerPage,
      sort: this.selectedSort,
      search: this.searchTerm,
      color: this.selectedColor,
      category: this.selectedCategory
    };
    this.productService.getMainProducts(params).subscribe();
  }

  private updateUrlParams(): void {
    const queryParams = {
      gender: this.route.snapshot.queryParams['gender'] || 'all',
      page: this.currentPage,
      limit: this.productsPerPage,
      sort: this.selectedSort,
      search: this.searchTerm || null,
      color: this.selectedColor || null,
      category: this.selectedCategory || null,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.cleanParams(queryParams),
      queryParamsHandling: 'merge'
    });
  }

  private cleanParams(params: any): any {
    const cleaned = { ...params };
    Object.keys(cleaned).forEach(key => {
      if (!cleaned[key] || cleaned[key] === 'all') cleaned[key] = null;
    });
    return cleaned;
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.updateUrlParams();
    this.loadProducts(this.route.snapshot.queryParams['gender']);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.updateUrlParams();
    this.loadProducts(this.route.snapshot.queryParams['gender']);
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.updateUrlParams();
    this.loadProducts(this.route.snapshot.queryParams['gender']);
  }

  onColorChange(): void {
    this.currentPage = 1;
    this.updateUrlParams();
    this.loadProducts(this.route.snapshot.queryParams['gender']);
  }

  selectColor(color: string): void {
    this.selectedColor = color.toLowerCase();
    this.onColorChange();
  }

  pickColor(product: Product, color: string): void {
    product.selectedColor = color;
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.updateUrlParams();
    this.loadProducts(this.route.snapshot.queryParams['gender']);
  }

  toggleColorDropdown(): void {
    this.isColorDropdownOpen = !this.isColorDropdownOpen;
  }

  getSelectedColorLabel(): string {
    if (!this.selectedColor) return `All Colors (${this.DisplayingfullProductsNumber})`;
    const color = this.uniqueColors.find(c => c.name.toLowerCase() === this.selectedColor);
    return color ? `${color.name} (${color.count})` : `All Colors (${this.DisplayingfullProductsNumber})`;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages.length) {
      this.currentPage = page;
      this.updateUrlParams();
      this.loadProducts(this.route.snapshot.queryParams['gender']);
    }
  }

  activeLink(page: number): void {
    if (this.currentPage !== page) this.goToPage(page);
  }

  backBtn(): void {
    if (this.currentPage > 1) this.goToPage(this.currentPage - 1);
  }

  nextBtn(): void {
    if (this.currentPage < this.totalPages.length) this.goToPage(this.currentPage + 1);
  }

  updateProductsPerPage(): void {
    this.currentPage = 1;
    this.updateUrlParams();
    this.loadProducts(this.route.snapshot.queryParams['gender']);
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.isDropdownOpen = false;
    this.onCategoryChange();
  }

  getSelectedCategoryLabel(): string {
    if (!this.selectedCategory) return `All Categories (${this.DisplayingfullProductsNumber})`;
    const category = this.uniqueCategories.find(c => c.name === this.selectedCategory);
    return category ? `${category.name} (${category.count})` : `All Categories (${this.DisplayingfullProductsNumber})`;
  }

  addToCart(product: Product): void {
    const cartItem: CartItem = {
      amount: product.amount || 1,
      name: product.name,
      price: product.price,
      image: product.image[0],
      productID: product._id,
      color: product.selectedColor || product.colors[0]
    };

    this._CartService.addToCart(cartItem).subscribe({
      next: (response) => console.log('Product added to cart:', response),
      error: (err) => console.error('Error adding product to cart:', err)
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedSort = 'newest';
    this.selectedColor = '';
    this.selectedCategory = '';
    this.currentPage = 1;
    this.updateUrlParams();
    this.loadProducts(this.route.snapshot.queryParams['gender']);
  }
}