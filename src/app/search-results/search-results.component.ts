import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../interfaces/product.model';
import { SuggestionSearchService } from '../services/suggestion-search.service';
import { CategorySet, ColorSet } from '../../interfaces/distinctAndCount.model';
import { gsap } from 'gsap';
import { combineLatest, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  query: string = '';
  results: Product[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalSearchProducts: number = 0;
  FilteringColors: ColorSet[] = [];
  selectedColors: string[] = [];
  totalCategories: CategorySet[] = [];
  selectedCategories: string[] = [];
  selectedSort: string = '';
  selectedGenders: string[] = [];
  productPerPageHolder: Array<number> = [5, 10, 20, 30];
  isFilterSidebarOpen: boolean = false;
  selectedProduct: Product | null = null;
  isLoading: boolean = false;

  @ViewChild('listPanel') listPanel!: ElementRef;
  @ViewChild('detailPanel') detailPanel!: ElementRef;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _suggestionSearchService: SuggestionSearchService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    combineLatest([
      this.route.paramMap,
      this.route.queryParams
    ]).pipe(
      debounceTime(50),
      distinctUntilChanged(([prevParams, prevQuery], [currParams, currQuery]) => {
        return prevParams.get('query') === currParams.get('query') &&
               JSON.stringify(prevQuery) === JSON.stringify(currQuery);
      }),
      takeUntil(this.destroy$)
    ).subscribe(([params, queryParams]) => {
      this.query = params.get('query') || '';
      this.currentPage = parseInt(queryParams['page']) || 1;
      this.itemsPerPage = parseInt(queryParams['limit']) || 5;
      this.selectedColors = queryParams['color'] ? queryParams['color'].split(',') : [];
      this.selectedCategories = queryParams['category'] ? queryParams['category'].split(',') : [];
      this.selectedGenders = queryParams['gender'] ? queryParams['gender'].split(',') : [];
      this.selectedSort = queryParams['sort'] || '';
      this.fetchSearchResults();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openFilterSidebar(): void {
    this.isFilterSidebarOpen = true;
  }

  closeFilterSidebar(): void {
    this.isFilterSidebarOpen = false;
  }

  private updateUrlParams(): void {
    const queryParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sort: this.selectedSort || null,
      color: this.selectedColors.length ? this.selectedColors.join(',') : null,
      category: this.selectedCategories.length ? this.selectedCategories.join(',') : null,
      gender: this.selectedGenders.length ? this.selectedGenders.join(',') : null
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.cleanParams(queryParams),
      queryParamsHandling: 'merge'
    });
  }

  private cleanParams(params: any): any {
    const cleaned = { ...params };
    Object.keys(cleaned).forEach((key) => {
      if (!cleaned[key]) {
        cleaned[key] = null;
      }
    });
    return cleaned;
  }

  setItemsPerPage(option: any): void {
    this.itemsPerPage = parseInt(option);
    this.currentPage = 1;
    this.updateUrlParams();
  }

  changeTheColor(colors: string[]): void {
    this.selectedColors = colors;
    this.currentPage = 1;
    this.updateUrlParams();
  }

  changeTheCategory(categories: string[]): void {
    this.selectedCategories = categories;
    this.currentPage = 1;
    this.updateUrlParams();
  }

  changeTheSort(selectedSort: string): void {
    this.selectedSort = selectedSort;
    this.currentPage = 1;
    this.updateUrlParams();
  }

  changeTheGender(genders: string[]): void {
    this.selectedGenders = genders;
    this.currentPage = 1;
    this.updateUrlParams();
  }

  fetchSearchResults(filters: any = {}, page: number = this.currentPage): void {
    this.isLoading = true;
    this.results = [];
    filters = {
      ...(this.selectedColors.length && { color: this.selectedColors }),
      ...(this.selectedCategories.length && { category: this.selectedCategories }),
      ...(this.selectedSort && { sort: this.selectedSort }),
      ...(this.selectedGenders.length && { gender: this.selectedGenders })
    };
    gsap.config({ autoSleep: 60, force3D: false, nullTargetWarn: false });

    this._suggestionSearchService
      .getSuggestion(this.query, filters, page, this.itemsPerPage)
      .subscribe({
        next: (response) => {
          this.results = response.suggestions.map((product: Product) => ({
            ...product,
            image: Array.isArray(product.image)
              ? product.image.map((img: string) => `https://holy-althea-moaazomar-463f67fb.koyeb.app/images/${img}`)
              : [`https://holy-althea-moaazomar-463f67fb.koyeb.app/images/${product.image}`]
          }));
          this.totalSearchProducts = response.totalCount || 0;
          this.FilteringColors = response.colorsWithCounts || [];
          this.totalCategories = response.categoriesWithCounts || [];
          this.currentPage = response.currentPage || page;
          this.isLoading = false;
          this.cdr.detectChanges();

          if (this.results.length > 0) {
            gsap.killTweensOf('.product-card');
            gsap.from('.product-card', {
              opacity: 0,
              y: 50,
              duration: 0.8,
              stagger: 0.1,
              ease: 'power3.out',
              delay: 0.2,
              overwrite: 'auto'
            });
          }
        },
        error: (err) => {
          console.error('Fetch error:', err);
          this.results = [];
          this.totalSearchProducts = 0;
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  changePage(newPage: number): void {
    const totalPages = Math.ceil(this.totalSearchProducts / this.itemsPerPage);
    if (newPage >= 1 && newPage <= totalPages) {
      this.currentPage = newPage;
      this.updateUrlParams();
    }
  }

  openDetail(product: Product): void {
    this.selectedProduct = product;
    if (this.listPanel && this.detailPanel) {
      const tl = gsap.timeline();
      tl.to(this.detailPanel.nativeElement, {
        x: 0,
        duration: 0.5,
        ease: 'power3.out'
      });
      tl.to(this.listPanel.nativeElement, {
        width: '60%',
        duration: 0.5,
        ease: 'power3.out'
      }, '-=0.5');
      tl.from('.detail-image-container', {
        opacity: 0,
        x: -30,
        duration: 0.4,
        ease: 'back.out(1.7)'
      }, '-=0.3');
      tl.from('.detail-info > *', {
        opacity: 0,
        y: 20,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out'
      }, '-=0.2');
    }
  }

  closeDetail(): void {
    if (this.listPanel && this.detailPanel) {
      const tl = gsap.timeline({
        onComplete: () => {
          this.selectedProduct = null;
          this.cdr.detectChanges();
        }
      });
      tl.to('.detail-info > *', {
        opacity: 0,
        y: 20,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.in'
      });
      tl.to(this.detailPanel.nativeElement, {
        x: '100%',
        duration: 0.5,
        ease: 'power3.in'
      }, '-=0.1');
      tl.to(this.listPanel.nativeElement, {
        width: '100%',
        duration: 0.5,
        ease: 'power3.out'
      }, '-=0.4');
    }
  }

  navigateToProduct(productId: string): void {
    this.router.navigate(['/products', productId]);
    this.closeDetail(); // Close the detail panel after navigation
  }
}