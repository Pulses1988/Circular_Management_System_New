import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  text: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class Toast {
   private toastSubject = new Subject<ToastMessage>();
  toastState$ = this.toastSubject.asObservable();

  show(text: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastSubject.next({ text, type });
  }
}
