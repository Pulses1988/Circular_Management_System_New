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
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs'; // Import Subject and takeUntil for proper unsubscription
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-employee-mangement',
  standalone: true, // Assuming this is an Angular 15+ standalone component
  imports: [FormsModule, ReactiveFormsModule, CommonModule, MatIconModule, DatePipe], // Add DatePipe to imports if not already
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
  showPassword: boolean = false;
  showForm = false;
  isEditMode = false;
  editEmployeeId: number | null = null;

  itemsPerPageOptions = [5, 10, 20];
  itemsPerPage = 5;
  currentPage = 1;

  role: any;
  userAssignment: any;

  showErrorModal = false;
  excelErrors: string[] = [];

  @ViewChild('employeeFormRef') employeeFormRef!: ElementRef;
  private scrollToForm = false;
  private destroy$ = new Subject<void>(); // For unsubscribing observables

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
      phone_no: [
        '',
        [Validators.pattern(/^[0-9]*$/), Validators.maxLength(10), Validators.minLength(10)],
      ],
      role_id: ['', Validators.required],
      department_id: [''],
      branch_id: [''],
      employee_id: [''], // no spaces
      password: [''],
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
    this.role = localStorage.getItem('role');
    this.userAssignment = localStorage.getItem('userAssignment')
      ? JSON.parse(localStorage.getItem('userAssignment')!)
      : null;

    this.loadData();

    this.employeeForm
      .get('department_id')
      ?.valueChanges.pipe(takeUntil(this.destroy$)) // Use takeUntil for proper cleanup
      .subscribe((value) => {
        console.log('department selected', value);
        if (this.hasDepartments && value) {
          this.loadRolesForDepartment(value);
        } else if (!this.hasDepartments) {
          this.roles = [...this.allRoles];
        } else {
          this.roles = []; // Clear roles if no department selected
        }
      });

    this.employeeForm
      .get('department_id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkDepartmentValidation();
      });

    this.employeeForm
      .get('role_id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkDepartmentValidation(); // Re-evaluate department validation on role change if needed
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  checkDepartmentValidation() {
    const departmentControl = this.employeeForm.get('department_id');
    if (this.departments.length > 0 && !departmentControl?.value) {
      departmentControl?.setErrors({ required: true });
    } else {
      departmentControl?.setErrors(null);
    }
    departmentControl?.updateValueAndValidity({ emitEvent: false });
  }

  loadRolesForDepartment(dept_id: number) {
    this.roles = this.allRoles.filter((role) => role.department_id === Number(dept_id));
    console.log('Filtered roles for department:', this.roles);
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
    if (this.role === 'HO_ADMIN') {
      this.userService.getDepartmentsByHeadOffice(this.userAssignment.id).subscribe((data) => {
        this.departments = data;
        this.hasDepartments = data.length > 0;
        console.log('Departments (HO_ADMIN):', data);
        this.checkDepartmentValidation(); // Update validation after departments load
      });

      this.userService.getRolesByHeadOffice(this.userAssignment.id).subscribe((data) => {
        this.allRoles = data;
        if (!this.hasDepartments) {
          this.roles = [...this.allRoles];
        }
        console.log('All Roles (HO_ADMIN):', this.allRoles);
      });

      this.userService.getEmployeeByHeadOfficeId(this.userAssignment.id).subscribe((data: any) => {
        this.employees = data;
        console.log('Employees (HO_ADMIN):', this.employees);
      });
    } else if (this.role === 'BRANCH_ADMIN') {
      this.userService.getBranchById(this.userAssignment.id).subscribe((branch: any) => {
        this.branches = [branch];
        console.log('Branches (BRANCH_ADMIN):', this.branches);
      });

      this.userService.getDepartmentsByBranch(this.userAssignment.id).subscribe((data) => {
        this.departments = data;
        this.hasDepartments = data.length > 0;
        console.log('Departments (BRANCH_ADMIN):', data);
        this.checkDepartmentValidation(); // Update validation after departments load
      });

      this.userService.getRolesByBranch(this.userAssignment.id).subscribe((data) => {
        this.allRoles = data;
        console.log('All Roles (BRANCH_ADMIN):', this.allRoles);

        if (!this.hasDepartments) {
          this.roles = [...this.allRoles];
          console.log('Roles (no departments, BRANCH_ADMIN):', this.roles);
        }
      });

      this.userService.getEmployeeByBranchId(this.userAssignment.id).subscribe((data: any) => {
        this.employees = data;
        console.log('Employees (BRANCH_ADMIN):', this.employees);
      });
    }
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
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

  // ---------------------------read excel file and save the data---------------------------------

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const binaryData = e.target.result;
      const workbook = XLSX.read(binaryData, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: '' }); // defval to avoid undefined

      console.log('Excel Data:', data);

      this.validateAndSaveExcelData(data);
    };
    reader.readAsBinaryString(file);
  }

  downloadSampleExcel() {
    // --- Step 1: Determine columns based on role ---
    let columns: string[] = [
      'First Name',
      'Middle Name',
      'Last Name',
      'Email',
      'Phone',
      'Employee ID',
      'Password',
      'Role',
    ];

    if (this.role === 'BRANCH_ADMIN') {
      columns.push('Branch'); // always show branch for branch admin

      if (this.hasDepartments) {
        columns.push('Department');
      }
    } else if (this.role === 'HO_ADMIN') {
      // HO_ADMIN should not show branch
      if (this.hasDepartments) {
        columns.push('Department');
      }
    }

    columns.push('Can Create Circular', 'Can Approve Circular');

    // --- Step 2: Add one example row ---
    let exampleRow: any = {};
    columns.forEach((col) => {
      switch (col) {
        case 'First Name':
          exampleRow[col] = 'John';
          break;
        case 'Middle Name':
          exampleRow[col] = 'A';
          break;
        case 'Last Name':
          exampleRow[col] = 'Doe';
          break;
        case 'Email':
          exampleRow[col] = 'john@example.com';
          break;
        case 'Phone':
          exampleRow[col] = '9876543210';
          break;
        case 'Employee ID':
          exampleRow[col] = 'EMP001';
          break;
        case 'Password':
          exampleRow[col] = '12345';
          break;
        case 'Role':
          exampleRow[col] = this.roles[0]?.name || 'Manager';
          break;
        case 'Branch':
          exampleRow[col] = this.branches[0]?.name || '';
          break;
        case 'Department':
          exampleRow[col] = this.departments[0]?.name || '';
          break;
        case 'Can Create Circular':
          exampleRow[col] = true;
          break;
        case 'Can Approve Circular':
          exampleRow[col] = false;
          break;
        default:
          exampleRow[col] = '';
      }
    });

    // --- Step 3: Create worksheet ---
    const worksheet = XLSX.utils.json_to_sheet([exampleRow], { header: columns });

    // --- Step 4: Style header row ---
    columns.forEach((col, idx) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx }); // first row (header)
      if (!worksheet[cellAddress]) return;
      worksheet[cellAddress].s = {
        font: { bold: true }, // white bold text
        alignment: { horizontal: 'center' },
      };
    });

    // --- Step 5: Create workbook and save ---
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Template');
    XLSX.writeFile(workbook, 'Employee_Upload_Sample.xlsx');
  }

  async validateAndSaveExcelData(data: any[]) {
    this.excelErrors = []; // Reset errors at start

    for (let row of data) {
      const firstName = row['First Name'];
      const middleName = row['Middle Name'];
      const lastName = row['Last Name'];
      const email = row['Email'];
      const phone = row['Phone'];
      const employeeId = row['Employee ID'];
      const password = row['Password'];
      const roleName = row['Role'];
      const branchName = row['Branch'];
      const departmentName = row['Department'];
      const canCreate = row['Can Create Circular'];
      const canApprove = row['Can Approve Circular'];

      // --- Check Role and Assignment ---
      if (this.role === 'BRANCH_ADMIN') {
        if (branchName?.toLowerCase() !== this.branches[0]?.name.toLowerCase()) {
          this.excelErrors.push(
            `Row skipped: Branch "${branchName}" does not match your branch "${this.branches[0]?.name}" for employee ${firstName} ${lastName}`
          );
          continue;
        }
      } else if (this.role === 'HO_ADMIN') {
        if (branchName) {
          this.excelErrors.push(
            `Row skipped: HO_ADMIN cannot assign employees to a branch for employee ${firstName} ${lastName}`
          );
          continue;
        }
      }

      // --- Check Department ---
      let departmentId = null;
      if (departmentName && this.hasDepartments) {
        const dept = this.departments.find(
          (d) => d.name.toLowerCase() === departmentName?.toLowerCase()
        );
        if (!dept) {
          this.excelErrors.push(
            `Department "${departmentName}" not found for employee ${firstName} ${lastName}`
          );
          continue;
        }
        departmentId = dept.id;
      }

      // --- Check Role ---
      let validRole: any = null;
      if (this.hasDepartments && departmentId) {
        // Role must exist in selected department
        validRole = this.allRoles.find(
          (r) =>
            r.name.toLowerCase() === roleName?.toLowerCase() && r.department_id === departmentId
        );
      } else {
        // No departments: role just needs to exist globally
        validRole = this.allRoles.find((r) => r.name.toLowerCase() === roleName?.toLowerCase());
      }

      if (!validRole) {
        this.excelErrors.push(
          `Role "${roleName}" not found in the selected department "${departmentName}" for employee ${firstName} ${lastName}`
        );
        continue;
      }

      // --- Prepare employee object ---
      const employee = {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        email: email,
        phone_no: phone,
        employee_id: employeeId,
        password: password,
        branch_id: this.role === 'BRANCH_ADMIN' ? this.branches[0].id : null,
        department_id: departmentId,
        role_id: validRole.id,
        head_office_id: this.role === 'HO_ADMIN' ? this.userAssignment.id : null,
        can_create_circular: canCreate,
        can_approve_circular: canApprove,
      };

      // --- Save employee via service ---
      try {
        await this.userService.createEmployee(employee).toPromise();
        // Optional: success toast
        this.toast.show(`Employee ${firstName} ${lastName} added successfully`, 'success');
      } catch (err: any) {
        this.excelErrors.push(`Error adding ${firstName} ${lastName}: ${err.message}`);
      }
    }

    // --- Show modal if there are errors ---
    if (this.excelErrors.length > 0) {
      this.showErrorModal = true;
    } else {
      this.toast.show('All employees uploaded successfully!', 'success');
    }

    this.loadData(); // Reload employee data
  }

  submitForm() {
    // --- STEP 1: Clear all dynamic validators and re-apply them based on current mode and data ---
    this.employeeForm.get('employee_id')?.clearValidators();
    this.employeeForm.get('password')?.clearValidators();
    this.employeeForm.get('department_id')?.clearValidators();

    // Re-apply static validators (always required)
    this.employeeForm
      .get('first_name')
      ?.setValidators([
        Validators.required,
        Validators.pattern(/^[A-Za-z\s]+$/),
        this.noWhitespaceValidator,
      ]);
    this.employeeForm
      .get('last_name')
      ?.setValidators([
        Validators.required,
        Validators.pattern(/^[A-Za-z\s]+$/),
        this.noWhitespaceValidator,
      ]);
    this.employeeForm
      .get('email')
      ?.setValidators([Validators.required, Validators.email, this.noWhitespaceValidator]);
    this.employeeForm.get('role_id')?.setValidators([Validators.required]);

    // Re-apply conditional validators
    if (!this.isEditMode) {
      // Create mode
      this.employeeForm
        .get('employee_id')
        ?.setValidators([Validators.required, Validators.pattern(/^\S+$/)]);
      this.employeeForm
        .get('password')
        ?.setValidators([Validators.required, this.noWhitespaceValidator]);
    } else {
      // Edit mode: employee_id is not required, but no spaces if entered
      this.employeeForm.get('employee_id')?.setValidators([Validators.pattern(/^\S+$/)]);
      // Password is optional in edit mode, but if entered, no whitespace
      if (this.employeeForm.get('password')?.value) {
        this.employeeForm.get('password')?.setValidators([this.noWhitespaceValidator]);
      }
    }

    if (this.hasDepartments) {
      this.employeeForm.get('department_id')?.setValidators([Validators.required]);
    }

    // --- STEP 2: Update validity for all controls ---
    // Ensure all controls' validators are re-evaluated
    Object.keys(this.employeeForm.controls).forEach((key) => {
      this.employeeForm.get(key)?.updateValueAndValidity();
    });

    // --- STEP 3: Check overall form validity ---
    if (this.employeeForm.invalid) {
      this.toast.show('Please correct the form errors.', 'error');
      // Mark all fields as touched to display errors
      this.employeeForm.markAllAsTouched();
      return;
    }

    const employee = { ...this.employeeForm.value };
    if (this.isEditMode && !employee.password) {
      delete employee.password; // Don't send empty password if not changed in edit mode
    }

    // Handle department_id for branches without departments
    if (!this.hasDepartments && this.role === 'BRANCH_ADMIN') {
      employee.department_id = null; // Ensure department_id is null if not applicable
    }

    // Assign branch/head office
    if (this.role === 'HO_ADMIN') {
      employee.head_office_id = this.userAssignment.head_office_id || this.userAssignment.id;
      employee.branch_id = null;
    } else if (this.role === 'BRANCH_ADMIN') {
      employee.branch_id = this.userAssignment.branch_id || this.userAssignment.id;
      employee.head_office_id = null;
    }

    if (this.isEditMode && this.editEmployeeId !== null) {
      this.userService.updateEmployee(this.editEmployeeId, employee).subscribe({
        next: () => {
          this.toast.show('Employee updated successfully!', 'success');
          this.loadData();
          this.resetForm();
        },
        error: (err) => {
          this.toast.show(
            'Error updating employee: ' + (err.error?.message || err.message),
            'error'
          );
          console.error('Error updating employee:', err);
        },
      });
    } else {
      this.userService.createEmployee(employee).subscribe({
        next: () => {
          this.toast.show('Employee created successfully!', 'success');
          this.loadData();
          this.resetForm();
        },
        error: (err) => {
          this.toast.show(
            'Error creating employee: ' + (err.error?.message || err.message),
            'error'
          );
          console.error('Error creating employee:', err);
        },
      });
    }
  }

  editEmployee(emp: any) {
    this.isEditMode = true;
    this.editEmployeeId = emp.id;
    this.showForm = true;
    this.scrollToForm = true;

    // Clear password and employee_id validators specific to create mode
    this.employeeForm.get('employee_id')?.clearValidators();
    this.employeeForm.get('employee_id')?.setValidators([Validators.pattern(/^\S+$/)]); // Allow empty but no spaces if entered
    this.employeeForm.get('password')?.clearValidators(); // Password becomes optional in edit mode

    // First, handle roles based on whether the branch has departments
    if (this.hasDepartments && emp.department_id) {
      this.loadRolesForDepartment(emp.department_id);
    } else if (!this.hasDepartments) {
      this.roles = [...this.allRoles];
    } else {
      this.roles = [];
    }

    // Patch values after ensuring `roles` array is populated
    setTimeout(() => {
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
        password: '', // Always clear password field on edit for security
        can_create_circular: emp.can_create_circular,
        can_approve_circular: emp.can_approve_circular,
      });

      this.checkDepartmentValidation(); // Re-evaluate department validation
      this.cdr.detectChanges(); // Force change detection
    }, 0);
  }

  deleteEmployee(id: number) {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    // Implement your delete service call here
    // this.userService.deleteEmployee(id).subscribe({
    //   next: () => {
    //     this.toast.show('Employee deleted successfully!', 'success');
    //     this.loadData();
    //   },
    //   error: (err) => {
    //     this.toast.show('Error deleting employee: ' + (err.error?.message || err.message), 'error');
    //     console.error('Error deleting employee:', err);
    //   },
    // });
    this.toast.show('Delete functionality not implemented yet.', 'info');
  }

  resetForm() {
    this.isEditMode = false;
    this.editEmployeeId = null;
    this.employeeForm.reset({
      can_create_circular: false,
      can_approve_circular: false,
      department_id: '',
      branch_id: '',
      role_id: '',
      password: '',
      employee_id: '', // Ensure employee_id is reset
    });

    // Explicitly clear validators for dynamic fields
    this.employeeForm.get('employee_id')?.clearValidators();
    this.employeeForm.get('password')?.clearValidators();
    this.employeeForm.get('department_id')?.clearValidators();

    // Re-apply initial validators that were present on form creation (e.g., first_name, last_name, email, role_id)
    this.employeeForm
      .get('first_name')
      ?.setValidators([
        Validators.required,
        Validators.pattern(/^[A-Za-z\s]+$/),
        this.noWhitespaceValidator,
      ]);
    this.employeeForm
      .get('last_name')
      ?.setValidators([
        Validators.required,
        Validators.pattern(/^[A-Za-z\s]+$/),
        this.noWhitespaceValidator,
      ]);
    this.employeeForm
      .get('email')
      ?.setValidators([Validators.required, Validators.email, this.noWhitespaceValidator]);
    this.employeeForm.get('role_id')?.setValidators([Validators.required]);

    // Apply default `required` for employee_id and password if back to add mode
    this.employeeForm
      .get('employee_id')
      ?.setValidators([Validators.required, Validators.pattern(/^\S+$/)]);
    this.employeeForm
      .get('password')
      ?.setValidators([Validators.required, this.noWhitespaceValidator]);

    // Apply department_id required validator if departments exist
    if (this.hasDepartments) {
      this.employeeForm.get('department_id')?.setValidators([Validators.required]);
    }

    Object.keys(this.employeeForm.controls).forEach((key) => {
      this.employeeForm.get(key)?.updateValueAndValidity();
    });

    this.roles = []; // Clear filtered roles
    if (!this.hasDepartments) {
      this.roles = [...this.allRoles];
    }
    this.showForm = false;
  }
}
