import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { EmployeeService } from '../../services/employee-service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeAuthGuard implements CanActivate {
  constructor(private employeeService: EmployeeService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.employeeService.isAuthenticated()) {
      return true;
    }

    // Store the attempted URL for redirecting after login
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('emp_redirectUrl', state.url);
    }

    this.router.navigate(['/employee-login'], { 
      queryParams: { returnUrl: state.url },
      replaceUrl: true
    });
    return false;
  }
}