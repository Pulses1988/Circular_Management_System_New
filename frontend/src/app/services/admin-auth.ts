// admin-auth.service.ts - Improved version with session management
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
  admin_type: string;
  permissions?: string[];
}

export interface LoginResponse {
  token: string;
  admin: User;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAuth {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {
      console.log('AdminAuth constructor called');
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
  console.log('=== loadUserFromStorage START ===');
  
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('role');
    
    console.log('Token:', token ? 'exists' : 'null');
    console.log('Role:', role);
    
    if (token && role) {
      const isExpired = this.isTokenExpired(token);
      console.log('Token expired check:', isExpired);
      
      if (!isExpired) {
        const permissionsStr = localStorage.getItem('permissions');
        const permissions = permissionsStr ? JSON.parse(permissionsStr) : [];
        
        const user: User = { 
          admin_type: role,
          permissions: permissions 
        };
        this.currentUserSubject.next(user);
        console.log('✓ Admin loaded successfully');
      } else {
        console.log('✗ Token expired');
        // Don't clear here, let guards handle it
        this.currentUserSubject.next(null);
      }
    } else {
      console.log('✗ Token or role missing');
      // Just set to null, DON'T clear localStorage
      this.currentUserSubject.next(null);
    }
  }
  console.log('=== loadUserFromStorage END ===');
}
private clearStorage(): void {
  if (typeof window !== 'undefined') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('role');
      localStorage.removeItem('permissions');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('redirectUrl');
      sessionStorage.removeItem('previousUrl');
    }
  }
  this.currentUserSubject.next(null);
}

  loginAdmin(data: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/api/admins/login`, data).pipe(
      tap(response => {
        if (response.token && response.admin.admin_type) {
          // Store in localStorage
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('role', response.admin.admin_type);
            
            // Store permissions if available
            if (response.admin.permissions) {
              localStorage.setItem('permissions', JSON.stringify(response.admin.permissions));
            }
          }
          
          // Update current user
          this.currentUserSubject.next(response.admin);
          
          // Handle redirect after successful login
          this.handlePostLoginRedirect();
        }
      }),
      map(response => response)
    );
  }

 private handlePostLoginRedirect(): void {
  setTimeout(() => {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const redirectUrl = sessionStorage.getItem('redirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectUrl');
        this.router.navigateByUrl(redirectUrl);
      } else {
        this.router.navigate(['/admin/admin-dashboard']);
      }
    } else {
      this.router.navigate(['/admin/admin-dashboard']);
    }
  }, 100);
}

  logout(navigate: boolean = true): void {
    this.clearStorage();
    
    if (navigate) {
      this.router.navigate(['/admin/admin-login']);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  getRole(): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('role');
    }
    return null;
  }

  getPermissions(): string[] {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const permissions = localStorage.getItem('permissions');
      return permissions ? JSON.parse(permissions) : [];
    }
    return [];
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

 isAuthenticated(): boolean {
  // Check localStorage directly, not just the token variable
  const token = this.getToken();
  const role = this.getRole();
  
  console.log('isAuthenticated check - Token exists:', !!token, 'Role:', role);
  
  if (!token || !role) {
    return false;
  }
  
  return !this.isTokenExpired(token);
}

  hasRole(role: string): boolean {
    const userRole = this.getRole();
    return userRole === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getRole();
    return userRole ? roles.includes(userRole) : false;
  }

  hasPermission(permission: string): boolean {
    const permissions = this.getPermissions();
    return permissions.includes(permission);
  }

  hasAnyPermission(requiredPermissions: string[]): boolean {
    const userPermissions = this.getPermissions();
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  // Method to check if user has sufficient access (role OR permission)
  hasAccess(roles?: string[], permissions?: string[]): boolean {
    let hasRoleAccess = true;
    let hasPermissionAccess = true;

    if (roles && roles.length > 0) {
      hasRoleAccess = this.hasAnyRole(roles);
    }

    if (permissions && permissions.length > 0) {
      hasPermissionAccess = this.hasAnyPermission(permissions);
    }

    // User needs either role access OR permission access
    return hasRoleAccess || hasPermissionAccess;
  }

  private isTokenExpired(token: string): boolean {
  if (!token) {
    console.log('isTokenExpired: no token');
    return true;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const currentTime = Date.now();
    const bufferTime = 60 * 1000; // 1 minute
    
    console.log('Token expiry check:', {
      expiryTime: new Date(expiryTime),
      currentTime: new Date(currentTime),
      expiresIn: Math.floor((expiryTime - currentTime) / 1000) + ' seconds',
      isExpired: currentTime > (expiryTime - bufferTime)
    });
    
    return currentTime > (expiryTime - bufferTime);
  } catch (error) {
    console.log('isTokenExpired: parse error', error);
    return true;
  }
}

  // Utility method to get redirect URL from session
  getRedirectUrl(): string | null {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('redirectUrl');
    }
    return null;
  }

  // Utility method to clear redirect URL
  clearRedirectUrl(): void {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('redirectUrl');
    }
  }
}