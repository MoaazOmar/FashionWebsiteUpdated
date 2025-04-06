import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { ShoppinglistService } from '../../services/shoppinglist.service';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../../interfaces/product.model';
import { Subscription } from 'rxjs';
declare const Swiper: any;

@Component({
  selector: 'app-winter-section',
  templateUrl: './winter-section.component.html',
  styleUrls: ['./winter-section.component.css']
})
export class WinterSectionComponent implements OnInit, AfterViewInit {
  @ViewChild('winterEffect') winterEffect!: ElementRef<HTMLCanvasElement>;
  @ViewChild('swiperRef') swiperRef!: ElementRef<HTMLDivElement>;

  winterProducts: Product[] = [];
  isDarkTheme: boolean = false;
  isLoading: boolean = false;

  private dataSubscription!: Subscription;
  private loadingSubscription!: Subscription;

  constructor(
    private shoppingService: ShoppinglistService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.checkDarkMode();
    this.loadingSubscription = this.shoppingService.getLoadingState().subscribe(isLoading => {
      this.isLoading = isLoading;
    });

    this.dataSubscription = this.shoppingService.getFeaturedData().subscribe(response => {
      if (response) {
        this.updateWinterProducts(response);
      }
    });

    this.route.queryParams.subscribe(param => {
      this.fetchWinterProducts(param['gender']);
    });
  }

  ngAfterViewInit(): void {
    this.initSnowEffect();
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) this.dataSubscription.unsubscribe();
    if (this.loadingSubscription) this.loadingSubscription.unsubscribe();
  }

  private updateWinterProducts(response: any): void {
    this.winterProducts = response.winterCollection.map((product: Product) => ({
      ...product,
      image: product.image.map(img => `https://holy-althea-moaazomar-463f67fb.koyeb.app/images/${img}`),
    }));
    console.log('Winter Collection is ', this.winterProducts);
    setTimeout(() => this.initSwiper(), 100);
  }

  fetchWinterProducts(gender: string): void {
    this.shoppingService.getFeaturedCollections(gender || 'all').subscribe();
  }

  initSwiper(): void {
    if (this.isLoading || this.winterProducts.length === 0) return;
    const swiperElement = this.swiperRef?.nativeElement;
    if (swiperElement) {
      new Swiper(swiperElement, {
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        coverflowEffect: {
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2,
          slideShadows: true,
        },
        loop: true,
        autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
      });
    }
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    const winterSection = document.querySelector('app-winter-section') as HTMLElement;
    if (winterSection) winterSection.classList.toggle('dark', this.isDarkTheme);
  }

  checkDarkMode(): void {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.isDarkTheme = true;
      document.querySelector('app-winter-section')?.classList.add('dark');
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      this.isDarkTheme = event.matches;
      document.querySelector('app-winter-section')?.classList.toggle('dark', event.matches);
    });
  }

  getProductTag(product: Product): string | undefined {
    if (product.likes > 50) return 'Bestseller';
    if (product.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) return 'New Arrival';
    if (product.stock < 10) return 'Limited';
    return undefined;
  }

  toggleDetails(event: Event, product: Product): void {
    event.stopPropagation();
    const slide = (event.target as HTMLElement).closest('.swiper-slide');
    const details = slide?.querySelector('.product-details') as HTMLElement | null;
    const btn = slide?.querySelector('.quick-view-btn') as HTMLElement | null;
    if (details && btn) {
      if (details.style.maxHeight === '150px') {
        details.style.maxHeight = '0';
        details.style.opacity = '0';
        btn.innerHTML = this.getZoomIcon();
      } else {
        details.style.maxHeight = '150px';
        details.style.opacity = '1';
        btn.innerHTML = this.getCloseIcon();
      }
    }
  }

  getZoomIcon(): string {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="11" y1="8" x2="11" y2="14"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>`;
  }

  getCloseIcon(): string {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="11" y1="8" x2="11" y2="14"></line>
    </svg>`;
  }

  initSnowEffect(): void {
    const canvas = this.winterEffect.nativeElement;
    const ctx = canvas.getContext('2d')!;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    class Snowflake {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      drift: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 1 + 0.5;
        this.opacity = Math.random() * 0.6 + 0.3;
        this.drift = Math.random() * 0.5 - 0.25;
      }

      update() {
        this.y += this.speed;
        this.x += this.drift;
        if (this.y > height) {
          this.y = -10;
          this.x = Math.random() * width;
        }
        if (this.x > width) this.x = 0;
        if (this.x < 0) this.x = width;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
      }
    }

    const SNOWFLAKE_COUNT = 150;
    const snowflakes = Array.from({ length: SNOWFLAKE_COUNT }, () => new Snowflake());

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      snowflakes.forEach(snowflake => {
        snowflake.update();
        snowflake.draw();
      });
      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    });

    animate();
  }
}