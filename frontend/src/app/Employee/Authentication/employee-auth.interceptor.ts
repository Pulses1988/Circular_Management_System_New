import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { EmployeeService } from '../../services/employee-service';

@Injectable()
export class EmployeeAuthInterceptor implements HttpInterceptor {
  constructor(private employeeService: EmployeeService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.employeeService.getToken();
    
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
            sessionStorage.setItem('emp_redirectUrl', currentUrl);
          }
          
          this.employeeService.logout();
          this.router.navigate(['/employee-login'], {
            queryParams: { returnUrl: currentUrl, sessionExpired: 'true' },
            replaceUrl: true
          });
        } else if (error.status === 403) {
          // Forbidden - redirect to unauthorized page
          this.router.navigate(['/employee/unauthorized']);
        }
        return throwError(() => error);
      })
    );
  }
}