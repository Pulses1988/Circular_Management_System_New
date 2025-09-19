import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  NgModel,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { User } from '../../services/user';
import { Toast } from '../../toast/toast';
import { CommonModule, DatePipe, NgFor } from '@angular/common';
import { subscribe } from 'diagnostics_channel';

@Component({
  selector: 'app-employee-mangement',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './employee-mangement.html',
  styleUrl: './employee-mangement.scss',
})
export class EmployeeMangement {
  employees: any[] = [];
  roles: any[] = [];
  departments: any[] = [];
  branches: any[] = [];

  employeeForm: FormGroup;

  showForm = false;
  isEditMode = false;
  editEmployeeId: number | null = null;

  itemsPerPageOptions = [5, 10, 20];
  itemsPerPage = 5;
  currentPage = 1;

  role: string | null = localStorage.getItem('role');
  userAssignment: any = localStorage.getItem('userAssignment')
    ? JSON.parse(localStorage.getItem('userAssignment')!)
    : null;

  @ViewChild('employeeFormRef') employeeFormRef!: ElementRef;
  private scrollToForm = false;

  constructor(
    private fb: FormBuilder,
    private userService: User,
    private toast: Toast,
    private cdr: ChangeDetectorRef
  ) {
    this.employeeForm = this.fb.group({
      first_name: ['', Validators.required],
      middle_name: [''],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone_no: [''],
      role_id: ['', Validators.required],
      department_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      employee_id: ['', Validators.required],
      password_hash: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewChecked(): void {
    if (this.scrollToForm && this.employeeFormRef) {
      this.employeeFormRef.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      this.scrollToForm = false;
    }
  }

  loadData() {
    // Fetch employees
    // this.userService.getAllEmployees().subscribe((data: any) => {
    //   this.employees = data.map((emp: any) => ({
    //     ...emp,
    //     role_name: emp.role?.name || '',
    //     department_name: emp.department?.name || '',
    //     branch_name: emp.branch?.name || '',
    //   }));
    // });
    // // Fetch roles
    // this.employeeService.getAllRoles().subscribe((data: any) => {
    //   this.roles = data;
    // });
    // // Fetch departments
    // this.employeeService.getAllDepartments().subscribe((data: any) => {
    //   this.departments = data;
    // });

    if (this.role === 'HO_ADMIN') {
      this.userService.getDepartmentsByHeadOffice(this.userAssignment.id).subscribe((data) => {
        this.departments = data;
        console.log(data);
      });

      this.userService.getRolesByHeadOffice(this.userAssignment.id).subscribe((data) => {
        this.roles=data;
        console.log(data);
      });
    }

    if (this.role === 'BRANCH_ADMIN') {
      this.userService.getDepartmentsByBranch(this.userAssignment.id).subscribe((data) => {
        this.departments = data;
        console.log(data);
      });

      this.userService.getRolesByBranch(this.userAssignment.id).subscribe((data) => {
        console.log(data);
      });
    }

    // // Fetch branches
    // this.employeeService.getAllBranches().subscribe((data: any) => {
    //   this.branches = data;
    // });
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  get totalPages(): number {
    return Math.ceil(this.employees.length / this.itemsPerPage);
  }

  paginatedEmployees() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.employees.slice(start, start + this.itemsPerPage);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  submitForm() {
    if (this.employeeForm.invalid) return;

    const employee = { ...this.employeeForm.value };
    Object.keys(employee).forEach((key) => {
      if (typeof employee[key] === 'string') {
        employee[key] = employee[key].trim();
      }
    });

    if (this.isEditMode && this.editEmployeeId) {
      // this.employeeService.updateEmployee(this.editEmployeeId, employee).subscribe(() => {
      //   this.toast.show('Employee updated successfully!', 'success');
      //   this.loadData();
      //   this.resetForm();
      // });
    } else {
      // this.employeeService.createEmployee(employee).subscribe(() => {
      //   this.toast.show('Employee created successfully!', 'success');
      //   this.loadData();
      //   this.resetForm();
      // });
    }
  }

  editEmployee(emp: any) {
    this.isEditMode = true;
    this.editEmployeeId = emp.id;

    this.employeeForm.patchValue({
      first_name: emp.first_name,
      middle_name: emp.middle_name,
      last_name: emp.last_name,
      email: emp.email,
      phone_no: emp.phone_no,
      role_id: emp.role_id,
      department_id: emp.department_id,
      branch_id: emp.branch_id,
      employee_id: emp.employee_id,
      password_hash: '', // leave blank for security
    });

    this.showForm = true;
    this.scrollToForm = true;
    this.cdr.detectChanges();
  }

  deleteEmployee(id: number) {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    // this.employeeService.deleteEmployee(id).subscribe(() => {
    //   this.toast.show('Employee deleted successfully!', 'success');
    //   this.loadData();
    // });
  }

  resetForm() {
    this.isEditMode = false;
    this.editEmployeeId = null;
    this.employeeForm.reset();
    this.showForm = false;
  }
}
