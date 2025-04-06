import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, LoginRequest, SignupRequest, AuthResponse } from '../../interfaces/auth.model';
import { AddFavoriteService } from './addFavourites.porducts.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://holy-althea-moaazomar-463f67fb.koyeb.app/auth';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private _addFavoriteService: AddFavoriteService
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(JSON.parse(localStorage.getItem('currentUser') || 'null'));
    console.log('Initial user from localStorage:', this.currentUserSubject.value);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Get the current user value
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is logged in (token exists and user is set)
  public isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUserValue;
  }

  // Check if user is an admin
  public isAdmin(): boolean {
    return this.currentUserValue?.isAdmin === true;
  }

  // Store user and token in localStorage and update subject
  private setUser(user: User, token: string): void {
    console.log('Setting user:', user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', token);
    this.currentUserSubject.next(user);
  }

  // Get the stored token
  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Signup
  signup(signupRequest: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, signupRequest).pipe(
      tap((response: AuthResponse) => {
        if (response.user && response.token) {
          this.setUser(response.user, response.token);
        }
      })
    );
  }

  // Login
  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginRequest).pipe(
      tap((response: AuthResponse) => {
        console.log('Login response:', response);
        if (response.user && response.token) {
          this.setUser(response.user, response.token);
        }
      })
    );
  }

  // Logout
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this._addFavoriteService.clearLove();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}