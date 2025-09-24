import { Component, EventEmitter, input, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { User } from '../../../services/user';
import { Toast } from '../../../toast/toast';
import { NgIf } from '@angular/common';
import { catchError, map, of, switchMap, timer } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-branch-admin-form',
  imports: [ReactiveFormsModule, NgIf, MatIconModule],
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
  showPassword: boolean = false;

  constructor(private fb: FormBuilder, private userService: User, private toast: Toast) {
    this.adminForm = this.fb.group({
      username: [
        '',
        [Validators.required, Validators.minLength(3), this.noWhitespaceValidator],
        [this.usernameDuplicateValidator()],
      ],
      password: ['', [Validators.required, this.noWhitespaceValidator]],
      first_name: ['', [this.noWhitespaceValidator,this.lettersOnlyValidator]],
      middle_name: ['',this.lettersOnlyValidator],
      last_name: ['', [this.noWhitespaceValidator,this.lettersOnlyValidator]],
      email: [
        '',
        [Validators.required, Validators.email, this.noWhitespaceValidator],
        [this.emailDuplicateValidator()],
      ],
      branch_id: [''],
      admin_type: ['BRANCH_ADMIN'],
    });
  }
  ngOnInit(): void {
    console.log(this.branchName);
  }

  lettersOnlyValidator(control: AbstractControl) {
    if (control.value && /[^a-zA-Z\s]/.test(control.value)) {
      // if there is anything other than letters and spaces
      return { lettersOnly: true };
    }
    return null;
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

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  noWhitespaceValidator(control: AbstractControl) {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  }

  usernameDuplicateValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return of(null);

      // Skip duplicate check if the value hasn't changed in edit mode
      if (this.isEditMode && this.editAdminData.username === control.value) {
        return of(null);
      }

      return timer(500).pipe(
        switchMap(() => this.userService.checkUsernameExists(control.value)),
        map((exists: boolean) => (exists ? { usernameTaken: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  emailDuplicateValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return of(null);

      if (this.isEditMode && this.editAdminData.email === control.value) {
        return of(null);
      }

      return timer(500).pipe(
        switchMap(() => this.userService.checkEmailExists(control.value)),
        map((exists: boolean) => (exists ? { emailTaken: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  submitForm() {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    const adminData = { ...this.adminForm.value };
    Object.keys(adminData).forEach((key) => {
      if (typeof adminData[key] === 'string') {
        adminData[key] = adminData[key].trim();
      }
    });

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
