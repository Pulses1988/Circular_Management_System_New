import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class CircularService {
  private apiUrl = environment.apiUrl;
  private socket!: Socket;
  private socketInitialized = false;
  private currentEmployeeSubject = new BehaviorSubject<any>(null);
  private readonly USER_KEY = 'emp_user';
  private readonly TOKEN_KEY = 'emp_token';
  private readonly EXPIRY_KEY = 'emp_token_expiry';
  private newCircularSubject = new Subject<any>();
  private statusUpdateSubject = new Subject<any>();

  // Observables for components to subscribe
  public newCircular$ = this.newCircularSubject.asObservable();
  public statusUpdate$ = this.statusUpdateSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}
  token!: string | null;

  private initializeSocket() {
    if (this.socketInitialized) {
      console.log('Socket already initialized, skipping...');
      return;
    }

    console.log('Initializing WebSocket connection...');
    this.socket = io(this.apiUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
    });

    this.socket.on('subscription-confirmed', (data) => {
      console.log('Subscription confirmed:', data);
    });

    this.socket.on('new-circular-assigned', (data) => {
      console.log('New circular received:', data);
      this.newCircularSubject.next(data);
    });

    this.socket.on('circular-status-updated', (data) => {
      console.log('Circular status updated:', data);
      this.statusUpdateSubject.next(data);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socketInitialized = true;
  }

  subscribeToCircularUpdates(approver_id: number) {
    if (!this.socketInitialized) {
      this.initializeSocket();
    }

    const trySubscribe = () => {
      if (this.socket && this.socket.connected) {
        console.log('Subscribing to updates for approver:', approver_id);
        this.socket.emit('subscribe-circulars', approver_id);
      } else {
        console.log('Socket not ready, retrying in 500ms...');
        setTimeout(trySubscribe, 500);
      }
    };

    trySubscribe();
  }

  unsubscribeFromCircularUpdates() {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
      this.socketInitialized = false;
    }
  }

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
  private getHeadersForAdmin(): HttpHeaders {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
    // Adjust based on your auth implementation
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.token ? `Bearer ${this.token}` : '',
    });
  }

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;

    try {
      const encryptedToken = localStorage.getItem(this.TOKEN_KEY);
      if (encryptedToken && !this.isTokenExpired()) {
        return this.decryptData(encryptedToken);
      }
    } catch (error) {
      this.logout();
    }
    return null;
  }

  logout(): void {
    if (!this.isBrowser()) return;

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }

    this.currentEmployeeSubject.next(null);
    this.router.navigate(['/employee-login']);
  }

  isTokenExpired(): boolean {
    if (!this.isBrowser()) return true;

    const expiryTime = localStorage.getItem(this.EXPIRY_KEY);
    if (!expiryTime) return true;

    return new Date().getTime() > parseInt(expiryTime);
  }

  private decryptData(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch (error) {
      return '';
    }
  }
  // ---------------------------------Circular Approval--------------------------------------------------
  uploadCircular(formdata: FormData): Observable<any> {
    let headers = new HttpHeaders();

    // Only set Authorization, do NOT set Content-Type
    if (this.token) {
      headers = headers.set('Authorization', `Bearer ${this.token}`);
    }
    return this.http.post(`${this.apiUrl}/api/circular/upload`, formdata, { headers });
  }

  getAllCircular() {
    return this.http.get(`${this.apiUrl}/api/circular/`, { headers: this.getHeaders() });
  }
  getAssingedCircularForApproval(approver_id: number) {
    return this.http.get(`${this.apiUrl}/api/circular-approvals/${approver_id}/assigned`, {
      headers: this.getHeaders(),
    });
  }
  getCircularById(id: number) {
    return this.http.get(`${this.apiUrl}/api/circular/${id}`, { headers: this.getHeaders() });
  }

  // Mark circular as seen
  markCircularAsSeen(circularId: number, approverId: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/api/circular-approvals/${circularId}/${approverId}/mark-seen`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Approve circular
  approveCircular(circularId: number, approverId: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/api/circular-approvals/${circularId}/${approverId}/approve`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Reject circular with comment
  rejectCircular(circularId: number, approverId: number, comments: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/api/circular-approvals/${circularId}/${approverId}/reject`,
      { comments },
      { headers: this.getHeaders() }
    );
  }
  getCircularApprovalDataById(approver_id: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/api/circular-approvals/${approver_id}/get-circular-by-emp`,
      { headers: this.getHeaders() }
    );
  }

  // -----------------------circular rejection-----------------------------------

  getCircularByCreaterId(createrId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/circular/creator/${createrId}`, {
      headers: this.getHeaders(),
    });
  }

  // ----------------------Source Type---------------------------------
  getSourceTypes() {
    return this.http.get(`${this.apiUrl}/api/source-type/`, { headers: this.getHeaders() });
  }

  // -----------------------repeat cycle Data--------------------------------
  getReapetCycleDataForEmployee() {
    return this.http.get(`${this.apiUrl}/api/repeat-cycle/`, { headers: this.getHeaders() });
  }
  getSourceTypesForAdmin() {
    return this.http.get(`${this.apiUrl}/api/source-type/`, { headers: this.getHeadersForAdmin() });
  }

  addSourceType(name: any) {
    return this.http.post(`${this.apiUrl}/api/source-type/`, name, {
      headers: this.getHeadersForAdmin(),
    });
  }
  updateSourceType(id: number, name: any) {
    return this.http.put(`${this.apiUrl}/api/source-type/${id}`, name, {
      headers: this.getHeadersForAdmin(),
    });
  }

  // -----------------------------------------Repeat Cycle-----------------------------------------------------
  // Get all repeat cycles
  getRepeatCycles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/repeat-cycle/`, {
      headers: this.getHeadersForAdmin(),
    });
  }

  // Add a new repeat cycle
  addRepeatCycle(data: { name: string; duration_days: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/repeat-cycle`, data, {
      headers: this.getHeadersForAdmin(),
    });
  }

  // Update a repeat cycle
  updateRepeatCycle(id: number, data: { name: string; duration_days: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/repeat-cycle/${id}`, data, {
      headers: this.getHeadersForAdmin(),
    });
  }

  // Delete a repeat cycle (optional - if you want to add delete functionality later)
  deleteRepeatCycle(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/repeat-cycle/${id}`, {
      headers: this.getHeadersForAdmin(),
    });
  }


  // ---------------------------------------------------Circular API for employee---------------------------------------------

  fetchCircularAssignToEmpById(id:number){
    return this.http.get(`${this.apiUrl}/api/circular-visibility/employee/${id}`,{headers:this.getHeaders()});
  }

  fetchUnseenCircularsByEmpId(id:number){
    return this.http.get(`${this.apiUrl}/api/circular-tracking/unseen/${id}`,{headers: this.getHeaders()});
  }
  fetchSeenCircularsByEmpId(id:number){
    return this.http.get(`${this.apiUrl}/api/circular-tracking/seen/${id}`,{headers: this.getHeaders()});
  }

 markCircularAsSeenForEmp(data: { circularId: number; employeeId: number }) {
  return this.http.post(`${this.apiUrl}/api/circular-tracking/mark-seen`, data, {
    headers: this.getHeaders(),
  });
}

  fetchAllCircularsWithTrackingDetailsByEmpId(id:number){
    return this.http.get(`${this.apiUrl}/api/circular/all/${id}`,{headers:this.getHeaders()})
  }

  fetchCircularDetailsById(circular_id:number){
    return this.http.get(`${this.apiUrl}/api/circular/circular/${circular_id}`,{headers:this.getHeaders()});
  }

  // --------------------------------------Chat API---------------------------------------

  sendChatForCircular(data:{circular_id:number;employee_id:number;message:string}){
    return this.http.post(`${this.apiUrl}/api/circular-chats/`,data, {headers:this.getHeaders()});
  }
}
