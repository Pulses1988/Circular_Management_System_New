import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  NgModel,
  ReactiveFormsModule,
  Validators,
  AsyncValidatorFn, // Import AsyncValidatorFn
  AbstractControl, // Import AbstractControl
} from '@angular/forms';
import { User } from '../../services/user';
import { Toast } from '../../toast/toast';
import { CommonModule, DatePipe, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, map, debounceTime, switchMap, of, take } from 'rxjs'; // Import necessary RxJS operators
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-employee-mangement',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, MatIconModule, DatePipe],
  templateUrl: './employee-mangement.html',
  styleUrl: './employee-mangement.scss',
})
export class EmployeeMangement {
  employees: any[] = [];
  allRoles: any[] = [];
  roles: any[] = [];
  departments: any[] = [];
  branches: any[] = [];
  hasDepartments: boolean = true;

  employeeForm: FormGroup;
  showPassword: boolean = false;
  showForm = false;
  isEditMode = false;
  editEmployeeId: number | null = null;
  originalEmail: string | null = null; // Store original email for edit mode
  originalEmployeeId: string | null = null; // Store original employee ID for edit mode
  originalPhoneNo: string | null = null; // Store original phone for edit mode

  itemsPerPageOptions = [5, 10, 20];
  itemsPerPage = 5;
  currentPage = 1;

  role: any;
  userAssignment: any;

  showErrorModal = false;
  excelErrors: string[] = [];
  searchTerm: string = '';
  selectedDepartment: string = 'all';
  filteredEmployees: any[] = [];
  isLoading: boolean = false;

  @ViewChild('employeeFormRef') employeeFormRef!: ElementRef;
  private scrollToForm = false;
  private destroy$ = new Subject<void>();

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
      middle_name: ['', Validators.pattern(/^[A-Za-z\s]*$/)],
      last_name: [
        '',
        [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/), this.noWhitespaceValidator],
      ],
      email: ['', [Validators.required, Validators.email, this.noWhitespaceValidator]],
      phone_no: [
        '',
        [
          Validators.pattern(/^[0-9]*$/),
          Validators.maxLength(10),
          Validators.minLength(10),
          Validators.required,
        ],
      ],
      role_id: ['', Validators.required],
      department_id: [''],
      branch_id: [''],
      employee_id: [
        '',
        [Validators.required, Validators.pattern(/^\S+$/)], // no spaces
      ],
      password: ['', [Validators.required, this.passwordValidator]],
      can_create_circular: [false],
      can_approve_circular: [false],
    });
  }

  noWhitespaceValidator(control: AbstractControl) {
    // Use AbstractControl for type safety
    if (control.value && typeof control.value === 'string' && control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  }

  passwordValidator(control: AbstractControl) {
    const value: string = control.value || '';
    // Regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    if (!pattern.test(value)) {
      return { invalidPassword: true };
    }
    return null;
  }

  ngOnInit(): void {
    this.role = localStorage.getItem('role');
    this.userAssignment = localStorage.getItem('userAssignment')
      ? JSON.parse(localStorage.getItem('userAssignment')!)
      : null;

    this.isLoading = true;

    this.loadData();

    this.employeeForm
      .get('department_id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (this.hasDepartments && value) {
          this.loadRolesForDepartment(value);
        } else if (!this.hasDepartments) {
          this.roles = [...this.allRoles];
        } else {
          this.roles = [];
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
        this.checkDepartmentValidation();
      });
  }

  applyFilters(): void {
    this.filteredEmployees = this.employees.filter((emp) => {
      // Search filter
      const matchesSearch =
        !this.searchTerm ||
        (emp.first_name &&
          emp.first_name.toLowerCase().startsWith(this.searchTerm.toLowerCase())) ||
        (emp.last_name && emp.last_name.toLowerCase().startsWith(this.searchTerm.toLowerCase())) ||
        (emp.employee_id && emp.employee_id.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Department filter - handle null department_id
      const matchesDepartment =
        this.selectedDepartment === 'all' ||
        (emp.department_id && emp.department_id === parseInt(this.selectedDepartment)) ||
        (!emp.department_id && this.selectedDepartment === 'all');

      return matchesSearch && matchesDepartment;
    });

    // Reset to first page when filters change
    this.currentPage = 1;
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
    this.isLoading = true;
    if (this.role === 'HO_ADMIN') {
      this.userService.getDepartmentsByHeadOffice(this.userAssignment.id).subscribe((data) => {
        this.departments = data;
        this.hasDepartments = data.length > 0;
        this.checkDepartmentValidation();
      });

      this.userService.getRolesByHeadOffice(this.userAssignment.id).subscribe((data) => {
        this.allRoles = data;
        if (!this.hasDepartments) {
          this.roles = [...this.allRoles];
        }
      });

      this.userService.getEmployeeByHeadOfficeId(this.userAssignment.id).subscribe((data: any) => {
        this.employees = data;
        this.applyFilters(); // Apply filters after loading data
        this.isLoading = false;
      });
    } else if (this.role === 'BRANCH_ADMIN') {
      this.userService.getBranchById(this.userAssignment.id).subscribe((branch: any) => {
        this.branches = [branch];
      });

      this.userService.getDepartmentsByBranch(this.userAssignment.id).subscribe((data) => {
        this.departments = data;
        this.hasDepartments = data.length > 0;
        this.checkDepartmentValidation();
      });

      this.userService.getRolesByBranch(this.userAssignment.id).subscribe((data) => {
        this.allRoles = data;
        if (!this.hasDepartments) {
          this.roles = [...this.allRoles];
        }
      });

      this.userService.getEmployeeByBranchId(this.userAssignment.id).subscribe((data: any) => {
        this.employees = data;
        this.applyFilters(); // Apply filters after loading data
        this.isLoading = false;
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
    return Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
  }

  // Update the paginatedEmployees method to use filteredEmployees
  paginatedEmployees() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredEmployees.slice(start, start + this.itemsPerPage);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  // ---------------------------READ EXCEL FILE AND SAVE THE DATA---------------------------------

  onFileChange(event: any) {
    this.excelErrors = [];
    this.showErrorModal = false;

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const binaryData = e.target.result;
      const workbook = XLSX.read(binaryData, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      this.validateAndSaveExcelData(data);

      event.target.value = '';
    };
    reader.readAsBinaryString(file);
  }

  downloadSampleExcel() {
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
      columns.push('Branch');
      if (this.hasDepartments) {
        columns.push('Department');
      }
    } else if (this.role === 'HO_ADMIN') {
      if (this.hasDepartments) {
        columns.push('Department');
      }
    }

    columns.push('Can Create Circular', 'Can Approve Circular');

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
          exampleRow[col] = 'Pass@123';
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

    const worksheet = XLSX.utils.json_to_sheet([exampleRow], { header: columns });

    columns.forEach((col, idx) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
      if (!worksheet[cellAddress]) return;
      worksheet[cellAddress].s = {
        font: { bold: true },
        alignment: { horizontal: 'center' },
      };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Template');
    XLSX.writeFile(workbook, 'Employee_Upload_Sample.xlsx');
  }

  async validateAndSaveExcelData(data: any[]) {
    this.excelErrors = [];

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

      // Basic validation for required fields (can be expanded)
      if (!firstName || !lastName || !email || !employeeId || !password || !roleName) {
        this.excelErrors.push(
          `Row skipped: Missing required fields for employee: ${firstName || 'N/A'} ${
            lastName || 'N/A'
          }`
        );
        continue;
      }

      // Email format validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.excelErrors.push(`Invalid email format for employee ${firstName} ${lastName}`);
        continue;
      }

      // Phone number format validation (if phone is provided)
      if (phone && !/^[0-9]{10}$/.test(phone)) {
        this.excelErrors.push(`Invalid phone number format for employee ${firstName} ${lastName}`);
        continue;
      }

      // Employee ID format validation (no spaces)
      if (/\s/.test(employeeId)) {
        this.excelErrors.push(`Employee ID cannot contain spaces for ${firstName} ${lastName}`);
        continue;
      }
      if (!/(?=.*[A-Za-z])(?=.*\d).+/.test(password)) {
        this.excelErrors.push(
          `The password must contain at least one capital letter, one special character, and one number for employee ${firstName} ${lastName}.`
        );
        continue;
      }

      // --- Duplicate Checks (Frontend Pre-check, Backend is final) ---
      let isDuplicate = false;
      try {
        const emailExists = await this.userService.checkEmployeeEmailExists(email).toPromise();
        if (emailExists) {
          this.excelErrors.push(`Email "${email}" already exists for ${firstName} ${lastName}`);
          isDuplicate = true;
        }
        const employeeIdExists = await this.userService
          .checkEmployeeIdExists(employeeId)
          .toPromise();
        if (employeeIdExists) {
          this.excelErrors.push(
            `Employee ID "${employeeId}" already exists for ${firstName} ${lastName}`
          );
          isDuplicate = true;
        }
        if (phone) {
          const phoneExists = await this.userService.checkEmployeePhoneNoExists(phone).toPromise();
          if (phoneExists) {
            this.excelErrors.push(
              `Phone number "${phone}" already exists for ${firstName} ${lastName}`
            );
            isDuplicate = true;
          }
        }
      } catch (checkError) {
        this.excelErrors.push(
          `Error during duplicate check for ${firstName} ${lastName}: ${checkError}`
        );
        continue;
      }

      if (isDuplicate) {
        continue;
      }

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
        validRole = this.allRoles.find(
          (r) =>
            r.name.toLowerCase() === roleName?.toLowerCase() && r.department_id === departmentId
        );
      } else {
        validRole = this.allRoles.find((r) => r.name.toLowerCase() === roleName?.toLowerCase());
      }

      if (!validRole) {
        this.excelErrors.push(
          `Role "${roleName}" not found (or not in selected department "${departmentName}") for employee ${firstName} ${lastName}`
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
        this.toast.show(`Employee ${firstName} ${lastName} added successfully`, 'success');
      } catch (err: any) {
        this.excelErrors.push(`Error adding ${firstName} ${lastName}: ${err.message}`);
      }
    }

    if (this.excelErrors.length > 0) {
      this.showErrorModal = true;
    } else {
      this.toast.show('All employees uploaded successfully!', 'success');
    }

    this.loadData();
  }

  async submitForm() {
    this.employeeForm.markAllAsTouched();

    if (!this.employeeForm.valid) {
      this.toast.show('Please correct the form errors.', 'error');
      return;
    }

    const { email, phone_no, employee_id } = this.employeeForm.value;

    // --- Duplicate checks ---
    if (!this.isEditMode || email !== this.originalEmail) {
      const emailExists = await this.userService.checkEmployeeEmailExists(email).toPromise();
      if (emailExists) {
        this.employeeForm.get('email')?.setErrors({ emailTaken: true });
        return;
      }
    }

    if (phone_no && (!this.isEditMode || phone_no !== this.originalPhoneNo)) {
      const phoneExists = await this.userService.checkEmployeePhoneNoExists(phone_no).toPromise();
      if (phoneExists) {
        this.employeeForm.get('phone_no')?.setErrors({ phoneNoTaken: true });
        return;
      }
    }

    if (!this.isEditMode || employee_id !== this.originalEmployeeId) {
      const employeeIdExists = await this.userService
        .checkEmployeeIdExists(employee_id)
        .toPromise();
      if (employeeIdExists) {
        this.employeeForm.get('employee_id')?.setErrors({ employeeIdTaken: true });
        return;
      }
    }

    // --- Prepare employee object ---
    const employee = { ...this.employeeForm.value };
    if (this.isEditMode && !employee.password) delete employee.password;

    if (this.role === 'HO_ADMIN') {
      employee.head_office_id = this.userAssignment.head_office_id || this.userAssignment.id;
      employee.branch_id = null;
    } else if (this.role === 'BRANCH_ADMIN') {
      employee.branch_id = this.userAssignment.branch_id || this.userAssignment.id;
      employee.head_office_id = null;
    }

    // --- Submit data ---
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
        },
      });
    }
  }

  editEmployee(emp: any) {
    this.isEditMode = true;
    this.editEmployeeId = emp.id;
    this.showForm = true;
    this.scrollToForm = true;

    // Store original values for duplicate checks in edit mode
    this.originalEmail = emp.email;
    this.originalEmployeeId = emp.employee_id;
    this.originalPhoneNo = emp.phone_no;

    this.employeeForm.get('employee_id')?.clearValidators();
    this.employeeForm.get('employee_id')?.setValidators([Validators.pattern(/^\S+$/)]);
    this.employeeForm.get('password')?.clearValidators();

    // Clear and re-apply async validators for edit mode
    this.employeeForm.get('email')?.clearAsyncValidators();
    this.employeeForm.get('email')?.setAsyncValidators([this.emailDuplicateValidator()]);
    this.employeeForm.get('phone_no')?.clearAsyncValidators();
    this.employeeForm.get('phone_no')?.setAsyncValidators([this.phoneNoDuplicateValidator()]);
    this.employeeForm.get('employee_id')?.clearAsyncValidators();
    this.employeeForm.get('employee_id')?.setAsyncValidators([this.employeeIdDuplicateValidator()]);

    if (this.hasDepartments && emp.department_id) {
      this.loadRolesForDepartment(emp.department_id);
    } else if (!this.hasDepartments) {
      this.roles = [...this.allRoles];
    } else {
      this.roles = [];
    }

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
        password: '',
        can_create_circular: emp.can_create_circular,
        can_approve_circular: emp.can_approve_circular,
      });

      this.checkDepartmentValidation();
      this.cdr.detectChanges();
    }, 0);
  }

  deleteEmployee(id: number) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    this.toast.show('Delete functionality not implemented yet.', 'info');
  }

  resetForm() {
    this.isEditMode = false;
    this.editEmployeeId = null;
    this.originalEmail = null;
    this.originalEmployeeId = null;
    this.originalPhoneNo = null;

    this.employeeForm.reset({
      can_create_circular: false,
      can_approve_circular: false,
      department_id: '',
      branch_id: '',
      role_id: '',
      password: '',
      employee_id: '',
    });

    this.employeeForm.get('employee_id')?.clearValidators();
    this.employeeForm.get('password')?.clearValidators();
    this.employeeForm.get('department_id')?.clearValidators();

    this.employeeForm.get('email')?.clearAsyncValidators();
    this.employeeForm.get('phone_no')?.clearAsyncValidators();
    this.employeeForm.get('employee_id')?.clearAsyncValidators();

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

    this.employeeForm
      .get('employee_id')
      ?.setValidators([Validators.required, Validators.pattern(/^\S+$/)]);
    this.employeeForm
      .get('password')
      ?.setValidators([Validators.required, this.noWhitespaceValidator]);

    // Re-apply async validators for add mode
    this.employeeForm.get('email')?.setAsyncValidators([this.emailDuplicateValidator()]);
    this.employeeForm.get('phone_no')?.setAsyncValidators([this.phoneNoDuplicateValidator()]);
    this.employeeForm.get('employee_id')?.setAsyncValidators([this.employeeIdDuplicateValidator()]);

    if (this.hasDepartments) {
      this.employeeForm.get('department_id')?.setValidators([Validators.required]);
    }

    Object.keys(this.employeeForm.controls).forEach((key) => {
      this.employeeForm.get(key)?.updateValueAndValidity();
    });

    this.roles = [];
    if (!this.hasDepartments) {
      this.roles = [...this.allRoles];
    }
    this.showForm = false;
    this.loadData();
  }

  // --- Async Validators ---
  employeeIdDuplicateValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) {
        return of(null); // No value, no validation error
      }

      // If in edit mode and the employee_id hasn't changed, it's not a duplicate
      if (this.isEditMode && control.value === this.originalEmployeeId) {
        return of(null);
      }

      return control.valueChanges.pipe(
        debounceTime(500), // Wait for user to stop typing
        take(1), // Take only the first emission after debounce
        switchMap((value) => {
          if (!value) {
            return of(null);
          }
          return this.userService.checkEmployeeIdExists(value).pipe(
            map((isTaken) => (isTaken ? { employeeIdTaken: true } : null)),
            takeUntil(this.destroy$)
          );
        })
      );
    };
  }

  emailDuplicateValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) {
        return of(null);
      }

      // If in edit mode and the email hasn't changed, it's not a duplicate
      if (this.isEditMode && control.value === this.originalEmail) {
        return of(null);
      }

      return control.valueChanges.pipe(
        debounceTime(500),
        take(1),
        switchMap((value) => {
          if (!value) {
            return of(null);
          }
          return this.userService.checkEmployeeEmailExists(value).pipe(
            map((isTaken) => (isTaken ? { emailTaken: true } : null)),
            takeUntil(this.destroy$)
          );
        })
      );
    };
  }

  phoneNoDuplicateValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) {
        return of(null);
      }

      // If in edit mode and the phone number hasn't changed, it's not a duplicate
      if (this.isEditMode && control.value === this.originalPhoneNo) {
        return of(null);
      }

      return control.valueChanges.pipe(
        debounceTime(500),
        take(1),
        switchMap((value) => {
          if (!value) {
            return of(null);
          }
          // Only check if phone_no has 10 digits
          if (value && value.length === 10 && /^[0-9]{10}$/.test(value)) {
            return this.userService.checkEmployeePhoneNoExists(value).pipe(
              map((isTaken) => (isTaken ? { phoneNoTaken: true } : null)),
              takeUntil(this.destroy$)
            );
          }
          return of(null); // Not 10 digits or invalid format, skip duplicate check
        })
      );
    };
  }
}
