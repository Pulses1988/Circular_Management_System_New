import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiUrl = environment.apiUrl;
  private currentEmployeeSubject = new BehaviorSubject<any>(null);
  public currentEmployee$ = this.currentEmployeeSubject.asObservable();

  private readonly TOKEN_KEY = 'emp_token';
  private readonly USER_KEY = 'emp_user';
  private readonly EXPIRY_KEY = 'emp_token_expiry';

  constructor(private http: HttpClient, private router: Router) {
    // Only load from storage if running in browser
    if (this.isBrowser()) {
      this.loadUserFromStorage();
      this.startTokenExpiryCheck();
    }
  }
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

  employeeLogin(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/employees/login`, credentials);
  }

  storeAuthData(token: string, employee: any): void {
    if (!this.isBrowser()) return;

    try {
      // Encrypt and store token
      const encryptedToken = this.encryptData(token);
      localStorage.setItem(this.TOKEN_KEY, encryptedToken);

      // Store user data (non-sensitive only)
      const userData = {
        id: employee.id,
        employee_id: employee.employee_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        role_name: employee.role_name,
        head_office_name: employee.head_office_name,
        bank_name: employee.head_office_bank_name,
        department_name: employee.department_name,
        branch_name: employee.branch_name,
        can_create_circular: employee.can_create_circular,
        can_approve_circular: employee.can_approve_circular,
      };

      const encryptedUserData = this.encryptData(JSON.stringify(userData));
      localStorage.setItem(this.USER_KEY, encryptedUserData);

      // Store expiry time
      const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000;
      localStorage.setItem(this.EXPIRY_KEY, expiryTime.toString());

      // Update current user
      this.currentEmployeeSubject.next(userData);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
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

  getCurrentEmployee(): any {
    return this.currentEmployeeSubject.value;
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser()) return false;
    return this.getToken() !== null && !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    if (!this.isBrowser()) return true;

    const expiryTime = localStorage.getItem(this.EXPIRY_KEY);
    if (!expiryTime) return true;

    return new Date().getTime() > parseInt(expiryTime);
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

  private loadUserFromStorage(): void {
    if (!this.isBrowser()) return;

    try {
      if (this.isAuthenticated()) {
        const encryptedUserData = localStorage.getItem(this.USER_KEY);
        if (encryptedUserData) {
          const userData = JSON.parse(this.decryptData(encryptedUserData));
          this.currentEmployeeSubject.next(userData);
        }
      } else {
        this.logout();
      }
    } catch (error) {
      this.logout();
    }
  }

  private startTokenExpiryCheck(): void {
    if (!this.isBrowser()) return;

    // Check token expiry every 5 minutes
    setInterval(() => {
      if (this.isTokenExpired()) {
        this.logout();
      }
    }, 5 * 60 * 1000);
  }

  private encryptData(data: string): string {
    // Basic encryption - consider using crypto-js for production
    return btoa(encodeURIComponent(data));
  }

  private decryptData(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch (error) {
      return '';
    }
  }

  // Helper method to check if running in browser
  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // Utility methods for permissions
  canCreateCircular(): boolean {
    const employee = this.getCurrentEmployee();
    return employee?.can_create_circular || false;
  }

  canApproveCircular(): boolean {
    const employee = this.getCurrentEmployee();
    return employee?.can_approve_circular || false;
  }

  // --------------------------get approver Employee-----------------------------------
  getApprovers() {
    return this.http.get(`${this.apiUrl}/api/employees/approvers`, { headers: this.getHeaders() });
  }

  // --------------------------get repeat cycle data-----------------------------------
  getReapetCycleData() {
    return this.http.get(`${this.apiUrl}/api/repeat-cycle/`, { headers: this.getHeaders() });
  }
}
