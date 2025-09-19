import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface CreateRoleRequest {
  name: string;
  position: number;
  head_office_id: number;
  branch_id?: number | null;
  department_id?: number | null;
}

export interface CreateRoleResponse {
  message: string;
  roleId: number;
}

export interface Role {
  id: number;
  name: string;
  position: number;
  head_office_id: number;
  branch_id?: number | null;
  department_id?: number | null;
  timestamp?: string; // Your schema uses 'timestamp' instead of 'created_at'/'updated_at'
  department_name?: string;
  branch_name?: string;
}

@Injectable({
  providedIn: 'root',
})
export class User {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); // Adjust based on your auth implementation
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

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
    const token = localStorage.getItem('authToken'); // Ensure this token exists
    const headers = { Authorization: `Bearer ${token}` };
    return this.http
      .get<any[]>(`${environment.apiUrl}/api/admins`, { headers })
      .pipe(catchError(this.handleError));
  }

  // --------------Head Office API------------

  fetchAllHeadOffice() {
    const token = localStorage.getItem('authToken'); // Ensure this token exists
    const headers = { Authorization: `Bearer ${token}` };
    return this.http
      .get(`${environment.apiUrl}/api/head-office/`, { headers })
      .pipe(catchError(this.handleError));
  }

  // ---------------branches API-----------------------

  fetchAllBranches() {
    const token = localStorage.getItem('authToken'); // Ensure this token exists
    const headers = { Authorization: `Bearer ${token}` };
    return this.http
      .get(`${environment.apiUrl}/api/branches/`, { headers })
      .pipe(catchError(this.handleError));
  }

  createBranches(data: {}) {
    const token = localStorage.getItem('authToken'); // Ensure this token exists
    const headers = { Authorization: `Bearer ${token}` };
    return this.http
      .post(`${environment.apiUrl}/api/branches/`, data, { headers })
      .pipe(catchError(this.handleError));
  }

  updateBranches(id: number, data: {}) {
    const token = localStorage.getItem('authToken'); // Ensure this token exists
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.put(`${environment.apiUrl}/api/branches/${id}`, data, { headers });
  }

  getBranchById(id:number){
    const token = localStorage.getItem('authToken'); // Ensure this token exists
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get(`${this.apiUrl}/api/branches/${id}`,{headers})
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
    const token = localStorage.getItem('authToken'); // Ensure this token exists
    const headers = { Authorization: `Bearer ${token}` };
    return this.http
      .post(`${this.apiUrl}/api/head-office/`, data, { headers })
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
    return this.http.put(`${this.apiUrl}/api/departments/${id}`, data, { headers });
  }
  getDepartmentCountByHeadOffice(headOfficeId: number): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get(`${this.apiUrl}/api/departments/head-office/${headOfficeId}/count`, {
      headers,
    });
  }

  getDepartmentCountByBranch(branchId: number): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get(`${this.apiUrl}/api/departments/branch/${branchId}/count`, { headers });
  }

//  ---------------------------------------------Roles api ---------------------------------------------------
  createRole(roleData: {
    name: string;
    position: number;
    head_office_id: number;
    branch_id?: number | null;
    department_id?: number | null;
  }): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.post(`${this.apiUrl}/api/roles`, roleData,{headers});
  }

   // Get all roles by head office
  getRolesByHeadOffice(headOfficeId: number): Observable<Role[]> {
    return this.http.get<Role[]>(
      `${this.apiUrl}/api/roles/head-office/${headOfficeId}`, 
      { headers: this.getHeaders() }
    );
  }

  // Get all roles by branch
  getRolesByBranch(branchId: number): Observable<Role[]> {
    return this.http.get<Role[]>(
      `${this.apiUrl}/api/roles/branch/${branchId}`, 
      { headers: this.getHeaders() }
    );
  }

  // Get all roles by department
  getRolesByDepartment(departmentId: number): Observable<Role[]> {
    return this.http.get<Role[]>(
      `${this.apiUrl}/api/roles/department/${departmentId}`, 
      { headers: this.getHeaders() }
    );
  }

  // Update role
  updateRole(roleId: number, roleData: { name: string; position: number }): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/api/roles/${roleId}`, 
      roleData, 
      { headers: this.getHeaders() }
    );
  }

  // Update role position only
  updateRolePosition(roleId: number, position: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/api/roles/${roleId}/position`, 
      { position }, 
      { headers: this.getHeaders() }
    );
  }

  // Delete role
  deleteRole(roleId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/api/roles/${roleId}`, 
      { headers: this.getHeaders() }
    );
  }

  // Get single role by ID
  getRoleById(roleId: number): Observable<Role> {
    return this.http.get<Role>(
      `${this.apiUrl}/api/roles/${roleId}`, 
      { headers: this.getHeaders() }
    );
  }

  // Bulk update role positions (for reordering)
  updateRolePositions(roleUpdates: { id: number; position: number }[]): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/api/roles/bulk-position-update`, 
      { roleUpdates }, 
      { headers: this.getHeaders() }
    );
  }

}
