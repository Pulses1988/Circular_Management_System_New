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
  selector: 'app-admin-zone-management',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MatIconModule,
  ],
  templateUrl: './admin-zone-management.html',
  styleUrls: ['./admin-zone-management.scss'],
})
export class AdminZoneManagement implements OnInit {

  zones: any[] = [];
  regions: any[] = [];

  zoneForm: FormGroup;

  showForm = false;

  isEditMode = false;

  editZoneId: number | null = null;

  loading = false;

  isButtonLoading = false;  


// Pagination
itemsPerPageOptions = [5, 10, 20];
itemsPerPage = 10;
currentPage = 1;





  constructor(
    private userService: User,
    private fb: FormBuilder,
    private toast: Toast
  ) {

    this.zoneForm = this.fb.group({
      region_id: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(3)]],
    });

  }

  ngOnInit(): void {
    this.loadZones();
    this.loadRegions();
  }

  //-------------------------------
  // Load Zones
  //-------------------------------

 loadZones() {

  this.loading = true;

  this.userService.fetchAllZones().subscribe({

    next: (data: any) => {

      this.zones = data;

      // Always start from first page after loading
      this.currentPage = 1;

      this.loading = false;

    },

    error: () => {

      this.loading = false;

      this.toast.show(
        'Failed to load Zones',
        'error'
      );

    }

  });

}

  //-------------------------------
  // Load Regions
  //-------------------------------

  loadRegions() {

    this.userService.fetchAllRegions().subscribe({

      next: (data: any) => {

        this.regions = data;

      },

      error: () => {

        this.toast.show(
          'Failed to load Regions',
          'error'
        );

      }

    });

  }

  //-------------------------------
  // Show / Hide Form
  //-------------------------------

  toggleForm() {

    this.showForm = !this.showForm;

  }

  //-------------------------------
  // Create / Update
  //-------------------------------

  submitForm() {

    if (this.zoneForm.invalid) {

      this.zoneForm.markAllAsTouched();

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
    .updateZone(this.editZoneId!, this.zoneForm.value)
    .subscribe({

      next: () => {

        this.toast.show(
          'Zone Updated Successfully',
          'success'
        );

        this.loadZones();

        this.resetForm();

        this.isButtonLoading = false;

      },

      error: (err) => {

        this.toast.show(
          err.error?.error || 'Failed to update Zone',
          'error'
        );

        this.isButtonLoading = false;

      }

    });

  return;









    }

    this.userService.createZone(this.zoneForm.value).subscribe({

      next: () => {

        this.toast.show(
          'Zone Created Successfully',
          'success'
        );

        this.loadZones();

        this.resetForm();

        this.isButtonLoading = false;

      },

      error: (err) => {

        const message =
          err.error?.error ||
          'Failed to create Zone';

        this.toast.show(
          message,
          'error'
        );

        this.isButtonLoading = false;

      }

    });

  }

  //-------------------------------
  // Edit
  //-------------------------------

  editZone(zone: any) {

    this.isEditMode = true;

    this.showForm = true;

    this.editZoneId = zone.id;

    this.zoneForm.patchValue({

      region_id: zone.region_id,

      name: zone.name

    });

  }

  //-------------------------------
  // Delete
  //-------------------------------

  deleteZone(id: number) {

    // if (!confirm('Delete this Zone?')) {

    //   return;

    // }

    // this.toast.show(
    //   'Delete API not implemented yet.',
    //   'info'
    // );  

      if (!confirm('Delete this Zone?')) {
    return;
  }

  this.userService.deleteZone(id).subscribe({

    next: () => {

      this.toast.show(
        'Zone Deleted Successfully',
        'success'
      );

      this.loadZones();

    },

    error: (err) => {

      this.toast.show(
        err.error?.error || 'Failed to delete Zone',
        'error'
      );

    }

  });








  } 


//-------------------------------
// Pagination
//-------------------------------

get totalPages(): number {
  return Math.ceil(this.zones.length / this.itemsPerPage);
}

paginatedZones() {
  const start = (this.currentPage - 1) * this.itemsPerPage;

  return this.zones.slice(
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



  //-------------------------------
  // Reset
  //-------------------------------

  resetForm() {

    this.zoneForm.reset();

    this.showForm = false;

    this.isEditMode = false;

    this.editZoneId = null;

  }

//Clear form

clearForm() {

  this.zoneForm.reset();

}



}