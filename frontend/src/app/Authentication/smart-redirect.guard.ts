// smart-redirect.guard.ts
import { Injectable } from '@angular/core';

import { AdminAuth } from '../services/admin-auth';
import { EmployeeService } from '../services/employee-service'; // your employee auth service
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SmartRedirectGuard implements CanActivate {
  constructor(
    private adminAuth: AdminAuth,
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Check admin token first
    if (this.adminAuth.isAuthenticated()) {
      this.router.navigate(['/admin/admin-dashboard']);
      return false;
    }
    
    // Check employee token
    if (this.employeeService.isAuthenticated()) {
      this.router.navigate(['/employee/employee-dashboard']);
      return false;
    }
    
    // No valid tokens, go to employee login (your default)
    this.router.navigate(['/employee/employee-login']);
    return false;
  }
}