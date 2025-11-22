import { Component } from '@angular/core';
import { ConfirmationConfig, Toast, ToastMessage } from '../toast';
import { CommonModule, NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-toast-component',
  imports: [NgIf, CommonModule, NgClass],
  template: `
    <div
      *ngIf="toast"
      [ngClass]="getClass()"
      class="fixed top-4 right-4 p-4 rounded shadow-md transition-opacity duration-300"
    >
      {{ toast!.text }}
    </div>

    <div
      *ngIf="showConfirmation"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div class="p-6">
          <p class="text-gray-600 mb-4">{{ confirmationConfig?.message }}</p>
          <div class="flex justify-end gap-3">
            <button
              (click)="onCancel()"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              {{ confirmationConfig?.cancelText || 'Cancel' }}
            </button>
            <button
              (click)="onConfirm()"
              [class]="getConfirmButtonClass()"
              class="px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              {{ confirmationConfig?.confirmText || 'OK' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-success {
        background-color: #4caf50;
        color: white;
      }
      .toast-error {
        background-color: #f44336;
        color: white;
      }
      .toast-info {
        background-color: #2196f3;
        color: white;
      }

      .btn-warning {
        background-color: #f59e0b;
        color: white;
      }
      .btn-warning:hover {
        background-color: #d97706;
      }

      .btn-danger {
        background-color: #ef4444;
        color: white;
      }
      .btn-danger:hover {
        background-color: #dc2626;
      }

      .btn-info {
        background-color: #3b82f6;
        color: white;
      }
      .btn-info:hover {
        background-color: #2563eb;
      }
    `,
  ],
})
export class ToastComponent {
  toast: ToastMessage | null = null;

  showConfirmation = false;
  confirmationConfig: ConfirmationConfig | null = null;
  private confirmationCallback: ((confirmed: boolean) => void) | null = null;

  constructor(private toastService: Toast) {}
  ngOnInit() {
    this.toastService.toastState$.subscribe((msg) => {
      this.toast = msg;
      setTimeout(() => (this.toast = null), 3000); // hide after 3 seconds
    });

    this.toastService.confirmationState$.subscribe(({ config, callback }) => {
      this.confirmationConfig = config;
      this.confirmationCallback = callback;
      this.showConfirmation = true;
    });
  }
  getClass() {
    return {
      'toast-success': this.toast?.type === 'success',
      'toast-error': this.toast?.type === 'error',
      'toast-info': this.toast?.type === 'info',
    };
  }

  getConfirmButtonClass(): string {
    switch (this.confirmationConfig?.type) {
      case 'warning':
        return 'btn-warning';
      case 'danger':
        return 'btn-danger';
      case 'info':
        return 'btn-info';
      default:
        return 'btn-info';
    }
  }

  onConfirm(): void {
    if (this.confirmationCallback) {
      this.confirmationCallback(true);
    }
    this.resetConfirmation();
  }

  onCancel(): void {
    if (this.confirmationCallback) {
      this.confirmationCallback(false);
    }
    this.resetConfirmation();
  }

  private resetConfirmation(): void {
    this.showConfirmation = false;
    this.confirmationConfig = null;
    this.confirmationCallback = null;
  }
}
