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
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-employee-mangement',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, MatIconModule],
  templateUrl: './employee-mangement.html',
  styleUrl: './employee-mangement.scss',
})
export class EmployeeMangement {
  employees: any[] = [];
  allRoles: any[] = []; // keep original roles
  roles: any[] = [];
  departments: any[] = [];
  branches: any[] = [];
  hasDepartments: boolean = true;

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
      first_name: [
        '',
        [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/), this.noWhitespaceValidator],
      ],
      middle_name: ['', Validators.pattern(/^[A-Za-z\s]*$/)], // optional but no numbers
      last_name: [
        '',
        [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/), this.noWhitespaceValidator],
      ],
      email: ['', [Validators.required, Validators.email, this.noWhitespaceValidator]],
      phone_no: ['', [Validators.pattern(/^[0-9]*$/)]],
      role_id: ['', Validators.required],
      department_id: [''],
      branch_id: ['', Validators.required],
      employee_id: ['', [Validators.required, Validators.pattern(/^\S+$/)]], // no spaces
      password: ['', Validators.required, this.noWhitespaceValidator],
      can_create_circular: [false],
      can_approve_circular: [false],
    });
  }

  noWhitespaceValidator(control: any) {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  }

  ngOnInit(): void {
    this.loadData();
    this.employeeForm.get('department_id')?.valueChanges.subscribe((value) => {
      console.log('department selected', value);
      this.loadRolesForDepartment(value);
    });

    this.employeeForm.get('department_id')?.valueChanges.subscribe(() => {
      this.checkDepartmentValidation();
    });

    this.employeeForm.get('role_id')?.valueChanges.subscribe(() => {
      this.checkDepartmentValidation();
    });
  }

  checkDepartmentValidation() {
    const departmentControl = this.employeeForm.get('department_id');
    if (this.departments.length > 0 && !departmentControl?.value) {
      departmentControl?.setErrors({ required: true });
    } else {
      departmentControl?.setErrors(null);
    }
  }

  loadRolesForDepartment(dept_id: number) {
    this.roles = this.allRoles.filter((role) => role.department_id === Number(dept_id));
    console.log(this.roles);
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
        // this.roles = data;
        this.allRoles = data;
      });

      this.userService.getEmployeeByHeadOfficeId(this.userAssignment.id).subscribe((data: any) => {
        console.log(data);
        
        this.employees = data.map((emp: any) => ({
          ...emp,
          role_name: emp.role?.name || '',
          department_name: emp.department?.name || '',
          branch_name: emp.branch?.name || '',
        }));
        console.log('Employees (HO_ADMIN):', this.employees);
      });
    }

    if (this.role === 'BRANCH_ADMIN') {
      this.userService.getBranchById(this.userAssignment.id).subscribe((branch: any) => {
        this.employeeForm.patchValue({
          branch_id: branch.id,
        });
        this.branches = [branch]; // optional, just in case
      });

      this.userService.getDepartmentsByBranch(this.userAssignment.id).subscribe((data) => {
        this.departments = data;
        this.hasDepartments = data.length > 0;
      });

      this.userService.getRolesByBranch(this.userAssignment.id).subscribe((data) => {
        this.allRoles = data;

        // If no departments, show all roles
        if (!this.hasDepartments) {
          this.roles = this.allRoles;
        }
      });

      this.userService.getEmployeeByBranchId(this.userAssignment.id).subscribe((data: any) => {
        console.log(data);
        
        this.employees = data.map((emp: any) => ({
          ...emp,
          role_name: emp.role?.name || '',
          department_name: emp.department?.name || '',
          branch_name: emp.branch?.name || '',
        }));
        console.log('Employees (BRANCH_ADMIN):', this.employees);
      });
    }
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
      this.userService.createEmployee(employee).subscribe(() => {
        this.toast.show('Employee created successfully!', 'success');
        this.loadData();
        this.resetForm();
      });
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
      password: '', // leave blank for security
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
