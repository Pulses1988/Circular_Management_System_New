import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../services/user';
import { ActivatedRoute, Router } from '@angular/router';
import { Toast } from '../../toast/toast';
import { AdminAuth } from '../../services/admin-auth';


@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule,FormsModule,MatIconModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss'
})
export class AdminLogin {

  constructor(private user:User,private router:Router, private toast:Toast, private auth:AdminAuth, private route: ActivatedRoute){}

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/admin/admin-dashboard']);
      return;
    }

    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
    // If no return URL in query params, check session storage
    if (!this.returnUrl) {
      this.returnUrl = this.auth.getRedirectUrl() || '';
    }
  }

loginData = {
    username: '',
    password: ''
  };
   showPassword = false;
   loading = false;
   returnUrl = '';
   togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginData.username && this.loginData.password) {
      this.loading = true;
    this.auth.loginAdmin(this.loginData).subscribe({
      next: (res: any) => {
        localStorage.setItem('authToken', res.token);
        localStorage.setItem('role',res.admin.admin_type);
        const assignment = {
  type: res.admin.head_office_id ? 'head_office' : 'branch',
  id: res.admin.head_office_id || res.admin.branch_id
};
localStorage.setItem('userAssignment', JSON.stringify(assignment));
        this.toast.show('Login successful!', 'success');
        // this.router.navigate(['/admin-dashboard']);
        this.loading = false;
        setTimeout(() => {
        const redirectUrl = this.returnUrl || '/admin/admin-dashboard';
        this.router.navigateByUrl(redirectUrl);
      }, 100);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.toast.show('Invalid username or password.', 'error');
      }
    });
  } else if (!this.isFormValid()) {
    this.toast.show('Please fill all fields.', 'error');
  }
  }
private isFormValid(): boolean {
    return !!(
      this.loginData.username &&
      this.loginData.password &&
      this.loginData.password.length >= 6
    );
  }
}
