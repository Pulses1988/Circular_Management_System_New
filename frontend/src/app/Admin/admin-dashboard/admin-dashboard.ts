import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Toast } from '../../toast/toast';
import { User } from '../../services/user';

@Component({
  selector: 'app-admin-dashboard',
  imports: [MatIconModule,CommonModule,NgIf,FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard {
    isHoAdmin:boolean=false; // Dynamically set based on login or user data
  totalDepartments = 0;
  totalBranches = 0;
  totalEmployees = 150;
    showHeadOfficeForm = false;

  headOffice = {
    name: 'Head Office',
    bank_name: '',
    address: ''
  };
  constructor(private toast:Toast, private user:User){}
  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
    this.isHoAdmin='HO_ADMIN'===localStorage!.getItem('role');
    }
    this.fetchCounts();
  }
  toggleHeadOfficeForm() {
    this.showHeadOfficeForm = !this.showHeadOfficeForm;
  }
  fetchCounts() {
    if (typeof window !== 'undefined' && window.localStorage) {
    const assignment = JSON.parse(localStorage.getItem('userAssignment') || '{}');
    const id = Number(assignment.id);

    // Fetch departments count
    if (assignment.type === 'head_office') {
      this.user.getDepartmentCountByHeadOffice(id).subscribe({
        next: (res: any) => {
          this.totalDepartments = res.count;
        },
        error: () => {
          this.toast.show('Failed to fetch department count', 'error');
        }
      });
      this.user.getBranchCountByHeadOfficeId(id).subscribe({
        next:(res:any)=>{
          this.totalBranches=res.count;
          console.log(res,'branch count')
        },
        error: () => {
          this.toast.show('Failed to fetch Branch count', 'error');
        }
      })
    } else {
      this.user.getDepartmentCountByBranch(id).subscribe({
        next: (res: any) => {
          this.totalDepartments = res.count;
        },
        error: () => {
          this.toast.show('Failed to fetch department count', 'error');
        }
      });
    }

    // Fetch other counts as needed...
    // this.user.getTotalBranches().subscribe({
    //   next: (res: any) => {
    //     this.totalBranches = res.count;
    //   }
    // });

    // this.user.getTotalEmployees().subscribe({
    //   next: (res: any) => {
    //     this.totalEmployees = res.count;
    //   }
    // });
  }
  }
 addHeadOffice() {
    if (!this.headOffice.name.trim() || this.headOffice.bank_name.trim() || !this.headOffice.address.trim()) {
      this.toast.show('Please fill in all fields', 'error');
      return;
    }

    this.user.addHeadOffice(this.headOffice).subscribe({
      next: () => {
        this.toast.show('Head office added successfully!', 'success');
        this.headOffice = { name: '', bank_name:'', address: '' };
        this.showHeadOfficeForm = false;
        this.fetchCounts(); // Refresh counts
      },
      error: () => {
        this.toast.show('Failed to add head office', 'error');
      }
    });
  }
}
