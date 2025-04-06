import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ShoppinglistService {
  private featuredUrl = 'https://holy-althea-moaazomar-463f67fb.koyeb.app/products/featured';
  private mainUrl = 'https://holy-althea-moaazomar-463f67fb.koyeb.app/products/main';
  
  private featuredData$ = new BehaviorSubject<any>(null);
  private mainData$ = new BehaviorSubject<any>(null);
  private loading$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  getFeaturedCollections(gender: string): Observable<any> {
    this.loading$.next(true);
    this.featuredData$.next(null);
    const params = new HttpParams().set('gender', gender || 'all');

    return this.http.get(this.featuredUrl, { params }).pipe(
      tap(response => {
        console.log('Featured Collections Response:', response);
        this.featuredData$.next(response);
        this.loading$.next(false);
      })
    );
  }

  getMainProducts(params: any): Observable<any> {
    this.loading$.next(true);
    this.mainData$.next(null);
    let httpParams = new HttpParams()
      .set('page', params.page || 1)
      .set('limit', params.limit || 4);

    httpParams = httpParams.set('gender', params.gender || 'all');
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.color) httpParams = httpParams.set('color', params.color);

    return this.http.get(this.mainUrl, { params: httpParams }).pipe(
      tap(response => {
        console.log('Main Products Response:', response);
        this.mainData$.next(response);
        this.loading$.next(false);
      })
    );
  }

  getFeaturedData(): Observable<any> {
    return this.featuredData$.asObservable();
  }

  getMainData(): Observable<any> {
    return this.mainData$.asObservable();
  }

  getLoadingState(): Observable<boolean> {
    return this.loading$.asObservable();
  }
}