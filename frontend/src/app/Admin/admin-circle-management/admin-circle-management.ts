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
  selector: 'app-admin-circle-management',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MatIconModule,
  ],
  templateUrl: './admin-circle-management.html',
  styleUrls: ['./admin-circle-management.scss'],
})
export class AdminCircleManagement implements OnInit {

  circles: any[] = [];
  zones: any[] = [];

  circleForm: FormGroup;

  showForm = false;

  isEditMode = false;

  editCircleId: number | null = null;

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

    this.circleForm = this.fb.group({

      zone_id: ['', Validators.required],

      circle_name: ['', [Validators.required, Validators.minLength(3)]],

      circle_code: ['', Validators.required],

    });

  }

  ngOnInit(): void {

    this.loadCircles();

    this.loadZones();

  }

  //---------------------------------
  // Load Circles
  //---------------------------------

  // loadCircles() {

  //   this.loading = true;

  //   this.userService.fetchAllCircles().subscribe({

  //     next: (data: any) => {

  //       this.circles = data;

  //       this.loading = false;

  //     },

  //     error: () => {

  //       this.loading = false;

  //       this.toast.show(
  //         'Failed to load Circles',
  //         'error'
  //       );

  //     }

  //   });

  // }
loadCircles() {

  this.loading = true;

  this.userService.fetchAllCircles().subscribe({

    next: (data: any) => {

      this.circles = data;

      // Start from first page whenever data is reloaded
      this.currentPage = 1;

      this.loading = false;

    },

    error: () => {

      this.loading = false;

      this.toast.show(
        'Failed to load Circles',
        'error'
      );

    }

  });

}
  //---------------------------------
  // Load Zones
  //---------------------------------

  loadZones() {

    this.userService.fetchAllZones().subscribe({

      next: (data: any) => {

        this.zones = data;

      },

      error: () => {

        this.toast.show(
          'Failed to load Zones',
          'error'
        );

      }

    });

  }

  //---------------------------------
// Pagination
//---------------------------------

get totalPages(): number {
  return Math.ceil(
    this.circles.length / this.itemsPerPage
  );
}

paginatedCircles() {

  const start =
    (this.currentPage - 1) * this.itemsPerPage;

  return this.circles.slice(
    start,
    start + this.itemsPerPage
  );

}

changePage(page: number) {

  if (
    page < 1 ||
    page > this.totalPages
  ) {
    return;
  }

  this.currentPage = page;

}
  //---------------------------------
  // Show / Hide Form
  //---------------------------------

  toggleForm() {

    this.showForm = !this.showForm;

  }

  //---------------------------------
  // Create / Update
  //---------------------------------

  submitForm() {

    if (this.circleForm.invalid) {

      this.circleForm.markAllAsTouched();

      return;

    }

    this.isButtonLoading = true;

    if (this.isEditMode) {

      this.toast.show(
        'Update API not implemented yet.',
        'info'
      );

      this.isButtonLoading = false;

      return;

    }

    this.userService.createCircle(this.circleForm.value).subscribe({

      next: () => {

        this.toast.show(
          'Circle Created Successfully',
          'success'
        );

        this.loadCircles();

        this.resetForm();

        this.isButtonLoading = false;

      },

      error: (err) => {

        const message =
          err.error?.message ||
          'Failed to create Circle';

        this.toast.show(
          message,
          'error'
        );

        this.isButtonLoading = false;

      }

    });

  }

  //---------------------------------
  // Edit
  //---------------------------------

  editCircle(circle: any) {

    this.isEditMode = true;

    this.showForm = true;

    this.editCircleId = circle.circle_id;

    this.circleForm.patchValue({

      zone_id: circle.zone_id,

      circle_name: circle.circle_name,

      circle_code: circle.circle_code,

    });

  }

  //---------------------------------
  // Delete
  //---------------------------------

  deleteCircle(id: number) {

    if (!confirm('Delete this Circle?')) {

      return;

    }

    this.toast.show(
      'Delete API not implemented yet.',
      'info'
    );

  }

  //---------------------------------
  // Reset Form
  //---------------------------------

  resetForm() {

    this.circleForm.reset();

    this.showForm = false;

    this.isEditMode = false;

    this.editCircleId = null;

  } 
clearForm() {
  this.circleForm.reset();
}
  // for date
// formatDate(date: string): string {
//   if (!date) {
//     return '';
//   }

//   const datePart = date.split(' ')[0];

//   const [year, month, day] = datePart.split('-');

//   return `${day}/${month}/${year}`;
// }


}