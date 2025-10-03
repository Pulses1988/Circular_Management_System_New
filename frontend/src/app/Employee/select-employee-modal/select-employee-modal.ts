import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee-service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  department_id: number;
}

interface Department {
  id: number;
  name: string;
}

@Component({
  selector: 'app-select-employee-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatListModule,
    MatChipsModule,
    MatIconModule,
  ],
  templateUrl: './select-employee-modal.html',
  styleUrls: ['./select-employee-modal.scss'],
})
export class SelectEmployeeModal implements OnInit {
  form!: FormGroup;
  departments: Department[] = [];
  branchDepartments: Department[] = [];
  branches: any[] = [];
  employees: Employee[] = [];
  branchDepartmentsEmployee: Employee[] = [];
  allEmployees: Employee[] = [];
  selectedEmployees: Employee[] = []; // Only array for selected employees
  employee: any;
  selectedDepartmentId: number | null = null;
  selectedBranchId: number | null = null;
  hasBranchDepartments: boolean = false;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    public dialogRef: MatDialogRef<SelectEmployeeModal>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      department: [''],
      branch: [''],
      branchDepartment: [''],
    });

    this.loadLoggedInEmployee();

    // Update employee list on department change
    this.form.get('department')?.valueChanges.subscribe((deptId) => {
      this.selectedDepartmentId = deptId;
      if (deptId) {
        this.employees = this.allEmployees.filter((emp) => emp.department_id === deptId);
      } else {
        this.employees = [...this.allEmployees];
      }
    });

    // Branch selection
    this.form.get('branch')?.valueChanges.subscribe((branchId) => {
      this.selectedBranchId = branchId;

      if (branchId) {
        this.employeeService.getDepartmentsByBranch(branchId).subscribe((branchDept) => {
          this.branchDepartments = branchDept;
          this.hasBranchDepartments = branchDept.length > 0;

          // Reset branchDepartment selection
          this.form.get('branchDepartment')?.setValue('');

          if (this.hasBranchDepartments) {
            // Subscribe to branchDepartment changes dynamically
            this.form.get('branchDepartment')?.valueChanges.subscribe((branchDeptId) => {
              if (branchDeptId) {
                this.employeeService.getEmployeesByDepartment(branchDeptId).subscribe((emps) => {
                  this.branchDepartmentsEmployee = emps as Employee[];
                  console.log();
                  
                });
              } else {
                this.branchDepartmentsEmployee = [];
              }
            });
          } else {
            // Branch has no departments, fetch employees directly
            this.employeeService.getEmployeeByBranchId(branchId).subscribe((emps) => {
              this.branchDepartmentsEmployee = emps as Employee[];
              console.log(emps);
            });
          }
        });
      } else {
        this.hasBranchDepartments = false;
        this.branchDepartments = [];
        this.branchDepartmentsEmployee = [];
      }
    });
  }

  private decryptData(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch {
      return '';
    }
  }

  private loadLoggedInEmployee(): void {
    const encryptedUser = localStorage.getItem('emp_user');
    if (encryptedUser) {
      const decryptedUser = this.decryptData(encryptedUser);
      this.employee = JSON.parse(decryptedUser);

      if (this.employee.head_office_id) {
        this.employeeService
          .getDepartmentsByHeadOffice(this.employee.head_office_id)
          .subscribe((depts) => (this.departments = depts));

        this.employeeService
          .getEmployeeByHeadOfficeId(this.employee.head_office_id)
          .subscribe((data) => {
            this.allEmployees = data as Employee[];
            this.employees = [...this.allEmployees];
          });

        this.employeeService.fetchAllBranches().subscribe((branch) => {
          this.branches = branch as any;
        });
      }
    }
  }

  // Check if employee is selected
  isSelected(empId: number): boolean {
    return this.selectedEmployees.some((e) => e.id === empId);
  }

  // Toggle employee selection
  toggleEmployee(emp: Employee): void {
    const index = this.selectedEmployees.findIndex((e) => e.id === emp.id);
    if (index > -1) {
      this.selectedEmployees.splice(index, 1);
    } else {
      this.selectedEmployees.push(emp);
    }
  }

  // Remove employee from chip
  removeEmployee(emp: Employee): void {
    const index = this.selectedEmployees.findIndex((e) => e.id === emp.id);
    if (index > -1) this.selectedEmployees.splice(index, 1);
  }

  confirmSelection() {
    this.dialogRef.close(this.selectedEmployees); // Only array of employees
  }

  closeDialog() {
    this.dialogRef.close();
  }

  getDepartmentName(deptId: number): string {
    return this.departments.find((d) => d.id === deptId)?.name || '';
  }
}
