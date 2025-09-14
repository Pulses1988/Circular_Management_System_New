import { Component, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../services/user';
import { Toast } from '../../toast/toast';


@Component({
  selector: 'app-admin-signup',
  standalone: true,
  imports: [RouterModule,FormsModule,MatIconModule,CommonModule],
  templateUrl: './admin-signup.html',
  styleUrl: './admin-signup.scss'
})
export class AdminSignup {
  admin = {
    username: '',
    first_name: '',
    middle_name:'',
    last_name: '',
    email: '',
    password: '',
    admin_type:''
  };

  showPassword = false;
  availableAdminTypes: {value: string, label: string}[] = [];
  @ViewChild('signupForm') signupForm!: NgForm;


  constructor(private user:User,private toast:Toast) { }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  ngOnInit() { 
    this.user.fetchAllAdmin().subscribe((res: any) => {
      console.log(res, 'admin Data');
      this.setAvailableAdminTypes(res);
    });
  }
  private setAvailableAdminTypes(adminData: any[]): void {
    const hasHOAdmin = adminData.some(admin => admin.admin_type === 'HO_ADMIN');
    
    if (hasHOAdmin) {
      // If HO_ADMIN exists, show both options
      this.availableAdminTypes = [
        { value: 'HO_ADMIN', label: 'HO Admin' },
        { value: 'BRANCH_ADMIN', label: 'Branch Admin' }
      ];
    } else {
      // If no HO_ADMIN exists, show only HO_ADMIN option
      this.availableAdminTypes = [
        { value: 'HO_ADMIN', label: 'HO Admin' }
      ];
    }
  }

 onSubmit(): void {
    if (this.isFormValid()) {
      this.user.createAdmin(this.admin).subscribe({
        next: (res) => {
          this.toast.show('Admin account created successfully!', 'success');
          this.resetForm();
        },
        error: (err) => {
          this.toast.show('Failed to create admin account.', 'error');
          console.error('Error creating admin:', err);
        }
      });
    } else {
      this.toast.show('Please fill all required fields.', 'info');
    }
  }

  private isFormValid(): boolean {
    return !!(
      this.admin.username &&
      this.admin.first_name &&
      this.admin.email &&
      this.admin.password
    );
  }
  private resetForm(): void {
   this.signupForm.resetForm();
  }
}
