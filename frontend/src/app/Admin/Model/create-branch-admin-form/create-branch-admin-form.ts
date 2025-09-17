import { Component, EventEmitter, input, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../../services/user';
import { Toast } from '../../../toast/toast';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-create-branch-admin-form',
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './create-branch-admin-form.html',
  styleUrl: './create-branch-admin-form.scss',
})
export class CreateBranchAdminForm implements OnInit {
  @Input() branchId: number | null = null; // prefilled branch id
  @Input() branchName: string | null = null;
  @Input() editAdminData: any = null; // for edit mode
  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<any>();

  adminForm: FormGroup;
  isEditMode = false;

  constructor(private fb: FormBuilder, private userService: User, private toast: Toast) {
    this.adminForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      first_name: [''],
      middle_name: [''],
      last_name: [''],
      email: ['', [Validators.email]],
      branch_id: [''],
      admin_type: ['BRANCH_ADMIN'],
    });
  }
  ngOnInit(): void {
    console.log(this.branchName);
  }

  ngOnChanges(): void {
    if (this.editAdminData) {
      this.isEditMode = true;
      this.adminForm.patchValue({ ...this.editAdminData });
    }
    if (this.branchId) {
      this.adminForm.patchValue({ branch_id: this.branchId });
    }
  }

  submitForm() {
    if (this.adminForm.invalid) return;

    const adminData = this.adminForm.value;

    if (this.isEditMode) {
      // this.userService.updateAdmin(adminData.id, adminData).subscribe(() => {
      //   this.toast.show('Admin updated successfully!', 'success');
      //   this.onSubmit.emit(adminData);
      //   this.closeModal();
      // });
    } else {
      this.userService.createAdmin(adminData).subscribe(() => {
        this.toast.show('Admin created successfully!', 'success');
        this.onSubmit.emit(adminData);
        this.closeModal();
      });
    }
  }
  closeModal() {
    this.adminForm.reset();
    this.onClose.emit();
  }
}
