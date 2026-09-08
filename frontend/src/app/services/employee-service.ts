import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiUrl = environment.apiUrl;
  private currentEmployeeSubject = new BehaviorSubject<any>(null);
  public currentEmployee$ = this.currentEmployeeSubject.asObservable();

  private readonly TOKEN_KEY = 'emp_token';
  private readonly USER_KEY = 'emp_user';
  private readonly EXPIRY_KEY = 'emp_token_expiry';

  constructor(private http: HttpClient, private router: Router) {
    console.log('EmployeeService constructor called');
    // Only load from storage if running in browser
    if (this.isBrowser()) {
      this.loadUserFromStorage();
      // this.startTokenExpiryCheck();
    }
  }
  token!: string | null;

  private getHeaders(): HttpHeaders {
    if (typeof window !== 'undefined') {
      this.token = this.getToken();
    }
    // Adjust based on your auth implementation
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.token ? `Bearer ${this.token}` : '',
    });
  }

  employeeLogin(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/employees/login`, credentials);
  }

  storeAuthData(token: string, employee: any): void {
    if (!this.isBrowser()) return;

    try {
      // Encrypt and store token
      const encryptedToken = this.encryptData(token);
      localStorage.setItem(this.TOKEN_KEY, encryptedToken);

      // Store user data (non-sensitive only)
      const userData = {
        id: employee.id,
        employee_id: employee.employee_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        role_name: employee.role_name,
        head_office_name: employee.head_office_name,
        head_office_id: employee.head_office_id,
        bank_name: employee.head_office_bank_name,
        department_name: employee.department_name,
        department_id: employee.department_id,
        branch_name: employee.branch_name,
        branch_id: employee.branch_id,
        can_create_circular: employee.can_create_circular,
        can_approve_circular: employee.can_approve_circular,
      };

      const encryptedUserData = this.encryptData(JSON.stringify(userData));
      localStorage.setItem(this.USER_KEY, encryptedUserData);

      // Store expiry time
      const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000;
      localStorage.setItem(this.EXPIRY_KEY, expiryTime.toString());

      // Update current user
      this.currentEmployeeSubject.next(userData);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  getToken(): string | null {
  if (!this.isBrowser()) return null;

  try {
    const encryptedToken = localStorage.getItem(this.TOKEN_KEY);
    if (!encryptedToken) return null;
    
    // Return decrypted token
    return this.decryptData(encryptedToken);
  } catch (error) {
    console.error('Token retrieval error:', error);
    return null;
  }
}

  getCurrentEmployee(): any {
    return this.currentEmployeeSubject.value;
  }

  isAuthenticated(): boolean {
  if (!this.isBrowser()) return false;
  
  const encryptedToken = localStorage.getItem(this.TOKEN_KEY);
  if (!encryptedToken) return false;
  
  try {
    // Decrypt once here
    const token = this.decryptData(encryptedToken);
    
    // Parse JWT payload directly (no second decrypt)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    return currentTime < payload.exp;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}
private isTokenExpired(): boolean {
  return !this.isAuthenticated();
}

  logout(): void {
    console.log('LOGOUT CALLED - Stack trace:');
  // console.trace();
    if (!this.isBrowser()) return;

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
    localStorage.clear()

    if (typeof sessionStorage !== 'undefined') {
       sessionStorage.removeItem('emp_redirectUrl');
    sessionStorage.removeItem('emp_previousUrl');
      sessionStorage.clear();
    }

    this.currentEmployeeSubject.next(null);
   this.router.navigate(['/employee-login'], { replaceUrl: true }).then(() => {
    // Prevent back button navigation
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };
  });
  }

  private loadUserFromStorage(): void {
  if (!this.isBrowser()) return;

  console.log('Loading user from storage...');
  
  try {
    const isAuth = this.isAuthenticated();
    console.log('Is authenticated:', isAuth);
    
    if (isAuth) {
      const encryptedUserData = localStorage.getItem(this.USER_KEY);
      console.log('Encrypted user data exists:', !!encryptedUserData);
      
      if (encryptedUserData) {
        const userData = JSON.parse(this.decryptData(encryptedUserData));
        console.log('User data loaded:', userData);
        this.currentEmployeeSubject.next(userData);
      }
    } else {
      console.log('Not authenticated, logging out...');
      this.logout();
    }
  } catch (error) {
    console.error('Error loading user:', error);
    this.logout();
  }
}

  // private startTokenExpiryCheck(): void {
  //   if (!this.isBrowser()) return;

  //   // Check token expiry every 5 minutes
  //   setInterval(() => {
  //     if (this.isTokenExpired()) {
  //       console.log('Token expired')
  //       this.logout();
  //     }
  //   }, 60 * 1000);
  // }

  private encryptData(data: string): string {
    // Basic encryption - consider using crypto-js for production
    return btoa(encodeURIComponent(data));
  }

  private decryptData(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch (error) {
      return '';
    }
  }

  // Helper method to check if running in browser
  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // Utility methods for permissions
  canCreateCircular(): boolean {
    const employee = this.getCurrentEmployee();
    return employee?.can_create_circular || false;
  }

  canApproveCircular(): boolean {
    const employee = this.getCurrentEmployee();
    return employee?.can_approve_circular || false;
  }

  // --------------------------get approver Employee-----------------------------------
  getApprovers() {
    return this.http.get(`${this.apiUrl}/api/employees/approvers`, { headers: this.getHeaders() });
  }

  // --------------------------get employee----------------------------

  // get employe by head office and null branch id
  getEmployeeByHeadOfficeId(id: number) {
    return this.http.get(`${this.apiUrl}/api/employees/employee-by-headoffice/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getEmployeeByRegionId(id: number) {
    return this.http.get(`${this.apiUrl}/api/employees/employee-by-region/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getEmployeeByZoneId(id: number) {
    return this.http.get(`${this.apiUrl}/api/employees/employee-by-zone/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getEmployeeByCircleId(id: number) {
    return this.http.get(`${this.apiUrl}/api/employees/employee-by-circle/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getEmployeeByBranchId(id: number) {
    return this.http.get(`${this.apiUrl}/api/employees/employee-by-branch/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getEmployeeByBranchAndDepartment(branchId: number, deptId: number) {
    let params = new HttpParams();
    if (deptId) params = params.set('department_id', deptId);
    if (branchId) params = params.set('branch_id', branchId);
    return this.http.get(`${this.apiUrl}/api/employees/getByDeptAndBranch`, { params });
  }

  // get employee by the department
  getEmployeesByDepartment(deptId: number) {
    return this.http.get(`${this.apiUrl}/api/employees/department/${deptId}`, {
      headers: this.getHeaders(),
    });
  }

  getAllEmployees() {
    return this.http.get(`${this.apiUrl}/api/employees/`, {
      headers: this.getHeaders(),
    });
  }  

   getMyProfile(): Observable<any> {
  return this.http.get(`${this.apiUrl}/api/employees/my-profile`, {
    headers: this.getHeaders(),
  });
}


  // -------------------get branches----------------

  fetchAllBranches() {
    return this.http.get(`${environment.apiUrl}/api/branches/`, { headers: this.getHeaders() });
  }

  // --------------------------get department----------------------
  getDepartmentsByHeadOffice(headOfficeId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/api/departments/head-office/${headOfficeId}`, {
      headers: this.getHeaders(),
    });
  }

  getDepartmentsByBranch(branchId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/api/departments/branch/${branchId}`, {
      headers: this.getHeaders(),
    });
  }

  getAllDepartment() {
    return this.http.get(`${this.apiUrl}/api/departments/`, { headers: this.getHeaders() });
  }

  // ----------------------------------CIRCULAR UPDATE--------------------------------
  updateCircular(circularId: number, formData: FormData) {
    let headers = new HttpHeaders();

    // Only set Authorization, do NOT set Content-Type
    if (this.token) {
      headers = headers.set('Authorization', `Bearer ${this.token}`);
    }
    return this.http.put(`${this.apiUrl}/api/circular/${circularId}`, formData, { headers });
  }

  getCircularById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/circular/getAllDataById/${id}`, {
      headers: this.getHeaders(),
    });
  }  

 


  // ---------------- Forgot Password ----------------

forgotPassword(data: any): Observable<any> {

  console.log("API URL:", `${this.apiUrl}/api/employees/forgot-password`);
  console.log("Request Data:", data);

  return this.http.post(
    `${this.apiUrl}/api/employees/forgot-password`,
    data
  );

}

verifyOtp(data: any): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/api/employees/verify-otp`,
    data
  );
}

resetPassword(data: any): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/api/employees/reset-password`,
    data
  );
}

//Get head office
getBranchesByHeadOfficeId(headOfficeId: number) {
  return this.http.get(
    `${this.apiUrl}/api/branches/head-office/${headOfficeId}/branches`,
    {
      headers: this.getHeaders()
    }
  );
}



//employee by role 
getEmployeeByRoleId(roleId: number) {
  return this.http.get(
    `${this.apiUrl}/api/employees/employee-by-role/${roleId}`,
    {
      headers: this.getHeaders(),
    }
  );
} 

// Get employees by role level
getEmployeesByRoleLevel(roleLevel: string) {
  return this.http.get(
    `${this.apiUrl}/api/employees/employee-by-role-level/${roleLevel}`,
    {
      headers: this.getHeaders(),
    }
  );
}





//get employee by commitee 
getEmployeeByCommitteeId(id:number){

return this.http.get<any[]>(
`${this.apiUrl}/api/committee/${id}/members`
);

}

//get employee by committee

// getEmployeeByCommitteeId(id:number){

// return this.http.get<any[]>(
// `${this.apiUrl}/api/committee/${id}/members`,
// {
//  headers:this.getHeaders()
// }
// );

// }






}

