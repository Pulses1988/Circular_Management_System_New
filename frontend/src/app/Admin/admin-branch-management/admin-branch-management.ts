import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { User } from '../../services/user';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { Toast } from '../../toast/toast';
import { MatIconModule } from '@angular/material/icon';
import { CreateBranchAdminForm } from '../Model/create-branch-admin-form/create-branch-admin-form';

@Component({
  selector: 'app-admin-branch-management',
  imports: [
    NgFor,
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    MatIconModule,
    FormsModule,
    CreateBranchAdminForm,
  ],
  templateUrl: './admin-branch-management.html',
  styleUrl: './admin-branch-management.scss',
})
export class AdminBranchManagement implements OnInit {
  branches: any = [];
  brancheswithstatus: any = [];
  
 
  //adding three variables//
  regions: any[] = [];
  zones: any[] = [];
  circles: any[] = [];
   


  branchForm: FormGroup;
  showForm = false;
  isEditMode = false;
  editBranchId: number | null = null;
  itemsPerPageOptions = [5, 10, 20];
  itemsPerPage = 5;
  currentPage = 1;
  showAdminModal = false;
  selectedBranchId: number | null = null;
  selectedBranchName: string | null = null;
  isButtonLoading: boolean = false;
  loading: boolean = false;
   organizationConfig: any = {};




  @ViewChild('branchFormRef') branchFormRef!: ElementRef;
  private scrollToForm = false;

  constructor(
    private userService: User,
    private fb: FormBuilder,
    private toast: Toast,
    private cdr: ChangeDetectorRef
  ) {
       this.branchForm = this.fb.group({
  name: [
    '',
    [
      Validators.required,
      Validators.minLength(3),
      (control: any) =>
        control.value && control.value.trim().length === 0
          ? { whitespace: true }
          : null,
      (control: any) =>
        control.value && /[0-9]/.test(control.value)
          ? { numbersNotAllowed: true }
          : null,
    ],
  ],

  address: [
    '',
    (control: any) =>
      control.value && /^[0-9]+$/.test(control.value)
        ? { numbersOnlyNotAllowed: true }
        : null,
  ],

  region_id: [''],
  zone_id: [''],
  circle_id: [''],
});






     }

  ngOnInit(): void {
    this.loadBranches();
    // this.loadConfiguration(); 
    this.loadRegions();
  } 

// loadConfiguration() {

//     this.userService
//         .getHeadOfficeConfiguration()
//         .subscribe({

//             next: (res: any) => {

//                 this.organizationConfig = res;

//             },

//             error: (err) => {

//                 console.log(err);

//             }

//         });

// }







  ngAfterViewChecked(): void {
    if (this.scrollToForm && this.branchFormRef) {
      this.branchFormRef.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      this.scrollToForm = false; // reset flag
    }
  }

  loadBranches() {
  this.loading = true;

  this.userService.fetchAllBranches().subscribe({
    next: (branchesData: any) => {
      const branchesArray = branchesData as any[];

      this.userService.getBranchesWithAdminStatus().subscribe({
        next: (statusData: any) => {
          const statusArray = statusData as any[];

          this.branches = branchesArray.map((branch: any) => {
            const match = statusArray.find(
              (s: any) => s.id === branch.id
            );

            return {
              ...branch,
              has_admin: match ? match.has_admin : 0,
            };
          });

          this.loading = false;
        },

        error: (err) => {
          console.error('Failed to load branch admin status:', err);
          this.loading = false;
        }
      });
    },

    error: (err) => {
      console.error('Failed to load branches:', err);
      this.loading = false;
    }
  });
}



  

 //LoadRegions  
loadRegions() {
  this.regions = [];
  this.zones = [];
  this.circles = [];

  this.branchForm.patchValue({
    region_id: '',
    zone_id: '',
    circle_id: ''
  });

  this.userService.fetchAllRegions().subscribe({
    next: (data: any) => {
      this.regions = data;
    },
    error: (err) => {
      console.error('Failed to load regions:', err);
    }
  });
}



 




//loadZones 
loadZones(regionId: number) {
  if (!regionId) {
    this.zones = [];
    this.circles = [];

    this.branchForm.patchValue({
      zone_id: '',
      circle_id: ''
    });

    return;
  }

  this.userService.fetchZonesByRegion(regionId).subscribe({
    next: (data: any) => {
      this.zones = data;

      this.circles = [];

      this.branchForm.patchValue({
        zone_id: '',
        circle_id: ''
      });
    },

    error: (err) => {
      console.error('Failed to load zones:', err);
    }
  });
}

//loadcircles 

loadCircles(zoneId: number) {
  if (!zoneId) {
    this.circles = [];

    this.branchForm.patchValue({
      circle_id: ''
    });

    return;
  }

  this.userService.fetchCirclesByZone(zoneId).subscribe({
    next: (data: any) => {
      this.circles = data;

      this.branchForm.patchValue({
        circle_id: ''
      });
    },

    error: (err) => {
      console.error('Failed to load circles:', err);
    }
  });
}







  toggleForm() {
    this.showForm = !this.showForm;
  }

  get totalPages(): number {
    return Math.ceil(this.branches.length / this.itemsPerPage);
  }

  paginatedBranches() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.branches.slice(start, start + this.itemsPerPage);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  openAdminModal(branch: any, hasAdmin: boolean) {
    this.selectedBranchId = branch.id;
    this.selectedBranchName = branch.name;
    this.showAdminModal = true;

    // if you want to differentiate between "Create Admin" and "Add Another Admin"
    if (hasAdmin) {
      console.log(`Add another admin for branch: ${branch.name}`);
    } else {
      console.log(`Create first admin for branch: ${branch.name}`);
    }
  }

  handleAdminSubmit(adminData: any) {
    this.toast.show('Branch admin created successfully!', 'success');
    this.showAdminModal = false;

    // Optionally reload branches if you want to show branch admin info
    this.loadBranches();
  }

  submitForm() {
    if (this.branchForm.invalid) return;

  console.log('Form Value:', this.branchForm.value);

  const branch = {
    name: this.branchForm.value.name,
    address: this.branchForm.value.address,

    circle_id:
      !this.branchForm.value.circle_id ||
      this.branchForm.value.circle_id === '0'
        ? null
        : this.branchForm.value.circle_id
  };

  console.log('Branch payload:', branch);

  // Object.keys(branch).forEach((key) => {
  //   if (typeof branch[key] === 'string') {
  //     branch[key] = branch[key].trim();
  //   }
  // });
  
     
 
    this.isButtonLoading = true;
    if (this.isEditMode && this.editBranchId) {
      this.userService.updateBranches(this.editBranchId, branch).subscribe({
        next: () => {
          this.toast.show('Branch updated successfully!', 'success');
          this.loadBranches();
          this.resetForm();
          this.isButtonLoading = false;
        },
        error: (err) => {
          // Extract backend error message if present
          const message = err.error?.error || 'Failed to update branch!';
          this.toast.show(message, 'error'); // Show toast for errors
          this.isButtonLoading = false;
        },
      });
    } else {
      this.userService.createBranches(branch).subscribe({
        next: (createdBranch: any) => {
          this.toast.show('Branch created successfully!', 'success');

          this.loadBranches();
          this.resetForm();

          this.selectedBranchId = createdBranch.id;
          this.selectedBranchName = createdBranch.name;
          this.showAdminModal = true;
          this.isButtonLoading = false;
        },
        error: (err) => {
          // Extract backend error message if present
          const message = err.error?.error || 'Failed to update branch!';
          this.toast.show(message, 'error'); // Show toast for errors
          this.isButtonLoading = false;
        },
      });
    }
  }
 editBranch(branch: any) {
  this.isEditMode = true;
  this.editBranchId = branch.id;

  this.branchForm.patchValue({
    name: branch.name,
    address: branch.address,
    region_id: branch.region_id || '',
    zone_id: '',
    circle_id: ''
  });

  this.showForm = true;

  this.scrollToForm = true;
  this.cdr.detectChanges();

  // Load zones for selected region
  if (branch.region_id) {
    this.userService.fetchZonesByRegion(branch.region_id).subscribe({
      next: (data: any) => {
        this.zones = data;

        this.branchForm.patchValue({
          zone_id: branch.zone_id || ''
        });

        // Load circles for selected zone
        if (branch.zone_id) {
          this.userService.fetchCirclesByZone(branch.zone_id).subscribe({
            next: (circlesData: any) => {
              this.circles = circlesData;

              this.branchForm.patchValue({
                circle_id: branch.circle_id || ''
              });
            },

            error: (err) => {
              console.error('Failed to load circles:', err);
            }
          });
        }
      },

      error: (err) => {
        console.error('Failed to load zones:', err);
      }
    });
  }
}

  resetForm() {
    this.isEditMode = false;
    this.editBranchId = null;
    this.branchForm.reset();
    this.showForm = false;
  } 

clearForm() {
  this.branchForm.reset();
}



}
