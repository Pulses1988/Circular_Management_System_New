import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient,HttpErrorResponse } from '@angular/common/http';
import { Observable,throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class User {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}
  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`).pipe(
      catchError(this.handleError)
    );
  }

  createUser(data: { username: string; email: string }) {
    return this.http.post(`${environment.apiUrl}/api/users`, data).pipe(
      catchError(this.handleError)
    );
  }
  createAdmin(data: {
    username: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    password: string;
    admin_type: string;
  }) {
    return this.http.post(`${environment.apiUrl}/api/admins`, data).pipe(
      catchError(this.handleError)
    );
  }
  fetchAllAdmin(): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apiUrl}/api/admins`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend error response
      errorMessage = `Server returned code ${error.status}: ${error.error?.message || error.message}`;
    }
    console.error('Error occurred:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
