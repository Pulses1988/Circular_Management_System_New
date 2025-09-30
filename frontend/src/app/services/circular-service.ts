import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class CircularService {
  private apiUrl = environment.apiUrl;
  private currentEmployeeSubject = new BehaviorSubject<any>(null);
  private readonly USER_KEY = 'emp_user';
  private readonly TOKEN_KEY = 'emp_token';
  private readonly EXPIRY_KEY = 'emp_token_expiry';

  constructor(private http: HttpClient, private router: Router) {}
  token!: string | null;

  private getHeaders(): HttpHeaders {
    if (typeof window !== 'undefined') {
      this.token = this.getToken();
    }
    // Adjust based on your auth implementation
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.token ? `Bearer ${this.token}` : '',
    });
  }

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;

    try {
      const encryptedToken = localStorage.getItem(this.TOKEN_KEY);
      if (encryptedToken && !this.isTokenExpired()) {
        return this.decryptData(encryptedToken);
      }
    } catch (error) {
      this.logout();
    }
    return null;
  }

  logout(): void {
    if (!this.isBrowser()) return;

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }

    this.currentEmployeeSubject.next(null);
    this.router.navigate(['/employee-login']);
  }

  isTokenExpired(): boolean {
    if (!this.isBrowser()) return true;

    const expiryTime = localStorage.getItem(this.EXPIRY_KEY);
    if (!expiryTime) return true;

    return new Date().getTime() > parseInt(expiryTime);
  }

  private decryptData(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch (error) {
      return '';
    }
  }
  // -------------------------------------------------------------
  uploadCircular(formdata: FormData): Observable<any> {
    let headers = new HttpHeaders();

    // Only set Authorization, do NOT set Content-Type
    if (this.token) {
      headers = headers.set('Authorization', `Bearer ${this.token}`);
    }
    return this.http.post(`${this.apiUrl}/api/circular/upload`, formdata, { headers });
  }

  getAllCircular() {
    return this.http.get(`${this.apiUrl}/api/circular/`, { headers: this.getHeaders() });
  }

  // ----------------------Source Type---------------------------------
  getSourceTypes() {
    return this.http.get(`${this.apiUrl}/api/source-type/`, { headers: this.getHeaders() });
  }
}
