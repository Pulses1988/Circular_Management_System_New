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
  headOffice: any = [];
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
            control.value && control.value.trim().length === 0 ? { whitespace: true } : null,
          (control: any) =>
            control.value && /[0-9]/.test(control.value) ? { numbersNotAllowed: true } : null,
        ],
      ],
      address: [
        '',
        (control: any) =>
          control.value && /^[0-9]+$/.test(control.value) ? { numbersOnlyNotAllowed: true } : null,
      ],
      head_office_id: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadBranches();
  }

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
    this.userService.fetchAllBranches().subscribe((branchesData: any) => {
      const branchesArray = branchesData as any[]; // ✅ force array type

      this.userService.getBranchesWithAdminStatus().subscribe((statusData: any) => {
        const statusArray = statusData as any[]; // ✅ force array type

        this.branches = branchesArray.map((branch: any) => {
          const match = statusArray.find((s: any) => s.id === branch.id);
          return {
            ...branch,
            has_admin: match ? match.has_admin : 0,
          };
        });
      });
    });

    this.userService.fetchAllHeadOffice().subscribe((data: any) => {
      this.headOffice = data;
      this.loading = false;
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
    const branch = { ...this.branchForm.value };
    Object.keys(branch).forEach((key) => {
      if (typeof branch[key] === 'string') {
        branch[key] = branch[key].trim();
      }
    });
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
      head_office_id: branch.head_office_id,
    });
    this.showForm = true;

    this.scrollToForm = true; // mark that we should scroll on next view check
    this.cdr.detectChanges();
  }

  resetForm() {
    this.isEditMode = false;
    this.editBranchId = null;
    this.branchForm.reset();
    this.showForm = false;
  }
}
