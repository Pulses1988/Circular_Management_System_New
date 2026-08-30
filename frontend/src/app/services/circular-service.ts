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

  private newChatMessageSubject = new Subject<any>();
public newChatMessage$ = this.newChatMessageSubject.asObservable();

private newNotificationSubject = new Subject<any>();
public newNotification$ = this.newNotificationSubject.asObservable();

 private notificationSound!: HTMLAudioElement;

  constructor(private http: HttpClient, private router: Router) {
     if (this.isBrowser()) {
      this.initializeNotificationSound();
    }
  }
  token!: string | null;

  private initializeSocket() {
    if (this.socketInitialized) {
      console.log('Socket already initialized, skipping...');
      return;
    }

    console.log('Initializing WebSocket connection...');
    this.socket = io(this.apiUrl, {
      transports: ['polling','websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    autoConnect: true,
    withCredentials: true
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

     this.socket.on('new-chat-message', (data) => {
    console.log('New chat message received:', data);
    this.newChatMessageSubject.next(data);
  });

  this.socket.on('new-notification', (data) => {
  console.log('New notification received:', data);
  this.newNotificationSubject.next(data);
  this.playNotificationSound();
});

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socketInitialized = true;
  }

  joinCircularChatRoom(circular_id: number) {
  if (!this.socketInitialized) {
    this.initializeSocket();
  }

  const joinRoom = () => {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join-circular-chat', circular_id);
      console.log(`✅ Joined circular chat room: ${circular_id}`);
    } else {
      console.log('⏳ Socket not ready, retrying...');
      setTimeout(joinRoom, 500);
    }
  };

  joinRoom();
}

leaveCircularChatRoom(circular_id: number) {
  if (this.socket && this.socket.connected) {
    this.socket.emit('leave-circular-chat', circular_id);
    console.log(`❌ Left circular chat room: ${circular_id}`);
  }
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

  subscribeToNotifications(employee_id: number) {
  if (!this.socketInitialized) {
    this.initializeSocket();
  }
  
  const trySubscribe = () => {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe-notifications', employee_id);
      console.log(`Subscribed to notifications for employee: ${employee_id}`);
    } else {
      setTimeout(trySubscribe, 500);
    }
  };
  
  trySubscribe();
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

 private initializeNotificationSound() {
    if (this.isBrowser()) {
      this.notificationSound = new Audio();
      this.notificationSound.src = 'sounds/notification-sound.mp3';
      this.notificationSound.volume = 1;
      this.notificationSound.load();
    }
  }

  playNotificationSound() {
    if (this.isBrowser() && this.notificationSound) {
      this.notificationSound.currentTime = 0;
      this.notificationSound.play().catch(err => console.log("Audio play error:", err));
      this.notificationSound.play().catch(error => {
        console.warn('Audio play failed:', error);
      });
    }
  }

  onNewMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket?.on('new-chat-message', (data) => {
        this.playNotificationSound();
        observer.next(data);
      });
    });
  }

  disconnectSocket() {
    this.socket?.disconnect();
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

  // ---------------------Get All Approved Circulars-----------------------
  getAllApprovedCirculars() {
    return this.http.get(`${this.apiUrl}/api/circular/getAllApprovedCirculars`, {
      headers: this.getHeaders(),
    });
  }

  // ----------------------circular delete ------------------------
  deleteCircular(circuarId: number) {
    return this.http.delete(`${this.apiUrl}/api/circular/${circuarId}`, {
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

  fetchCircularAssignToEmpById(id: number) {
    return this.http.get(`${this.apiUrl}/api/circular-visibility/employee/${id}`, {
      headers: this.getHeaders(),
    });
  }

  fetchUnseenCircularsByEmpId(id: number) {
    return this.http.get(`${this.apiUrl}/api/circular-tracking/unseen/${id}`, {
      headers: this.getHeaders(),
    });
  }
  fetchSeenCircularsByEmpId(id: number) {
    return this.http.get(`${this.apiUrl}/api/circular-tracking/seen/${id}`, {
      headers: this.getHeaders(),
    });
  } 

// ================= Reading History Statistics =================
getStatistics(employeeId: number) {
  return this.http.get(
    `${this.apiUrl}/api/circular-tracking/statistics/${employeeId}`,
    {
      headers: this.getHeaders(),
    }
  );
}




 markCircularAsSeenForEmp(data: { circularId: number; employeeId: number }) {
  return this.http.post(`${this.apiUrl}/api/circular-tracking/mark-seen`, data, {
    headers: this.getHeaders(),
  });
}

markCircularAsCompleted(data: { circularId: number; employeeId: number }): Observable<any> {
  return this.http.post(`${this.apiUrl}/api/circular-tracking/mark-completed`, data, {
    headers: this.getHeaders(),
  });
}

getCircularCompletionStatus(circularId: number, employeeId: number): Observable<any> {
  return this.http.get(
    `${this.apiUrl}/api/circular-tracking/completion-status/${circularId}/${employeeId}`,
    { headers: this.getHeaders() }
  );
}

  fetchAllCircularsWithTrackingDetailsByEmpId(id: number) {
    return this.http.get(`${this.apiUrl}/api/circular/all/${id}`, { headers: this.getHeaders() });
  }

  fetchCircularDetailsById(circular_id: number) {
    return this.http.get(`${this.apiUrl}/api/circular/circular/${circular_id}`, {
      headers: this.getHeaders(),
    });
  }

  getCircularActivitySummary(circular_id: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/api/circular/activity-summary/${circular_id}`, {
    headers: this.getHeaders()
  });
}

  // --------------------------------------Chat API---------------------------------------

  sendChatForCircular(data:{circular_id:number;employee_id:number;message:string}){
    return this.http.post(`${this.apiUrl}/api/circular-chats/`,data, {headers:this.getHeaders()});
  }

  sendSystemMessage(data: { circular_id: number; employee_id: number; action_type: string }): Observable<any> {
  return this.http.post(`${this.apiUrl}/api/circular-chats/system-message`, data, {
    headers: this.getHeaders()
  });
}


  //-------------------------------------------Attachments---------------------------------------------------

  uploadAttachment(circular_id: number, employee_id: number | undefined, file: File, chat_id?: number): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('circular_id', circular_id.toString());
  formData.append('employee_id', employee_id!.toString());
  if (chat_id) {
    formData.append('chat_id', chat_id.toString());
  }

  return this.http.post(`${this.apiUrl}/api/circular-attachments/upload`, formData);
}

downloadAttachment(attachment_id: number): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/api/circular-attachments/${attachment_id}`, {
    responseType: 'blob'
  });
}
getAttachmentsByCircular(circular_id: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/api/circular-attachments/circular/${circular_id}`, {headers:this.getHeaders()});
}

onNewAttachment(): Observable<any> {
  return new Observable(observer => {
    this.socket?.on('new-attachment-uploaded', (data) => {
      observer.next(data);
    });
  });
}

// ------------------------------------------------------Notification-------------------------------------

getUnreadNotifications(employee_id: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/api/notifications/${employee_id}/unread`, {
    headers: this.getHeaders()
  });
}

getUnreadCount(employee_id: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/api/notifications/${employee_id}/count`, {
    headers: this.getHeaders()
  });
}

markNotificationAsRead(notification_id: number): Observable<any> {
  return this.http.put(`${this.apiUrl}/api/notifications/${notification_id}/read`, {}, {
    headers: this.getHeaders()
  });
}

markAllNotificationsAsRead(employee_id: number): Observable<any> {
  return this.http.put(`${this.apiUrl}/api/notifications/${employee_id}/read-all`, {}, {
    headers: this.getHeaders()
  });
}

// --------------------------------------------------Circular Complition----------------------------------------------------

completeCircularWithDetails(data: {
  circular_id: number;
  completed_by_employee_id: number;
  reference_number: string;
  submission_mode: string;
  completion_notes?: string;
}): Observable<any> {
  return this.http.post(`${this.apiUrl}/api/circular-completion/complete`, data, {
    headers: this.getHeaders()
  });
}

getCircularCompletionDetails(circular_id: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/api/circular-completion/${circular_id}`, {
    headers: this.getHeaders()
  });
}

// ---------------------------------------------------------Circular Recurrence---------------------------------------
completeCycleAndRenew(data: {
  circular_id: number;
  completed_by_employee_id: number;
  reference_number: string;
  submission_mode: string;
  completion_notes?: string;
}): Observable<any> {
  return this.http.post(`${this.apiUrl}/api/circular-recurrence/complete-and-renew`, data, {
    headers: this.getHeaders()
  });
}

getRecurrenceHistory(circular_id: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/api/circular-recurrence/history/${circular_id}`, {
    headers: this.getHeaders()
  });
} 

//Maximum Approver
// Maximum Approver
getMaxApprovers(): Observable<any> {
  return this.http.get(
    `${this.apiUrl}/api/settings/max-approvers`,
    { headers: this.getHeaders() }
  );
}

updateMaxApprovers(maxApprovers: number): Observable<any> {
  return this.http.put(
    `${this.apiUrl}/api/settings/max-approvers`,
    { maxApprovers },
    { headers: this.getHeaders() }
  );
}



//APi for mark_as_completed

creatorMarkCompleted(circularId: number): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/api/circular/creator-mark-completed`,
    {
      circularId
    },
    {
      headers: this.getHeaders()
    }
  );
}  




//api for event log
getEventLogs() {
  return this.http.get(`${this.apiUrl}/api/event-master`);
}

// Event Execution History
getRuleExecutions(): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl}/api/rule-executions`,
    {
      headers: this.getHeaders()
    }
  );
}

//Api for Load higher Authority

getAssignedCirculars(employeeId: number) {
  return this.http.get<any>(
    `${this.apiUrl}/api/higher-authority/pending/${employeeId}`,
    {
      headers: this.getHeaders()
    }
  );
}   


//Api for branch and head office 




// getBranchesByHeadOfficeId(headOfficeId: number) {
//   return this.http.get(
//     `${this.apiUrl}/api/branches/head-office/${headOfficeId}/branches`
//   );
// }



}
