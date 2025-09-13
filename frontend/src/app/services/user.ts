import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class User {
  
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}
   getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

 createUser(data: { username: string, email: string }) {
  return this.http.post(`${environment.apiUrl}/api/users`, data);
}
}
