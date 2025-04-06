import { Component, OnInit, OnDestroy, Renderer2, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../interfaces/product.model';
import { ShoppinglistService } from '../services/shoppinglist.service';
import { CartService } from '../services/cart.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-shopping',
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.css'],
  animations: [
    trigger('slideAnimation', [
      state('inactive', style({ opacity: 0, transform: 'scale(1.1)' })),
      state('active', style({ opacity: 1, transform: 'scale(1)' })),
      state('previous', style({ opacity: 0, transform: 'scale(0.9)' })),
      transition('inactive => active', animate('1.2s cubic-bezier(0.42, 0, 0.58, 1)')),
      transition('active => previous', animate('1.2s cubic-bezier(0.42, 0, 0.58, 1)')),
      transition('previous => inactive', animate('0s')),
      transition('active => inactive', animate('1.2s cubic-bezier(0.42, 0, 0.58, 1)'))
    ])
  ]
})
export class ShoppingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('carousel', { static: false }) carousel!: ElementRef;
  @ViewChild('progressBar', { static: false }) progressBar!: ElementRef;

  intervalTime = 8000;
  currentSlideIndex = 0;
  previousSlideIndex = -1;
  interval: any;
  progressInterval: any;

  carouselProducts: Product[] = [];
  isLoading: boolean = false;

  private gender: string | undefined;
  private dataSubscription!: Subscription;
  private loadingSubscription!: Subscription;

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ShoppinglistService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadingSubscription = this.productService.getLoadingState().subscribe(isLoading => {
      this.isLoading = isLoading;
    });

    this.dataSubscription = this.productService.getFeaturedData().subscribe(response => {
      if (response) {
        this.updateCarouselProducts(response);
      }
    });

    this.route.queryParams.subscribe(params => {
      this.gender = params['gender'] || undefined; // Allow undefined to fetch all genders
      this.loadFeaturedCollections();
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    clearInterval(this.interval);
    clearInterval(this.progressInterval);
    if (this.dataSubscription) this.dataSubscription.unsubscribe();
    if (this.loadingSubscription) this.loadingSubscription.unsubscribe();
  }

  private loadFeaturedCollections(): void {
    this.productService.getFeaturedCollections(this.gender || 'all').subscribe();
  }

  private updateCarouselProducts(response: any): void {
    this.carouselProducts = response.carouselProducts.map((product: Product) => ({
      ...product,
      image: product.image.map(img => `https://holy-althea-moaazomar-463f67fb.koyeb.app/images/${img}`),
      description: product.description || 'Discover this stylish item from our collection.',
      comments: product.comments || []
    }));

    console.log('carouselProducts:', this.carouselProducts);

    if (this.carouselProducts.length > 0) {
      setTimeout(() => this.startAutoSlide(), 0);
      this.setupTouchEvents();
    }
  }

  startAutoSlide(): void {
    if (!this.carousel || !this.progressBar || this.carouselProducts.length === 0) return;
    clearInterval(this.interval);
    this.interval = setInterval(() => this.nextSlide(), this.intervalTime);
    this.startProgressBar();
  }

  goToSlide(index: number): void {
    if (index === this.currentSlideIndex) return;
    this.previousSlideIndex = this.currentSlideIndex;
    this.currentSlideIndex = index % this.carouselProducts.length;
    if (this.currentSlideIndex < 0) this.currentSlideIndex = this.carouselProducts.length - 1;
    setTimeout(() => this.previousSlideIndex = -1, 1200);
    this.resetProgressBar();
  }

  nextSlide(): void {
    this.goToSlide(this.currentSlideIndex + 1);
  }

  prevSlide(): void {
    this.goToSlide(this.currentSlideIndex - 1);
  }

  startProgressBar(): void {
    const progressBarEl = this.progressBar.nativeElement;
    this.renderer.setStyle(progressBarEl, 'width', '0%');
    clearInterval(this.progressInterval);

    let width = 0;
    const increment = 100 / (this.intervalTime / 20);

    this.progressInterval = setInterval(() => {
      if (width >= 100) {
        width = 0;
      } else {
        width += increment;
        this.renderer.setStyle(progressBarEl, 'width', `${width}%`);
      }
    }, 20);
  }

  resetProgressBar(): void {
    clearInterval(this.progressInterval);
    this.renderer.setStyle(this.progressBar.nativeElement, 'width', '0%');
    this.startProgressBar();
    clearInterval(this.interval);
    this.startAutoSlide();
  }

  setupTouchEvents(): void {
    if (!this.carousel) return;
    let touchStartX = 0;
    let touchEndX = 0;
    const carouselEl = this.carousel.nativeElement;

    this.renderer.listen(carouselEl, 'touchstart', (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    this.renderer.listen(carouselEl, 'touchend', (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
    });
  }

  handleSwipe(startX: number, endX: number): void {
    const swipeThreshold = 50;
    if (endX < startX - swipeThreshold) this.nextSlide();
    if (endX > startX + swipeThreshold) this.prevSlide();
  }

  addToCart(product: Product): void {
    const cartItem = {
      productID: product._id,
      name: product.name,
      price: product.price,
      amount: 1,
      image: product.image[0],
      color: product.colors?.[0] || '',
      userID: 'currentUserId'
    };

    this.cartService.addToCart(cartItem).subscribe({
      next: () => console.log(`${product.name} added to cart`),
      error: (err) => console.error('Error adding to cart:', err)
    });
  }

  getAverageRating(product: Product): number {
    const ratedComments = product.comments.filter(comment => comment.rating !== null);
    if (ratedComments.length === 0) return 0;
    const totalRating = ratedComments.reduce((sum, comment) => sum + (comment.rating || 0), 0);
    return totalRating / ratedComments.length;
  }

  getTotalRatedComments(product: Product): number {
    return product.comments.filter(comment => comment.rating !== null).length;
  }

  getStarClass(product: Product, i: number): string {
    const average = this.getAverageRating(product);
    if (i <= average) return 'fas fa-star text-yellow-400';
    if (i - 0.5 <= average) return 'fas fa-star-half-alt text-yellow-400';
    return 'far fa-star text-yellow-400';
  }

  goToProducts(): void {
    this.router.navigate(['/products'], { queryParams: { gender: this.gender } });
  }
}