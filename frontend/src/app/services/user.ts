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
  token!: string | null;

  constructor(private http: HttpClient) {}
  private getHeaders(): HttpHeaders {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');

      if (!this.token) {
        const encryptedEmployeeToken = localStorage.getItem('emp_token');
        try {
          this.token = encryptedEmployeeToken ? decodeURIComponent(atob(encryptedEmployeeToken)) : null;
        } catch {
          this.token = null;
        }
      }
    }
    // Adjust based on your auth implementation
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.token ? `Bearer ${this.token}` : '',
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
    return this.http
      .get<any[]>(`${environment.apiUrl}/api/admins`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // --------------Head Office API------------

  fetchAllHeadOffice() {
    return this.http
      .get(`${environment.apiUrl}/api/head-office/`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  fetchHeadOfficeById(id: number) {
    return this.http
      .get(`${environment.apiUrl}/api/head-office/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ---------------branches API-----------------------

  fetchAllBranches() {
    return this.http
      .get(`${environment.apiUrl}/api/branches/`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createBranches(data: {}) {
    return this.http
      .post(`${environment.apiUrl}/api/branches/`, data, { headers: this.getHeaders() })
      // .pipe(catchError(this.handleError));
  }

  updateBranches(id: number, data: {}) {
    return this.http.put(`${environment.apiUrl}/api/branches/${id}`, data, {
      headers: this.getHeaders(),
    });
  }

  getBranchCountByHeadOfficeId(headOfficeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/branches/head-office/${headOfficeId}/count`, {
      headers: this.getHeaders(),
    });
  }

  checkUsernameExists(username: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrl}/api/branches/check-username?username=${username}`,
      { headers: this.getHeaders() }
    );
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/api/branches/check-email?email=${email}`, {
      headers: this.getHeaders(),
    });
  }

  getBranchesWithAdminStatus() {
    return this.http.get(`${this.apiUrl}/api/branches/getAdminStatus`, {
      headers: this.getHeaders(),
    });
  }

  getBranchById(id: number) {
    return this.http.get(`${this.apiUrl}/api/branches/${id}`, { headers: this.getHeaders() });
  }

  // ------------------Employee API---------------------
  createEmployee(data: {}) {
    return this.http
      .post(`${this.apiUrl}/api/employees/`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAllEmployee() {
    return this.http.get(`${this.apiUrl}/api/employees/`, { headers: this.getHeaders() });
  }

  getEmployeeByHeadOfficeId(id: number) {
    return this.http.get(`${this.apiUrl}/api/employees/employee-by-headoffice/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getEmployeeByBranchId(id: number) {
    return this.http.get(`${this.apiUrl}/api/employees/employee-by-branch/${id}`, {
      headers: this.getHeaders(),
    });
  }

//MEthod for branch manager 
getManagersByBranch(branchId: number) {
  return this.http.get(
    `${this.apiUrl}/api/employees/branch/${branchId}/managers`,
    {
      headers: this.getHeaders(),
    }
  );
}






  updateEmployee(id: number, data: {}) {
    return this.http.put(`${this.apiUrl}/api/employees/${id}`, data, {
      headers: this.getHeaders(),
    });
  }

  checkEmployeeIdExists(empId: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrl}/api/employees/check-employee-id?employee_id=${empId}`,
      { headers: this.getHeaders() }
    );
  }

  checkEmployeeEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/api/employees/check-email?email=${email}`, {
      headers: this.getHeaders(),
    });
  }

  checkEmployeePhoneNoExists(phoneNo: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/api/employees/check-phone?phone=${phoneNo}`, {
      headers: this.getHeaders(),
    });
  }

  getAllEmployeeCount() {
    return this.http.get(`${this.apiUrl}/api/employees/getAllEmployeeCount`, {
      headers: this.getHeaders(),
    });
  }

  getByBranchEmployeeCount(branchId: number) {
    return this.http.get(`${this.apiUrl}/api/employees/getByBranchEmployeeCount/${branchId}`, {
      headers: this.getHeaders(),
    });
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
    return this.http
      .post(`${this.apiUrl}/api/head-office/`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createDepartments(data: {
    name: string;
    head_office_id: number | null;
    branch_id: number | null;
  }) {
    return this.http.post(`${this.apiUrl}/api/departments`, data, { headers: this.getHeaders() });
  }


getAllDepartments(): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl}/api/departments`,
    {
      headers: this.getHeaders()
    }
  );
}

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

  updateDepartment(id: number, data: { name: string }) {
    return this.http.put(`${this.apiUrl}/api/departments/${id}`, data, {
      headers: this.getHeaders(),
    });
  }


  //For delet department 
// Delete department
deleteDepartment(id: number): Observable<any> {
  return this.http.delete(
    `${this.apiUrl}/api/departments/${id}`,
    {
      headers: this.getHeaders()
    }
  );
}



  getDepartmentCountByHeadOffice(headOfficeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/departments/head-office/${headOfficeId}/count`, {
      headers: this.getHeaders(),
    });
  }



  
  getDepartmentCountByBranch(branchId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/departments/branch/${branchId}/count`, {
      headers: this.getHeaders(),
    });
  }

  //  ---------------------------------------------Roles api ---------------------------------------------------
  createRole(roleData: {
    name: string;
    position: number;
    head_office_id: number;
    branch_id?: number | null;
    department_id?: number | null;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/roles`, roleData, { headers: this.getHeaders() });
  }

  // Get all roles by head office
  getRolesByHeadOffice(headOfficeId: number): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/api/roles/head-office/${headOfficeId}`, {
      headers: this.getHeaders(),
    });
  }

  // Get all roles by branch
  getRolesByBranch(branchId: number | undefined): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/api/roles/branch/${branchId}`, {
      headers: this.getHeaders(),
    });
  }

  // Get all roles by department
  getRolesByDepartment(departmentId: number): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/api/roles/department/${departmentId}`, {
      headers: this.getHeaders(),
    });
  }

  // Update role
  updateRole(roleId: number, roleData: { name: string; position: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/roles/${roleId}`, roleData, {
      headers: this.getHeaders(),
    });
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
    return this.http.delete(`${this.apiUrl}/api/roles/${roleId}`, { headers: this.getHeaders() });
  }

  // Get single role by ID
  getRoleById(roleId: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/api/roles/${roleId}`, {
      headers: this.getHeaders(),
    });
  }

  // Bulk update role positions (for reordering)
  updateRolePositions(roleUpdates: { id: number; position: number }[]): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/api/roles/bulk-position-update`,
      { roleUpdates },
      { headers: this.getHeaders() }
    );
  } 

  //API for region 
// ================= Region API =================

// Get All Regions
fetchAllRegions() {
  return this.http.get(
    `${this.apiUrl}/api/regions`,
    { headers: this.getHeaders() }
  );
}

// Create Region
createRegion(region: any) {
  return this.http.post(
    `${this.apiUrl}/api/regions`,
    region,
    { headers: this.getHeaders() }
  );
}

// Delete Region
deleteRegion(id: number) {
  return this.http.delete(
    `${this.apiUrl}/api/regions/${id}`,
    { headers: this.getHeaders() }
  );
}


// ================= ZONE =================

// Get All Zones
fetchAllZones() {
  return this.http.get(
    `${this.apiUrl}/api/zones`,
    { headers: this.getHeaders() }
  );
}

// Create Zone
createZone(zone: any) {
  return this.http.post(
    `${this.apiUrl}/api/zones`,
    zone,
    { headers: this.getHeaders() }
  );
}

// Delete Zone
deleteZone(id: number) {
  return this.http.delete(
    `${this.apiUrl}/api/zones/${id}`,
    { headers: this.getHeaders() }
  );
}

// Get Zones By Region
fetchZonesByRegion(regionId: number) {
  return this.http.get(
    `${this.apiUrl}/api/zones/region/${regionId}`,
    { headers: this.getHeaders() }
  );
}


// Adding circle Api 

// createCircle(data: any) {
//   return this.http.post(
//     `${this.apiUrl}/circle/create`,
//     data
//   );
// }

// fetchAllCircles() {
//   return this.http.get(
//     `${this.apiUrl}/circle`
//   );
// }  

createCircle(data: any) {
  return this.http.post(
    `${this.apiUrl}/api/circle/create`,
    data
  );
}

fetchAllCircles() {
  return this.http.get(
    `${this.apiUrl}/api/circle`
  );
}



 
// fetchCirclesByZone(zoneId: number) {
//   return this.http.get(
//     `${this.apiUrl}/circle/zone/${zoneId}`
//   );
// } 
fetchCirclesByZone(zoneId: number) {
  return this.http.get(
    `${this.apiUrl}/api/circle/zone/${zoneId}`
  );
}



//configuration 

getHeadOfficeConfiguration(headOfficeId: number) {

    return this.http.get(
        `${this.apiUrl}/api/head-office/configuration/${headOfficeId}`,
        {
            headers: this.getHeaders()
        }
    );

} 

//fetchbranchesbyheadoffice
// getBranchesByHeadOffice(headOfficeId: number) {
//   return this.http.get<any[]>(
//     `${this.apiUrl}/api/branches/head-office/${headOfficeId}/branches`,
//     {
//       headers: this.getHeaders(),
//     }
//   );
// }
 
getBranchesByHeadOffice(headOfficeId: number): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}/api/branches/head-office/${headOfficeId}/branches`,
    {
      headers: this.getHeaders(),
    }
  );
}



//Head-office update 
updateHeadOffice(id: number, data: any) {
  return this.http.put(
    `${this.apiUrl}/api/head-office/${id}`,
    data,
    {
      headers: this.getHeaders()
    }
  );
}

//delet api for head_office 
deleteHeadOffice(id: number) {
  return this.http.delete(
    `${this.apiUrl}/api/head-office/${id}`,
    {
      headers: this.getHeaders()
    }
  );
}

//method to  update region 
updateRegion(id: number, data: any) {

  return this.http.put(

    `${this.apiUrl}/api/regions/${id}`,

    data,

    {

      headers: this.getHeaders()

    }

  );

}

//update zone 
updateZone(id: number, data: any) {
  return this.http.put(
    `${this.apiUrl}/api/zones/${id}`,
    data,
    {
      headers: this.getHeaders()
    }
  );
}


//method for getting empoyees by role 
fetchAllRoles() {
  return this.http.get(`${this.apiUrl}/api/roles`, {
    headers: this.getHeaders(),
  });
}

//method for getting the employee count by using head_office_id 
getByHeadOfficeEmployeeCount(headOfficeId: number) {
  return this.http.get(
    `${this.apiUrl}/api/employees/getByHeadOfficeEmployeeCount/${headOfficeId}`,
    {
      headers: this.getHeaders(),
    }
  );
}


//Commitee Method 
// ================= COMMITTEE API =================

// Get All Committees
fetchAllCommittees() {
  return this.http.get(
    `${this.apiUrl}/api/committee`,
    { headers: this.getHeaders() }
  );
}

// Create Committee
createCommittee(data: any) {
  return this.http.post(
    `${this.apiUrl}/api/committee/create`,
    data,
    { headers: this.getHeaders() }
  );
}

// Get Committee By Id
getCommitteeById(id: number) {
  return this.http.get(
    `${this.apiUrl}/api/committee/${id}`,
    { headers: this.getHeaders() }
  );
}

// Update Committee
updateCommittee(id: number, data: any) {
  return this.http.put(
    `${this.apiUrl}/api/committee/${id}`,
    data,
    { headers: this.getHeaders() }
  );
}

// Delete Committee
deleteCommittee(id: number) {
  return this.http.delete(
    `${this.apiUrl}/api/committee/${id}`,
    { headers: this.getHeaders() }
  );
}

//Assign_employee methods 
// Add Employee to Committee
addCommitteeMember(data: any) {
  return this.http.post(
    `${this.apiUrl}/api/committee/member`,
    data,
    {
      headers: this.getHeaders()
    }
  );
}

// Get Committee Members
getCommitteeMembers(id: number) {
  return this.http.get(
    `${this.apiUrl}/api/committee/${id}/members`,
    {
      headers: this.getHeaders()
    }
  );
}

// Get only employees whose designation is allowed for this committee.
getEligibleCommitteeEmployees(id: number) {
  return this.http.get(
    `${this.apiUrl}/api/committee/${id}/eligible-employees`,
    { headers: this.getHeaders() }
  );
}

// Remove Committee Member
removeCommitteeMember(id: number) {
  return this.http.delete(
    `${this.apiUrl}/api/committee/member/${id}`,
    {
      headers: this.getHeaders()
    }
  );
}

//method for getting commitee in dropdown 
getAllCommittees(){

return this.http.get<any[]>(
`${this.apiUrl}/api/committee`
);

}

getActiveMemberTypes() {
  return this.http.get(
    `${this.apiUrl}/api/member-types/active`,
    { headers: this.getHeaders() }
  );
}


// Upload Excel file and assign employees to committee
uploadCommitteeMembersExcel(formData: FormData) {
  return this.http.post(
    `${this.apiUrl}/api/committee/upload-excel`,
    formData,
    {
      headers: new HttpHeaders({
        Authorization: this.token ? `Bearer ${this.token}` : ''
      })
    }
  );
}


getDepartmentsForHeadOfficeAdmin(headOfficeId: number) {
  return this.http.get<any[]>(
    `${this.apiUrl}/api/departments/head-office/${headOfficeId}`,
    {
      headers: this.getHeaders(),
    }
  );
}





}  


