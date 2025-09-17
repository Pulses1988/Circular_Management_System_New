import { Component, OnInit } from '@angular/core';
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

  constructor(private userService: User, private fb: FormBuilder, private toast: Toast) {
    this.branchForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: [''],
      head_office_id: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches() {
    this.userService.fetchAllBranches().subscribe((data) => {
      this.branches = data;
    });

    this.userService.fetchAllHeadOffice().subscribe((data) => {
      this.headOffice = data;
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

  handleAdminSubmit(adminData: any) {
    this.toast.show('Branch admin created successfully!', 'success');
    this.showAdminModal = false;

    // Optionally reload branches if you want to show branch admin info
    this.loadBranches();
  }

  submitForm() {
    if (this.branchForm.invalid) return;
    const branch = this.branchForm.value;
    if (this.isEditMode && this.editBranchId) {
      this.userService.updateBranches(this.editBranchId, branch).subscribe(() => {
        this.toast.show('Branch updated successfully!', 'success');
        this.loadBranches();
        this.resetForm();
      });
    } else {
      this.userService.createBranches(branch).subscribe((createdBranch: any) => {
        this.toast.show('Branch created sucessfully!', 'success');
        this.loadBranches();
        this.resetForm();

        this.selectedBranchId = createdBranch.id;
        this.selectedBranchName = createdBranch.name;
        this.showAdminModal = true;
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
  }
  deleteBranch(id: any) {}
  resetForm() {
    this.isEditMode = false;
    this.editBranchId = null;
    this.branchForm.reset();
    this.showForm = false;
  }
}
