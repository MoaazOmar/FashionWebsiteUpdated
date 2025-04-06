import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { CommentEvent, CommentPayload } from '../../interfaces/product.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SingleProductService {
  private apiUrl = `${environment.apiUrl}/product`;
  private socket: Socket | undefined;

  constructor(
    private _http: HttpClient,
    private _authService: AuthService
  ) {
    // Subscribe to user changes to manage socket connection
    this._authService.currentUser.subscribe(user => {
      if (user) {
        this.initializeSocket();
      } else {
        // Disconnect socket on logout
        if (this.socket) {
          this.socket.disconnect();
          this.socket = undefined;
        }
      }
    });
  }

  /** Initialize or reinitialize the Socket.IO connection with the current token */
  private initializeSocket(): void {
    const token = this._authService.getToken();
    console.log('Initializing socket with token:', token?.slice(0, 15));
    if (this.socket) {
      this.socket.disconnect(); // Clean up existing connection
    }
    this.socket = new Socket({
      url: environment.socketUrl,
      options: {
        auth: {
          token: token ? `Bearer ${token}` : ''
        },
        transports: ['websocket'],
        withCredentials: true
      } as any
    });

    // Log socket connection status
    this.socket.on('connect', () => console.log('Socket connected'));
    this.socket.on('connect_error', (err) => console.error('Socket connection error:', err));
    this.socket.on('commentError', (msg) => console.error('Socket comment error:', msg));
    this.socket.on('receiveComment', (data) => console.log('Received comment:', data));
  }

  /** Ensure the socket is initialized before emitting events */
  private ensureSocket(): void {
    if (!this.socket) {
      this.initializeSocket();
    }
  }

  /** Join a Socket.IO room */
  joinRoom(roomId: string): void {
    this.ensureSocket();
    this.socket!.emit('joinRoom', roomId);
    console.log(`Joining room: ${roomId}`);
  }

  /** Send a new comment via Socket.IO */
  sendComment(productId: string, text: string, parentId: string | null = null, rating?: number): void {
    if (!this._authService.isLoggedIn()) {
      console.error('User not logged in for sending comment');
      return;
    }
    this.ensureSocket();
    this.joinRoom(productId);
    const comment = { text, parentId, rating };
    const payload = { productId, comment };
    console.log('Sending comment payload:', payload);
    this.socket!.emit('newComment', payload);
  }

  /** Get a single product by ID via HTTP */
  getProduct(id: string): Observable<any> {
    return this._http.get(`${this.apiUrl}/${id}`);
  }

  /** Get related products excluding the selected one via HTTP */
  getRelatedProducts(productId: string): Observable<any> {
    return this._http.get(`${this.apiUrl}/${productId}/related`);
  }

  /** Toggle like on a product via HTTP */
  toggleLikeProduct(productId: string): Observable<any> {
    if (!this._authService.isLoggedIn()) {
      console.error('User not logged in for liking product');
      return throwError(() => new Error('Not logged in'));
    }
    return this._http.post(`${this.apiUrl}/${productId}/like`, {});
  }

  /** Toggle dislike on a product via HTTP */
  toggleDislikeProduct(productId: string): Observable<any> {
    if (!this._authService.isLoggedIn()) {
      console.error('User not logged in for disliking product');
      return throwError(() => new Error('Not logged in'));
    }
    return this._http.post(`${this.apiUrl}/${productId}/dislike`, {});
  }

  /** Receive new comments via Socket.IO */
  getComments(): Observable<CommentEvent> {
    return new Observable(observer => {
      this.ensureSocket();
      this.socket!.on('receiveComment', (data) => {
        console.log('Received comment:', data);
        observer.next(data);
      });
    });
  }

  /** Delete a comment via Socket.IO */
  deleteComment(productId: string, commentId: string): void {
    if (!this._authService.isLoggedIn()) {
      console.error('User not logged in for deleting comment');
      return;
    }
    this.ensureSocket();
    this.socket!.emit('deleteComment', { productId, commentId });
  }

  /** Edit a comment via Socket.IO */
  editComment(productId: string, commentId: string, newText: string): void {
    if (!this._authService.isLoggedIn()) {
      console.error('User not logged in for editing comment');
      return;
    }
    this.ensureSocket();
    this.socket!.emit('editComment', { productId, commentId, newText });
  }

  /** Receive comment edit updates via Socket.IO */
  getCommentEdits(): Observable<any> {
    this.ensureSocket();
    return this.socket!.fromEvent('commentEdited');
  }

  /** Receive comment delete updates via Socket.IO */
  getCommentDeletes(): Observable<any> {
    this.ensureSocket();
    return this.socket!.fromEvent('commentDeleted');
  }

  /** Toggle like on a comment via Socket.IO */
  toggleLikeComment(productId: string, commentId: string): void {
    const currentUser = this._authService.currentUserValue;
    if (!currentUser) {
      console.error('No user is logged in for liking comment');
      return;
    }
    this.ensureSocket();
    this.socket!.emit('toggleLikeComment', { productId, commentId, userId: currentUser.id });
  }

  /** Toggle dislike on a comment via Socket.IO */
  toggleDislikeComment(productId: string, commentId: string): void {
    const currentUser = this._authService.currentUserValue;
    if (!currentUser) {
      console.error('No user is logged in for disliking comment');
      return;
    }
    this.ensureSocket();
    this.socket!.emit('toggleDislikeComment', { productId, commentId, userId: currentUser.id });
  }

  /** Toggle love on a comment via Socket.IO */
  toggleLoveComment(productId: string, commentId: string): void {
    const currentUser = this._authService.currentUserValue;
    if (!currentUser) {
      console.error('No user is logged in for loving comment');
      return;
    }
    this.ensureSocket();
    this.socket!.emit('toggleLoveComment', { productId, commentId, userId: currentUser.id });
  }

  /** Receive comment reaction updates via Socket.IO */
  getCommentReactionUpdates(): Observable<any> {
    this.ensureSocket();
    return this.socket!.fromEvent('commentReactionUpdated');
  }

  /** Receive user-specific reaction updates via Socket.IO */
  getUserReactionUpdates(): Observable<any> {
    this.ensureSocket();
    return new Observable((observer) => {
      this.socket!.on('userReactionUpdated', (data) => {
        observer.next(data);
      });
    });
  }

  /** Receive comment errors from the server via Socket.IO */
  getCommentErrors(): Observable<string> {
    this.ensureSocket();
    return new Observable(observer => {
      this.socket!.on('commentError', (message) => {
        observer.next(message);
      });
    });
  }
}