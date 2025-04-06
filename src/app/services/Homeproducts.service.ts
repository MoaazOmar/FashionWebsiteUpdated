import { Product } from '../../interfaces/product.model';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeProductsService {
  private apiUrl = 'https://holy-althea-moaazomar-463f67fb.koyeb.app';

  constructor(private _http: HttpClient) { }
  getProducts(gender: string = '', limit: number = 3, skip: number = 0): Observable<Product[]> {
    let url = `${this.apiUrl}/?limit=${limit}&skip=${skip}`;
    if (gender) {
      url += `&gender=${gender}`;
    }
    console.log('API URL:', url); 
    return this._http.get<Product[]>(url, { withCredentials: true });
  }}