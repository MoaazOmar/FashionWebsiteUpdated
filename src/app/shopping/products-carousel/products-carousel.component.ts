import { Component, OnInit } from '@angular/core';
import { ShoppinglistService } from './../../services/shoppinglist.service';
import { Product } from '../../../interfaces/product.model';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-products-carousel',
  templateUrl: './products-carousel.component.html',
  styleUrls: ['./products-carousel.component.css']
})
export class ProductsCarouselComponent implements OnInit {
  mostLikedProducts: Product[] = [];
  mostRecentProducts: Product[] = [];
  currentLikedIndex = 0;
  currentRecentIndex = 0;
  autoSlideTimer: any;
  isLoading: boolean = false;

  private dataSubscription!: Subscription;
  private loadingSubscription!: Subscription;

  constructor(
    private _shoppinglistService: ShoppinglistService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadingSubscription = this._shoppinglistService.getLoadingState().subscribe(isLoading => {
      this.isLoading = isLoading;
    });

    this.dataSubscription = this._shoppinglistService.getFeaturedData().subscribe(response => {
      if (response) {
        this.updateCarouselProducts(response);
        this.startAutoSlide();
      }
    });

    this.route.queryParams.subscribe(param => {
      this.fetchCarouselProducts(param['gender']);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.autoSlideTimer);
    if (this.dataSubscription) this.dataSubscription.unsubscribe();
    if (this.loadingSubscription) this.loadingSubscription.unsubscribe();
  }

  private updateCarouselProducts(response: any): void {
    this.mostLikedProducts = response.mostLikedProducts.map((product: Product) => ({
      ...product,
      image: product.image.map(img => `https://holy-althea-moaazomar-463f67fb.koyeb.app/images/${img}`),
    }));
    this.mostRecentProducts = response.mostRecentProducts.map((product: Product) => ({
      ...product,
      image: product.image.map(img => `https://holy-althea-moaazomar-463f67fb.koyeb.app/images/${img}`),
    }));
    console.log('Most Liked Products:', this.mostLikedProducts);
    console.log('Most Recent Products:', this.mostRecentProducts);
  }

  fetchCarouselProducts(gender: string): void {
    this._shoppinglistService.getFeaturedCollections(gender || 'all').subscribe();
  }

  startAutoSlide(): void {
    clearInterval(this.autoSlideTimer);
    if (this.mostLikedProducts.length > 0 && this.mostRecentProducts.length > 0) {
      this.autoSlideTimer = setInterval(() => {
        this.nextLiked();
        this.nextRecent();
      }, 5000);
    }
  }

  resetTimer(): void {
    clearInterval(this.autoSlideTimer);
    this.startAutoSlide();
  }

  prevLiked(): void {
    this.currentLikedIndex =
      this.currentLikedIndex === 0 ? this.mostLikedProducts.length - 1 : this.currentLikedIndex - 1;
    this.resetTimer();
  }

  nextLiked(): void {
    this.currentLikedIndex =
      this.currentLikedIndex === this.mostLikedProducts.length - 1 ? 0 : this.currentLikedIndex + 1;
    this.resetTimer();
  }

  prevRecent(): void {
    this.currentRecentIndex =
      this.currentRecentIndex === 0 ? this.mostRecentProducts.length - 1 : this.currentRecentIndex - 1;
    this.resetTimer();
  }

  nextRecent(): void {
    this.currentRecentIndex =
      this.currentRecentIndex === this.mostRecentProducts.length - 1 ? 0 : this.currentRecentIndex + 1;
    this.resetTimer();
  }

  goToLiked(index: number): void {
    this.currentLikedIndex = index;
    this.resetTimer();
  }

  goToRecent(index: number): void {
    this.currentRecentIndex = index;
    this.resetTimer();
  }
}