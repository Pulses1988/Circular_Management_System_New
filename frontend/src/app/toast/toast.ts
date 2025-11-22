import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ToastMessage {
  text: string;
  type: 'success' | 'error' | 'info';
}

export interface ConfirmationConfig {
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class Toast {
  private toastSubject = new Subject<ToastMessage>();
  toastState$ = this.toastSubject.asObservable();

  private confirmationSubject = new Subject<{
    config: ConfirmationConfig;
    callback: (confirmed: boolean) => void;
  }>();
  confirmationState$ = this.confirmationSubject.asObservable();

  // New confirmation method
  confirm(config: ConfirmationConfig): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      this.confirmationSubject.next({
        config,
        callback: (confirmed: boolean) => {
          observer.next(confirmed);
          observer.complete();
        },
      });
    });
  }

  show(text: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastSubject.next({ text, type });
  }
}
