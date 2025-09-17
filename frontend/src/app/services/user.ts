import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class User {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`).pipe(catchError(this.handleError));
  }

  createUser(data: { username: string; email: string }) {
    return this.http
      .post(`${environment.apiUrl}/api/users`, data)
      .pipe(catchError(this.handleError));
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
    return this.http
      .post(`${environment.apiUrl}/api/admins`, data)
      .pipe(catchError(this.handleError));
  }

  fetchAllAdmin(): Observable<any[]> {
    return this.http
      .get<any[]>(`${environment.apiUrl}/api/admins`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend error response
      errorMessage = `Server returned code ${error.status}: ${
        error.error?.message || error.message
      }`;
    }
    console.error('Error occurred:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  loginAdmin(data: { username: string; password: string }) {
    return this.http.post(`${this.apiUrl}/api/admins/login`, data);
  }

  addHeadOffice(data: { name: string; address: string }) {
    return this.http
      .post(`${this.apiUrl}/api/head-office/`, data)
      .pipe(catchError(this.handleError));
  }

  createDepartments(data: {
    name: string;
    head_office_id: number | null;
    branch_id: number | null;
  }) {
    const token = localStorage.getItem('authToken'); // Ensure this token exists
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.post(`${this.apiUrl}/api/departments`, data, { headers });
  }

  getDepartmentsByHeadOffice(headOfficeId: number) {
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<any[]>(`${this.apiUrl}/api/departments/head-office/${headOfficeId}`, {
      headers,
    });
  }

  getDepartmentsByBranch(branchId: number) {
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<any[]>(`${this.apiUrl}/api/departments/branch/${branchId}`, { headers });
  }

  updateDepartment(id: number, data: { name: string }) {
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
  return this.http.put(`${this.apiUrl}/api/departments/${id}`, data,{headers});
}
 getDepartmentCountByHeadOffice(headOfficeId: number): Observable<any> {
  const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get(`${this.apiUrl}/departments/head-office/${headOfficeId}/count`,{headers});
  }

  getDepartmentCountByBranch(branchId: number): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get(`${this.apiUrl}/departments/branch/${branchId}/count`,{headers});
  }
}
