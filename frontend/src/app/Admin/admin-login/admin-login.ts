import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../services/user';
import { Router } from '@angular/router';
import { Toast } from '../../toast/toast';


@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule,FormsModule,MatIconModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss'
})
export class AdminLogin {

  constructor(private user:User,private router:Router, private toast:Toast){}

loginData = {
    username: '',
    password: ''
  };
   showPassword = false;
   togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      alert('Please fill all fields correctly.');
      return;
    }

    this.user.fetchAllAdmin().subscribe({
      next: (admins: any[]) => {
        const matchedAdmin = admins.find(admin =>
          admin.username === this.loginData.username &&
          admin.password === this.loginData.password // NOTE: In real apps, passwords should be hashed!
        );

        if (matchedAdmin) {
          this.toast.show('Login successful!','success');
          // You can store login state here if needed
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.toast.show('Invalid username or password.','error');
        }
      },
      error: (err) => {
        console.error('Error fetching admins:', err);
        alert('Something went wrong. Please try again.');
      }
    });
  }
private isFormValid(): boolean {
    return !!(
      this.loginData.username &&
      this.loginData.password &&
      this.loginData.password.length >= 6
    );
  }
}
