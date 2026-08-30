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
  selector: 'app-admin-head-office-management',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MatIconModule,
  ],
  templateUrl: './admin-head-office-management.html',
  styleUrls: ['./admin-head-office-management.scss'],
})
export class AdminHeadOfficeManagement implements OnInit {

  headOffices: any[] = [];

  headOfficeForm: FormGroup;

  showForm = false;

  isEditMode = false;

  editHeadOfficeId: number | null = null;

  loading = false;

  isButtonLoading = false;

  constructor(
    private userService: User,
    private fb: FormBuilder,
    private toast: Toast
  ) {

    this.headOfficeForm = this.fb.group({
           
            name: ['', [
    Validators.required,
    Validators.minLength(3)
  ]],

  bank_name: ['', Validators.required],

  address: [''],

  bank_type: ['', Validators.required],

  bank: [true],

  headOffice: [true],

  region: [true],

  zone: [true],

  circle: [false],

  branch: [true],

  department: [true],

  designation: [true],

  employee: [true]





    

    });

  }

  ngOnInit(): void {

    this.loadHeadOffices();

  }

  loadHeadOffices() {

    this.loading = true;

    this.userService.fetchAllHeadOffice().subscribe({

      next: (data: any) => {

        this.headOffices = data;

        this.loading = false;

      },

      error: () => {

        this.loading = false;

        this.toast.show(
          'Failed to load Head Offices',
          'error'
        );

      }

    });

  }

  toggleForm() {

    // this.showForm = !this.showForm;
     // Don't allow opening Create form
  // if a Head Office already exists
  if (!this.showForm && this.headOffices.length > 0 && !this.isEditMode) {
    return;
  }

  this.showForm = !this.showForm;

  }

  submitForm() {
   
      console.log("submitForm called");

  console.log("Form Valid =", this.headOfficeForm.valid);

  console.log("Edit Mode =", this.isEditMode);

  console.log("Edit Id =", this.editHeadOfficeId);





    if (this.headOfficeForm.invalid) {

      this.headOfficeForm.markAllAsTouched();

      return;

    }

    this.isButtonLoading = true;

    // if (this.isEditMode) {

    //   this.toast.show(
    //     'Update API not implemented yet.',
    //     'info'
    //   );

    //   this.isButtonLoading = false;

    //   return;

    // } 


//update APi for head office 
if (this.isEditMode) {

  const updateData = {

    name: this.headOfficeForm.value.name,
    bank_name: this.headOfficeForm.value.bank_name,
    address: this.headOfficeForm.value.address,

    bank_type: this.headOfficeForm.value.bank_type,

    bank: this.headOfficeForm.value.bank,
    head_office: this.headOfficeForm.value.headOffice,

    region: this.headOfficeForm.value.region,
    zone: this.headOfficeForm.value.zone,
    circle: this.headOfficeForm.value.circle,

    branch: this.headOfficeForm.value.branch,
    department: this.headOfficeForm.value.department,
    designation: this.headOfficeForm.value.designation,
    employee: this.headOfficeForm.value.employee

  };

  console.log('========== UPDATE HEAD OFFICE ==========');
  console.log('ID:', this.editHeadOfficeId);
  console.log('Update Data:', updateData);

  this.userService
    .updateHeadOffice(
      this.editHeadOfficeId!,
      updateData
    )
    .subscribe({

      next: (response) => {

        console.log('Update Response:', response);

        this.toast.show(
          'Head Office Updated Successfully',
          'success'
        );

        this.loadHeadOffices();

        this.resetForm();

        this.isButtonLoading = false;

      },

      error: (err) => {

        console.error('UPDATE ERROR:', err);

        this.toast.show(
          err.error?.error ||
          err.error?.message ||
          'Failed to update Head Office',
          'error'
        );

        this.isButtonLoading = false;

      }

    });

  return;
}




    this.userService.addHeadOffice(
      this.headOfficeForm.value
    ).subscribe({

      next: () => {

        this.toast.show(
          'Head Office Created Successfully',
          'success'
        );

        this.loadHeadOffices();

        this.resetForm();

        this.isButtonLoading = false;

      },

      error: (err) => {

        const message =
          err.error?.error ||
          'Failed to create Head Office';

        this.toast.show(
          message,
          'error'
        );

        this.isButtonLoading = false;

      }

    });

  }

 editHeadOffice(headOffice: any) {

  console.log('========== EDIT HEAD OFFICE ==========');
  console.log('Selected Head Office:', headOffice);
  console.log('ID:', headOffice.id);

  this.isEditMode = true;
  this.showForm = true;
  this.editHeadOfficeId = headOffice.id;

  this.headOfficeForm.patchValue({

    name: headOffice.name ?? '',
    bank_name: headOffice.bank_name ?? '',
    address: headOffice.address ?? '',

    bank_type: headOffice.bank_type ?? '',

    bank: headOffice.bank ?? false,
    headOffice: headOffice.head_office ?? false,
    region: headOffice.region ?? false,
    zone: headOffice.zone ?? false,
    circle: headOffice.circle ?? false,
    branch: headOffice.branch ?? false,
    department: headOffice.department ?? false,
    designation: headOffice.designation ?? false,
    employee: headOffice.employee ?? false

  });

  console.log('Form after patch:', this.headOfficeForm.value);
}



  deleteHeadOffice(id: number) {

    // if (!confirm('Delete this Head Office?')) {

    //   return;

    // }

    // this.toast.show(
    //   'Delete API not implemented yet.',
    //   'info'
    // ); 
      if (!confirm('Delete this Head Office?')) {
    return;
  }

  this.userService.deleteHeadOffice(id).subscribe({

    next: () => {

      this.toast.show(
        'Head Office Deleted Successfully',
        'success'
      );

      this.loadHeadOffices();

    },

    error: (err) => {

      this.toast.show(
        err.error?.error || 'Failed to delete Head Office',
        'error'
      );

    }

  });





  }

  resetForm() {
      
     this.headOfficeForm.reset({

    name: '',

    bank_name: '',

    address: '',

    bank_type: '',

    bank: true,

    headOffice: true,

    region: false,

    zone: false,

    circle: false,

    branch: true,

    department: true,

    designation: true,

    employee: true

  });

  this.showForm = false;

  this.isEditMode = false;

  this.editHeadOfficeId = null;




   

  }

}