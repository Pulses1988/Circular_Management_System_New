// role.guard.ts
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AdminAuth } from '../services/admin-auth';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AdminAuth, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRoles = route.data['roles'] as string[];
    const expectedPermissions = route.data['permissions'] as string[];

    if (!this.authService.isAuthenticated()) {
      // Store attempted URL before redirecting to login
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('redirectUrl', state.url);
      }
      this.router.navigate(['/admin/admin-login']);
      return false;
    }

    // Check roles
    if (expectedRoles && expectedRoles.length > 0) {
      if (!this.authService.hasAnyRole(expectedRoles)) {
        // Store current URL as the previous page for back navigation
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('previousUrl', state.url);
        }
        this.router.navigate(['/admin/unauthorized']);
        return false;
      }
    }

    // Check permissions
    if (expectedPermissions && expectedPermissions.length > 0) {
      const hasPermission = expectedPermissions.some(permission => 
        this.authService.hasPermission(permission)
      );
      
      if (!hasPermission) {
        // Store current URL as the previous page for back navigation
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('previousUrl', state.url);
        }
        this.router.navigate(['/admin/unauthorized']);
        return false;
      }
    }

    return true;
  }
}