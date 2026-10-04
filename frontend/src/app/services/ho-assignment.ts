
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HoAssignmentService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // =========================================================
  // Get Authentication Headers
  // =========================================================

  private getHeaders(): HttpHeaders {
    let token: string | null = null;

    if (typeof window !== 'undefined') {
      const encryptedToken = localStorage.getItem('emp_token');

      if (encryptedToken) {
        try {
          token = decodeURIComponent(atob(encryptedToken));
        } catch (error) {
          console.error('Error decoding employee token:', error);
        }
      }
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

// =========================================================
// Get Source Types
// =========================================================

getSourceTypes(): Observable<any> {
  return this.http.get(
    `${this.apiUrl}/api/source-type/`,
    { headers: this.getHeaders() }
  );
}


  // =========================================================
  // Create HO Assignment
  // // =========================================================

  // createHOAssignment(data: {
  //   title: string;
  //   description?: string;
  //   priority: string;
  //   due_date?: string | null;
  //   created_by: number;
  // }): Observable<any> {

  //   return this.http.post(
  //     `${this.apiUrl}/api/ho-assignments/create`,
  //     data,
  //     {
  //       headers: this.getHeaders(),
  //     }
  //   );
  // }  


createHOAssignment(data: {
  title: string;
  assignment_code: string;
  description?: string;
  priority: string;
  due_date?: string | null;
  created_by: number;
  employeeIds: number[];
}): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/api/ho-assignments/create`,
    data,
    { headers: this.getHeaders() }
  );
}


  // =========================================================
  // Get All HO Assignments
  // =========================================================

  getAllHOAssignments(): Observable<any> {

    return this.http.get(
      `${this.apiUrl}/api/ho-assignments/`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  // =========================================================
  // Get HO Assignment By ID
  // =========================================================

  getHOAssignmentById(id: number): Observable<any> {

    return this.http.get(
      `${this.apiUrl}/api/ho-assignments/${id}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  // =========================================================
  // Get HO Assignments By Employee ID
  // =========================================================

  getHOAssignmentsByEmployeeId(employeeId: number): Observable<any> {

    return this.http.get(
      `${this.apiUrl}/api/ho-assignments/employee/${employeeId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }  



markAssignmentAsSeen(
  assignmentId: number,
  employeeId: number
): Observable<any> {
  return this.http.put(
    `${this.apiUrl}/api/ho-assignments/mark-seen`,
    {
      assignment_id: assignmentId,
      employee_id: employeeId,
    },
    { headers: this.getHeaders() }
  );
}





}

