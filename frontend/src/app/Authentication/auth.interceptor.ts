// auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AdminAuth } from '../services/admin-auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AdminAuth, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
     console.log('=== Interceptor for:', request.url);
    const token = this.authService.getToken();
    
    console.log('=== Token exists:', !!token);


    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error.status === 401) {
          // Store current URL before logout
          const currentUrl = this.router.url;
          if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('redirectUrl', currentUrl);
          }
          
          this.authService.logout();
          this.router.navigate(['/admin/admin-login'], {
            queryParams: { returnUrl: currentUrl, sessionExpired: 'true' }
          });
        } else if (error.status === 403) {
          // Forbidden - redirect to unauthorized page
          this.router.navigate(['/admin/unauthorized']);
        }
        return throwError(() => error);
      })
    );
  }
}