import { Component } from '@angular/core';
import { Toast, ToastMessage } from '../toast';
import { CommonModule, NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-toast-component',
  imports: [NgIf,CommonModule,NgClass],
  template: `
    <div *ngIf="toast" [ngClass]="getClass()" class="fixed top-4 right-4 p-4 rounded shadow-md transition-opacity duration-300">
      {{ toast!.text }}
    </div>
  `,
  styles: [`
    .toast-success { background-color: #4CAF50; color: white; }
    .toast-error { background-color: #F44336; color: white; }
    .toast-info { background-color: #2196F3; color: white; }
  `]
})
export class ToastComponent {
  toast: ToastMessage | null = null;
   constructor(private toastService: Toast) {}
   ngOnInit() {
    this.toastService.toastState$.subscribe(msg => {
      this.toast = msg;
      setTimeout(() => this.toast = null, 3000); // hide after 3 seconds
    });
  }
getClass() {
    return {
      'toast-success': this.toast?.type === 'success',
      'toast-error': this.toast?.type === 'error',
      'toast-info': this.toast?.type === 'info'
    };
  }
}
