import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { EmployeeService } from '../../services/employee-service';

@Injectable({
  providedIn: 'root'
})
export class EmployeePermissionGuard implements CanActivate {
  constructor(private employeeService: EmployeeService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const requiredPermissions = route.data['permissions'] as string[];

    if (!this.employeeService.isAuthenticated()) {
      // Store attempted URL before redirecting to login
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('emp_redirectUrl', state.url);
      }
      this.router.navigate(['/employee-login'], { replaceUrl: true });
      return false;
    }

    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(permission => {
        if (permission === 'can_create_circular') {
          return this.employeeService.canCreateCircular();
        }
        if (permission === 'can_approve_circular') {
          return this.employeeService.canApproveCircular();
        }
        return false;
      });
      
      if (!hasPermission) {
        // Store current URL as the previous page for back navigation
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('emp_previousUrl', state.url);
        }
        this.router.navigate(['/employee/unauthorized']);
        return false;
      }
    }

    return true;
  }
}