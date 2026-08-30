import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../services/employee-service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {

  forgotForm: FormGroup;
  otpForm: FormGroup;
  resetForm: FormGroup;

  loading = false;

  showOtpPopup = false;
  showResetPopup = false;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router
  ) {

    // Forgot Password Form
    this.forgotForm = this.fb.group({
      employee_id: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    // OTP Form
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Reset Password Form
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });

  }

  // =====================================
  // SEND OTP
  // =====================================

  sendOtp() {

    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.employeeService
      .forgotPassword(this.forgotForm.value)
      .subscribe({

        next: (res: any) => {

          this.loading = false;

          alert(res.message);

          // Open OTP Popup
          this.showOtpPopup = true;

        },

        error: (err) => {

          this.loading = false;

          alert(err.error?.message || 'Failed to send OTP');

        }

      });

  }

  // =====================================
  // VERIFY OTP
  // =====================================

  verifyOtp() {

    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const body = {

      employee_id: this.forgotForm.value.employee_id,

      otp: this.otpForm.value.otp

    };

    this.employeeService.verifyOtp(body)
      .subscribe({

        next: (res: any) => {

          this.loading = false;

          alert(res.message);

          // Close OTP popup
          this.showOtpPopup = false;

          // Open Reset Password Popup
          this.showResetPopup = true;

        },

        error: (err) => {

          this.loading = false;

          alert(err.error?.message || 'Invalid OTP');

        }

      });

  }

  // =====================================
  // RESET PASSWORD
  // =====================================

  resetPassword() {

    if (this.resetForm.invalid) {

      this.resetForm.markAllAsTouched();

      return;

    }

    if (
      this.resetForm.value.newPassword !==
      this.resetForm.value.confirmPassword
    ) {

      alert("Passwords do not match");

      return;

    }

    this.loading = true;

    const body = {

      employee_id: this.forgotForm.value.employee_id,

      newPassword: this.resetForm.value.newPassword

    };

    this.employeeService
      .resetPassword(body)
      .subscribe({

        next: (res: any) => {

          this.loading = false;

          alert(res.message);

          this.showResetPopup = false;

          // Redirect to Login

          this.router.navigate(['/employee-login']);

        },

        error: (err) => {

          this.loading = false;

          alert(err.error?.message || 'Unable to reset password');

        }

      });

  } 

    goToLogin() {
    this.router.navigate(['/employee/employee-login']);
  }

}