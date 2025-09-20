import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-employee-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './employee-login.html',
  styleUrl: './employee-login.scss'
})
export class EmployeeLogin {

 loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      employeeId: ['', [Validators.required,]],
      password: ['', [Validators.required,]]
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { employeeId, password } = this.loginForm.value;
      
      // Simulate API call
      setTimeout(() => {
        // Replace with actual authentication service call
        if (this.authenticateEmployee(employeeId, password)) {
          this.snackBar.open('Login successful!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/employee-dashboard']);
        } else {
          this.snackBar.open('Invalid credentials. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
        this.isLoading = false;
      }, 2000);
    } else {
      this.markFormGroupTouched();
    }
  }

  private authenticateEmployee(employeeId: string, password: string): boolean {
    // Replace with actual authentication logic
    return employeeId === 'EMP001' && password === 'password123';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  redirectToAdminLogin(): void {
    this.router.navigate(['/admin-login']);
  }

  getEmployeeIdErrorMessage(): string {
    const control = this.loginForm.get('employeeId');
    if (control?.hasError('required')) {
      return 'Employee ID is required';
    }
    if (control?.hasError('minlength')) {
      return 'Employee ID must be at least 6 characters';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const control = this.loginForm.get('password');
    if (control?.hasError('required')) {
      return 'Password is required';
    }
    if (control?.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    return '';
  }
}
