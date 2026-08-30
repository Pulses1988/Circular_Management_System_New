import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { User } from '../../services/user';
import { Toast } from '../../toast/toast';

@Component({
  selector: 'app-admin-region-management',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MatIconModule,
  ],
  templateUrl: './admin-region-management.html',
  styleUrls: ['./admin-region-management.scss'],
})
export class AdminRegionManagement implements OnInit {

  regions: any[] = [];
  headOffices: any[] = [];
// ================= PAGINATION =================
itemsPerPageOptions = [5, 10, 20];
itemsPerPage = 10;
currentPage = 1;
// =============================================




  regionForm: FormGroup;  







  showForm = false;
  loading = false;
  isButtonLoading = false;

  isEditMode = false;
  editRegionId: number | null = null;

  constructor(
    private userService: User,
    private fb: FormBuilder,
    private toast: Toast
  ) {

    this.regionForm = this.fb.group({
      head_office_id: ['', Validators.required],
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ]
    });

  }

  ngOnInit(): void {

    this.loadRegions();
    this.loadHeadOffices();

  }

  // loadRegions() {

  //   this.loading = true;

  //   this.userService.fetchAllRegions().subscribe({

  //     next: (data: any) => {

  //       this.regions = data;
  //       this.loading = false;

  //     },

  //     error: () => {

  //       this.loading = false;
  //       this.toast.show('Failed to load Regions', 'error');

  //     }

  //   });

  // }
loadRegions() {
  this.loading = true;

  this.userService.fetchAllRegions().subscribe({
    next: (data: any) => {

      this.regions = data;

      // Reset to first page after loading data
      this.currentPage = 1;

      this.loading = false;
    },

    error: () => {

      this.loading = false;

      this.toast.show(
        'Failed to load Regions',
        'error'
      );

    }
  });
}




  loadHeadOffices() {

    this.userService.fetchAllHeadOffice().subscribe({

      next: (data: any) => {

        this.headOffices = data;

      },

      error: () => {

        this.toast.show('Failed to load Head Offices', 'error');

      }

    });

  }

  toggleForm() {

    this.showForm = !this.showForm;

    if (!this.showForm) {
      this.resetForm();
    }

  }

  submitForm() {

    if (this.regionForm.invalid) {

      this.regionForm.markAllAsTouched();
      return;

    }

    this.isButtonLoading = true;

    if (this.isEditMode) {

      // this.toast.show(
      //   'Update API not implemented yet.',
      //   'info'
      // );

      // this.isButtonLoading = false;
      // return;
        this.userService
    .updateRegion(this.editRegionId!, this.regionForm.value)
    .subscribe({

      next: () => {

        this.toast.show(
          'Region Updated Successfully',
          'success'
        );

        this.loadRegions();

        this.resetForm();

        this.isButtonLoading = false;

      },

      error: (err) => {

        this.toast.show(
          err.error?.error || 'Failed to update Region',
          'error'
        );

        this.isButtonLoading = false;

      }

    });

  return;







    }

    this.userService.createRegion(this.regionForm.value).subscribe({

      next: () => {

        this.toast.show(
          'Region Created Successfully',
          'success'
        );

        this.loadRegions();
        this.resetForm();

        this.isButtonLoading = false;

      },

      error: (err) => {

        const message =
          err.error?.error || 'Failed to create Region';

        this.toast.show(message, 'error');

        this.isButtonLoading = false;

      }

    });

  }

  editRegion(region: any) {

    this.isEditMode = true;
    this.showForm = true;
    this.editRegionId = region.id;

    this.regionForm.patchValue({

      head_office_id: region.head_office_id,
      name: region.name

    });

  }

  deleteRegion(id: number) {

    // if (!confirm('Delete this Region?')) {
    //   return;
    // }

    // this.toast.show(
    //   'Delete API not implemented yet.',
    //   'info'
    // );
 if (!confirm('Delete this Region?')) {
    return;
  }

  this.userService.deleteRegion(id).subscribe({

    next: () => {

      this.toast.show(
        'Region Deleted Successfully',
        'success'
      );

      this.loadRegions();

    },

    error: (err) => {

      const message =
        err.error?.error || 'Failed to delete Region';

      this.toast.show(
        message,
        'error'
      );

    }

  });










  }

  resetForm() {

    this.regionForm.reset();

    this.showForm = false;
    this.isEditMode = false;
    this.editRegionId = null;

  }  
  
  //To clear the form 
clearForm() {

  this.regionForm.reset();

}


// ================= PAGINATION =================

get totalPages(): number {
  return Math.ceil(this.regions.length / this.itemsPerPage);
}

paginatedRegions() {
  const start = (this.currentPage - 1) * this.itemsPerPage;

  return this.regions.slice(
    start,
    start + this.itemsPerPage
  );
}

changePage(page: number) {
  if (page < 1 || page > this.totalPages) {
    return;
  }

  this.currentPage = page;
}

// ==============================================





}