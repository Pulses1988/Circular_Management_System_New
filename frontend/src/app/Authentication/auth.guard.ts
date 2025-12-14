// auth.guard.ts
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AdminAuth } from '../services/admin-auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AdminAuth, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
   console.log('=== AuthGuard canActivate ===', state.url);
  
  // Check localStorage directly
  const token = this.authService.getToken();
  const role = this.authService.getRole();
  
  console.log('Guard check - Token:', !!token, 'Role:', role);
  
  if (token && role && this.authService.isAuthenticated()) {
    return true;
  }

  // Only store redirect if we're actually blocking access
  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('redirectUrl', state.url);
  }

  this.router.navigate(['/admin/admin-login'], { 
    queryParams: { returnUrl: state.url },
    replaceUrl: true
  });
  return false;
}
}