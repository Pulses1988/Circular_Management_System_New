import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee-service';
import { User } from '../../services/user';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  department_id: number;
}

interface Department {
  id: number;
  name: string;
}

interface HeadOffice {
  id: number;
  name: string;
}

interface Region {
  id: number;
  name: string;
}

interface Zone {
  id: number;
  name: string;
}

interface Circle {
  circle_id: number;
  circle_name: string;
}

interface Role {
  id: number;
  name: string;
   role_level?: string;
  // Variables for adding department in role
  department_name?: string;
}

interface Designation {
  id: number;
  name: string;
}

interface Committee {
  id: number;
  committee_name: string;
}

@Component({
  selector: 'app-select-employee-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatListModule,
    MatChipsModule,
    MatInputModule,   // <-- ADD THIS
    MatIconModule
  ],
  templateUrl: './select-employee-modal.html',
  styleUrls: ['./select-employee-modal.scss']
})
export class SelectEmployeeModal implements OnInit {

  form!: FormGroup;

  // =========================================================
  // BASIC DATA
  // =========================================================

  departments: Department[] = [];
  branchDepartments: Department[] = [];
  branches: any[] = [];

  headOffices: HeadOffice[] = [];
  regions: Region[] = [];
  zones: Zone[] = [];
  circles: Circle[] = [];

  roles: Role[] = [];

  // =========================================================
  // DESIGNATION
  // =========================================================

  designations: Designation[] = [];

  selectedDesignationIds: number[] = [];

  isLoadingDesignationEmployees = false;

  private designationSelectionRequest = 0;

  // IMPORTANT:
  // Employees loaded for DESIGNATION_WISE selection
  // are stored separately here.
  designationEmployeeList: Employee[] = [];

  // =========================================================
  // COMMITTEE
  // =========================================================

  committees: Committee[] = [];

  selectedCommitteeIds: number[] = [];

  isLoadingCommitteeEmployees = false;

  private committeeSelectionRequest = 0;

  // =========================================================
  // EMPLOYEES
  // =========================================================

  employees: Employee[] = [];

  branchDepartmentsEmployee: Employee[] = [];

  allEmployees: Employee[] = [];

  selectedEmployees: Employee[] = []; 

employeeSearchText = '';

  employee: any;

  // =========================================================
  // DEPARTMENT / BRANCH
  // =========================================================

  selectedDepartmentId: number | null = null;

  selectedBranchId: number | null = null;

  hasBranchDepartments = false;

  // =========================================================
  // HEAD OFFICE / REGION / ZONE / CIRCLE / BRANCH
  // =========================================================

  selectedHeadOfficeIds: number[] = [];

  selectedRegionIds: number[] = [];

  selectedZoneIds: number[] = [];

  selectedCircleIds: number[] = [];

  selectedBranchIds: number[] = [];

  // =========================================================
  // ROLE
  // =========================================================

  selectedRoleIds: number[] = [];

  isLoadingRoleEmployees = false;

  private roleSelectionRequest = 0;

  private confirmRoleSelectionWhenLoaded = false;

  // =========================================================
  // LOADING FLAGS
  // =========================================================

  isLoadingHeadOfficeEmployees = false;

  isLoadingRegionEmployees = false;

  isLoadingZoneEmployees = false;

  isLoadingCircleEmployees = false;

  isLoadingBranchEmployees = false;

  // =========================================================
// HIERARCHICAL REGION SELECTION
// =========================================================

showZoneQuestion = false;
showZoneSelection = false;
selectedZoneWise: boolean | null = null;



// CIRCLE selection
showCircleQuestion = false;
showCircleSelection = false;
selectedCircleWise: boolean | null = null;


// BRANCH selection
showBranchQuestion = false;
showBranchSelection = false;
selectedBranchWise: boolean | null = null;


// =========================================================
// DEPARTMENT SELECTION UNDER BRANCH
// =========================================================

showDepartmentQuestion = false;
showDepartmentSelection = false;
selectedDepartmentWise: boolean | null = null;
selectedDepartmentIds: number[] = [];
departmentsForSelectedBranches: any[] = [];


  // =========================================================
  // REQUEST TRACKING
  // =========================================================

  private headOfficeSelectionRequest = 0;

  private regionSelectionRequest = 0;

  private zoneSelectionRequest = 0;

  private circleSelectionRequest = 0;

  private branchSelectionRequest = 0;

  private confirmRegionSelectionWhenLoaded = false;

  private confirmZoneSelectionWhenLoaded = false;

  private confirmCircleSelectionWhenLoaded = false;

  private confirmBranchSelectionWhenLoaded = false;

  // =========================================================
  // SELECTION
  // =========================================================

  initialSelection: Employee[] = [];

  selectAllEmployees = false;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private userService: User,
    public dialogRef: MatDialogRef<SelectEmployeeModal>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  // =========================================================
  // NG ON INIT
  // =========================================================

  ngOnInit(): void {

    this.form = this.fb.group({

      department: [''],

      branch: [''],

      branchDepartment: [''],

      headOffice: [[]],

      region: [[]],

      zone: [[]],

      circle: [[]],

      branchWise: [[]],

      role: [[]],

      designation: [[]],

      committee: [[]],
       
      branchDepartmentWise: [[]],
     
       employeeSearch: [''], 
       
        // MD / CEO top-level employees
  topEmployee: [[]]

    }); 

  // =======================================================
  // USER WISE
  // =======================================================

  if (this.isUserWiseSelection()) {

    this.loadAllEmployees();

    return;
  }


    // =======================================================
    // HEAD OFFICE
    // =======================================================

    if (this.isHeadOfficeSelection()) {

      this.loadHeadOffices();

      this.form
        .get('headOffice')
        ?.valueChanges
        .subscribe((headOfficeIds) => {

          this.selectedHeadOfficeIds =
            headOfficeIds || [];

          this.loadHeadOfficeEmployees();

        });

      return;
    }


    // =======================================================
    // REGION
    // =======================================================

if (this.isRegionWiseSelection()) {

  this.loadRegions();
  this.form
  .get('region')
  ?.valueChanges
  .subscribe((regionIds) => {

    this.selectedRegionIds = regionIds || [];

    // =========================
    // RESET ZONE
    // =========================

    this.selectedZoneIds = [];

    this.form
      .get('zone')
      ?.setValue([], {
        emitEvent: false
      });

    this.selectedZoneWise = null;
    this.showZoneSelection = false;

    // =========================
    // RESET CIRCLE
    // =========================

    this.selectedCircleIds = [];

    this.form
      .get('circle')
      ?.setValue([], {
        emitEvent: false
      });

    this.selectedCircleWise = null;
    this.showCircleQuestion = false;
    this.showCircleSelection = false;

    // =========================
    // SHOW ZONE QUESTION
    // =========================

    this.showZoneQuestion =
      this.selectedRegionIds.length > 0;

    // this.selectedEmployees = []; 

if (this.selectedRegionIds.length > 0) {
  this.loadRegionEmployees();
} else {
  this.selectedEmployees = [];
}

  });


  
// Code for the If we selected non in zone 

this.form
  .get('zone')
  ?.valueChanges
  .subscribe((zoneIds) => {

    let values = zoneIds || [];

    // If NONE is selected, hide all further questions
    if (values.includes('NONE')) {
      values = ['NONE'];

      this.form
        .get('zone')
        ?.setValue(values, { emitEvent: false });

      this.selectedZoneIds = [];
      this.selectedCircleIds = [];
      this.form.get('circle')?.setValue([], { emitEvent: false });
      this.selectedCircleWise = null;
      this.showCircleQuestion = false;
      this.showCircleSelection = false;

      this.selectedBranchIds = [];
      this.form.get('branchWise')?.setValue([], { emitEvent: false });
      this.selectedBranchWise = null;
      this.showBranchQuestion = false;
      this.showBranchSelection = false;

      this.selectedDepartmentIds = [];
      this.form.get('branchDepartmentWise')?.setValue([], { emitEvent: false });
      this.selectedDepartmentWise = null;
      this.showDepartmentQuestion = false;
      this.showDepartmentSelection = false;
      this.departmentsForSelectedBranches = [];
      this.selectedEmployees = [];
      return;
    }

    this.selectedZoneIds =
      values;

    console.log(
      'Selected Zones:',
      this.selectedZoneIds
    );

    // =========================
    // RESET CIRCLE
    // =========================

    this.selectedCircleIds = [];

    this.form
      .get('circle')
      ?.setValue([]);

    this.selectedCircleWise = null;

    this.showCircleSelection = false;

    // =========================
    // SHOW CIRCLE QUESTION
    // ONLY WHEN ZONE IS SELECTED
    // =========================

    this.showCircleQuestion =
      this.selectedZoneIds.length > 0;

    // =========================
    // LOAD ZONE EMPLOYEES
    // =========================

    this.loadZoneEmployees();

  });


  //For circle load employee

  this.form
  .get('circle')
  ?.valueChanges
  .subscribe((circleIds) => {

    let values = circleIds || [];

    // If NONE is selected, hide all further questions
    if (values.includes('NONE')) {
      values = ['NONE'];
      this.form.get('circle')?.setValue(values, { emitEvent: false });
      this.selectedCircleIds = [];

      this.selectedBranchIds = [];
      this.form.get('branchWise')?.setValue([], { emitEvent: false });
      this.selectedBranchWise = null;
      this.showBranchQuestion = false;
      this.showBranchSelection = false;

      this.selectedDepartmentIds = [];
      this.form.get('branchDepartmentWise')?.setValue([], { emitEvent: false });
      this.selectedDepartmentWise = null;
      this.showDepartmentQuestion = false;
      this.showDepartmentSelection = false;
      this.departmentsForSelectedBranches = [];
      this.selectedEmployees = [];
      return;
    }

    console.log('========== CIRCLE SELECTED ==========');
    console.log('circleIds from dropdown:', circleIds);
    console.log('circleIds type:', typeof circleIds);

    this.selectedCircleIds =
      values;

    console.log(
      'Selected Circles:',
      this.selectedCircleIds
    );

    // =========================
    // RESET BRANCH
    // =========================

    this.selectedBranchIds = [];

    this.form
      .get('branchWise')
      ?.setValue([]);

    this.selectedBranchWise = null;

    this.showBranchSelection = false;

    // =========================
    // SHOW BRANCH QUESTION
    // ONLY WHEN CIRCLE IS SELECTED
    // =========================

    this.showBranchQuestion =
      this.selectedCircleIds.length > 0; 



 // =========================
    // RESET DEPARTMENT
    // =========================

    this.selectedDepartmentIds = [];

    this.form
      .get('branchDepartmentWise')
      ?.setValue([]);

    this.selectedDepartmentWise = null;

    this.showDepartmentQuestion = false;
    this.showDepartmentSelection = false;

    this.departmentsForSelectedBranches = [];


    // =========================
    // LOAD CIRCLE EMPLOYEES
    // =========================

    this.loadCircleEmployees();

  });



// =======================================================
// BRANCH SELECTION UNDER CIRCLE
// =======================================================

this.form
  .get('branchWise')
  ?.valueChanges
  .subscribe((branchIds) => {

    let values = branchIds || [];

    // If NONE is selected, hide all further questions
    if (values.includes('NONE')) {
      values = ['NONE'];
      this.form.get('branchWise')?.setValue(values, { emitEvent: false });
      this.selectedBranchIds = [];

      this.selectedDepartmentIds = [];
      this.form.get('branchDepartmentWise')?.setValue([], { emitEvent: false });
      this.selectedDepartmentWise = null;
      this.showDepartmentQuestion = false;
      this.showDepartmentSelection = false;
      this.departmentsForSelectedBranches = [];
      this.selectedEmployees = [];
      return;
    }

    this.selectedBranchIds =
      values;

    console.log(
      'Selected Branches under Circle:',
      this.selectedBranchIds
    );


    // =========================
    // RESET DEPARTMENT
    // =========================

    this.selectedDepartmentIds = [];

    this.form
      .get('branchDepartmentWise')
      ?.setValue([]);

    this.selectedDepartmentWise = null;

    this.showDepartmentSelection = false;

    this.departmentsForSelectedBranches = [];


    // =========================
    // SHOW DEPARTMENT QUESTION
    // =========================

    this.showDepartmentQuestion =
      this.selectedBranchIds.length > 0;


    // =========================
    // LOAD BRANCH EMPLOYEES
    // =========================

    if (this.selectedBranchWise === true) {

      this.loadBranchWiseEmployees();

    }

  });



  this.form
  .get('branchDepartmentWise')
  ?.valueChanges
  .subscribe((departmentIds) => {

    let values = departmentIds || [];

    // If NONE is selected, stop department-wise selection
    if (values.includes('NONE')) {
      values = ['NONE'];
      this.form.get('branchDepartmentWise')?.setValue(values, { emitEvent: false });
      this.selectedDepartmentIds = [];
      this.selectedEmployees = [];
      return;
    }

    this.selectedDepartmentIds = values;

    console.log(
      'Selected Departments:',
      this.selectedDepartmentIds
    );

    // Clear previous employees
    this.selectedEmployees = [];

    if (this.selectedDepartmentIds.length === 0) {
      return;
    }

    this.loadDepartmentWiseEmployees();
  });


  return;
}



    // =======================================================
    // ZONE
    // =======================================================
if (this.isZoneWiseSelection()) {
  this.loadZones();

  this.form
    .get('zone')
    ?.valueChanges
    .subscribe((zoneIds) => {

      this.selectedZoneIds = zoneIds || [];

      this.loadZoneEmployees();
    });

  return;
}




    // =======================================================
    // CIRCLE
    // =======================================================

    if (this.isCircleWiseSelection()) {

      this.loadCircles();

      this.form
        .get('circle')
        ?.valueChanges
        .subscribe((circleIds) => {

          this.selectedCircleIds =
            circleIds || [];

          this.loadCircleEmployees();

        });

      return;
    }  


// =======================================================
// STANDALONE DEPARTMENT WISE
// =======================================================

// =======================================================
// STANDALONE DEPARTMENT WISE
// =======================================================

if (this.isDepartmentWiseSelection()) {

  this.loadAllDepartments();

  this.form
    .get('department')
    ?.valueChanges
    .subscribe((deptId) => {

      this.selectedDepartmentId = deptId;

      if (deptId) {

        this.employeeService
          .getEmployeesByDepartment(deptId)
          .subscribe((data: any) => {

            console.log(
              'Department Employees API Response:',
              data
            );

            const employeeList: Employee[] =
              Array.isArray(data)
                ? data
                : data?.data || [];

            // IMPORTANT:
            // This is the list displayed under
            // "IT Employees"
            this.employees = [...employeeList];

            // Select all employees of the department
            this.selectedEmployees = [...employeeList];

            console.log(
              'Department employees:',
              this.employees
            );

            console.log(
              'Selected employees:',
              this.selectedEmployees
            );

          });

      } else {

        this.employees = [];
        this.selectedEmployees = [];

      }

    });

  return;
}


// =======================================================
// BRANCH WISE
// =======================================================

if (this.isBranchWiseSelection()) {

  this.loadBranchWiseBranches();

  this.form 
    .get('branchWise') 
    ?.valueChanges 
    .subscribe((branchIds) => {

      this.selectedBranchIds = 
        branchIds || [];

      this.loadBranchWiseEmployees();

    });  

  return;
}




    // =======================================================
    // BRANCH WISE
    // =======================================================

    if (this.isBranchWiseSelection()) {

      this.loadBranchWiseBranches();

      this.form
        .get('branchWise')
        ?.valueChanges
        .subscribe((branchIds) => {

          this.selectedBranchIds =
            branchIds || [];

          this.loadBranchWiseEmployees();

        }); 

      return;
    } 

    // =======================================================
    // COMMITTEE WISE
    // =======================================================

    if (this.isCommitteeWiseSelection()) {

      this.loadCommittees();

      this.form
        .get('committee')
        ?.valueChanges
        .subscribe((committeeIds) => {

          this.selectedCommitteeIds =
            committeeIds || [];

          this.loadCommitteeEmployees();

        });

      return;
    }

    // =======================================================
    // DESIGNATION WISE
    // =======================================================

    if (this.isDesignationWiseSelection()) {

      this.loadDesignations();

      this.form
        .get('designation')
        ?.valueChanges
        .subscribe((designationIds) => {

          this.selectedDesignationIds =
            designationIds || [];

          this.loadDesignationEmployees();

        });

      return;
    }

    // =======================================================
    // ROLE WISE / BOARD / MD CEO / EXECUTIVE / CORPORATE
    // =======================================================

// =======================================================
// ROLE WISE / BOARD / MD CEO / CORPORATE
// =======================================================

if (
  this.isRoleWiseSelection() ||
  this.isBoardOfDirectorsSelection() ||
  this.isMdCeoSelection() ||
  this.isCorporateOfficeSelection()
) {

  this.loadRoles();

  // =====================================================
  // MD / CEO
  // =====================================================

  if (this.isMdCeoSelection()) {

    this.form
      .get('topEmployee')
      ?.valueChanges
      .subscribe((employeeIds) => {

        console.log(
          'Selected TOP Employee IDs:',
          employeeIds
        );

        const selectedIds =
          employeeIds || [];

        this.selectedEmployees =
          this.employees.filter(
            (employee: Employee) =>
              selectedIds.includes(employee.id)
          );

        console.log(
          'Selected TOP Employees:',
          this.selectedEmployees
        );

      });

  }

  // =====================================================
  // NORMAL ROLE / BOARD / CORPORATE
  // =====================================================

  else {

    this.form
      .get('role')
      ?.valueChanges
      .subscribe((roleIds) => {

        this.selectedRoleIds =
          roleIds || [];

        this.loadRoleEmployees();

      });

  }

  return;
}

    // =======================================================
    // PRE-SELECTED EMPLOYEES
    // =======================================================

    if (this.data?.preSelectedEmployees) {

      this.selectedEmployees =
        [...this.data.preSelectedEmployees];

      this.initialSelection =
        [...this.data.preSelectedEmployees];

    }

    // =======================================================
    // LOGGED IN EMPLOYEE
    // =======================================================

    this.loadLoggedInEmployee();

    // =======================================================
    // DEPARTMENT SELECTION
    // =======================================================

    this.form
      .get('department')
      ?.valueChanges
      .subscribe((deptId) => {

        this.selectedDepartmentId = deptId;

        if (deptId) {

          this.employees =
            this.allEmployees.filter(
              (emp) =>
                emp.department_id === deptId
            );

        } else {

          this.employees =
            [...this.allEmployees];

        }

      });

    // =======================================================
    // BRANCH SELECTION
    // =======================================================

    this.form
      .get('branch')
      ?.valueChanges
      .subscribe((branchId) => {

        this.selectedBranchId = branchId;

        if (branchId) {

          this.employeeService
            .getDepartmentsByBranch(branchId)
            .subscribe((branchDept) => {

              this.branchDepartments =
                branchDept;

              this.hasBranchDepartments =
                branchDept.length > 0;

              // Reset branch department
              this.form
                .get('branchDepartment')
                ?.setValue('');

              if (this.hasBranchDepartments) {

                this.form
                  .get('branchDepartment')
                  ?.valueChanges
                  .subscribe((branchDeptId) => {

                    if (branchDeptId) {

                      this.employeeService
                        .getEmployeesByDepartment(
                          branchDeptId
                        )
                        .subscribe((emps) => {

                          this.branchDepartmentsEmployee =
                            emps as Employee[];

                        });

                    } else {

                      this.branchDepartmentsEmployee =
                        [];

                    }

                  });

              } else {

                // Branch has no departments
                this.employeeService
                  .getEmployeeByBranchId(branchId)
                  .subscribe((emps) => {

                    this.branchDepartmentsEmployee =
                      emps as Employee[];

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

  // =========================================================
  // DESIGNATION METHODS
  // =========================================================

  /**
   * No separate designation API is used.
   *
   * Existing Roles API is used.
   *
   * Only these role names are displayed as Designations.
   */
  private loadDesignations(): void {

    this.userService
      .fetchAllRoles()
      .subscribe((roles: any) => {

        roles = Array.isArray(roles)
          ? roles
          : [];

        const designationNames = [

          'Manager',

          'Clerk',

          'Officer',

          'Assistant Manager',

          'Senior Officer',

          'Deputy Manager'

        ];

        this.designations =
          roles.filter((role: any) =>
            designationNames.includes(
              role.name
            )
          );

        console.log(
          'Designation list:',
          this.designations
        );

      });

  }

  // =========================================================
  // LOAD EMPLOYEES BY DESIGNATION
  // =========================================================

  private loadDesignationEmployees(): void {

    const request =
      ++this.designationSelectionRequest;

    this.selectedEmployees = [];

    // Clear old designation employees
    this.designationEmployeeList = [];

    if (
      this.selectedDesignationIds.length === 0
    ) {

      this.isLoadingDesignationEmployees =
        false;

      return;
    }

    this.isLoadingDesignationEmployees =
      true;

    const employees: Employee[] = [];

    let completed = 0;

    const finish = () => {

      completed++;

      if (
        completed ===
          this.selectedDesignationIds.length &&
        request ===
          this.designationSelectionRequest
      ) {

        // Remove duplicate employees
        this.designationEmployeeList =
          employees.filter(
            (emp, index, list) =>
              index ===
              list.findIndex(
                (e) => e.id === emp.id
              )
          );

        // Selected employees are the employees
        // belonging to the selected designation(s)
        this.selectedEmployees =
          [...this.designationEmployeeList];

        this.isLoadingDesignationEmployees =
          false;

        console.log(
          'Designation Employees:',
          this.designationEmployeeList
        );

      }

    };

    this.selectedDesignationIds.forEach(
      (designationId) => {

        /*
         * IMPORTANT:
         *
         * Designation is currently represented
         * by an existing role.
         *
         * Therefore designationId is actually
         * the role ID.
         */
        this.employeeService
          .getEmployeeByRoleId(designationId)
          .subscribe({

            next: (data: any) => {

              console.log(
                'Designation Employee API Response:',
                data
              );

              if (Array.isArray(data)) {

                employees.push(
                  ...data
                );

              }

            },

            error: (err) => {

              console.error(
                'Error loading designation employees:',
                err
              );

              finish();

            },

            complete: finish

          });

      }
    );

  }

  // =========================================================
  // ROLE METHODS
  // =========================================================

  private loadRoles(): void {

    this.userService
      .fetchAllRoles()
      .subscribe((roles: any) => {

        roles = Array.isArray(roles)
          ? roles
          : [];

        // ROLE WISE
        if (this.isRoleWiseSelection()) {

          this.roles = roles;

        }

        // BOARD OF DIRECTORS
        else if (
          this.isBoardOfDirectorsSelection()
        ) {

          this.roles =
            roles.filter((role: any) =>
              [
                'Chairman',
                'Vice Chairman',
                'Director'
              ].includes(role.name)
            );

        }

        // MD / CEO
       // MD / CEO
else if (this.isMdCeoSelection()) {

  console.log('========== MD / CEO ==========');
  console.log('Loading employees with role_level = TOP');

  this.roles = [];

  this.loadTopLevelEmployees();
}
        // EXECUTIVE COMMITTEE
        // else if (
        //   this.isExecutiveCommitteeSelection()
        // ) {

        //   this.roles =
        //     roles.filter((role: any) =>
        //       [
        //         'Executive Committee Member'
        //       ].includes(role.name)
        //     );

        // }

        // CORPORATE OFFICE
        else if (
          this.isCorporateOfficeSelection()
        ) {

          this.roles =
            roles.filter((role: any) =>
              [
                'Corporate Office Staff'
              ].includes(role.name)
            );

        }

      });

  }

  //these is the method for selection of non-region

isNoneRegionSelected(): boolean {
  const selectedRegions = this.form.get('region')?.value || [];

  return selectedRegions.includes('NONE');
}

//method for non-select region
onRegionSelectionChange(event: any): void {

  let values = event.value || [];

  // If None is selected
  if (values.includes('NONE')) {

    // Keep only NONE
    values = ['NONE'];

    this.form.get('region')?.setValue(
      values,
      { emitEvent: false }
    );

    // No actual regions selected
    this.selectedRegionIds = [];

    // IMPORTANT
    // Hide Zone question
    this.showZoneQuestion = false;

    // Also hide Zone selection
    this.showZoneSelection = false;

    // Clear dependent selections
    this.selectedZoneIds = [];
    this.selectedCircleIds = [];

    return;
  }

  // Actual region selected
  this.selectedRegionIds = values;

  if (values.length > 0) {

    // Show Zone question
    this.showZoneQuestion = true;

  } else {

    // No region selected
    this.showZoneQuestion = false;

  }
} 


//Method for Zone y and N type 

onZoneTextInput(event: Event): void {
  const input = event.target as HTMLInputElement;

  const value = input.value.trim().toLowerCase();

  if (value === 'y' || value === 'yes') {
    this.selectZoneWise(true);
  } 
  else if (value === 'n' || value === 'no') {
    this.selectZoneWise(false);
  }
}

//Method for circle y and n type 
onCircleTextInput(event: Event): void {
  const input = event.target as HTMLInputElement;

  const value = input.value.trim().toLowerCase();

  if (value === 'y' || value === 'yes') {
    this.selectCircleWise(true);
  }
  else if (value === 'n' || value === 'no') {
    this.selectCircleWise(false);
  }
}   


//Method for branch y and N type 
onBranchTextInput(event: Event): void {
  const input = event.target as HTMLInputElement;

  const value = input.value.trim().toLowerCase();

  if (value === 'y' || value === 'yes') {
    this.selectBranchWise(true);
  }
  else if (value === 'n' || value === 'no') {
    this.selectBranchWise(false);
  }
}  


//Method for department y and N
onDepartmentTextInput(event: Event): void {
  const input = event.target as HTMLInputElement;

  const value = input.value.trim().toLowerCase();

  if (value === 'y' || value === 'yes') {
    this.selectDepartmentWise(true);
  }
  else if (value === 'n' || value === 'no') {
    this.selectDepartmentWise(false);
  }
}



//Method for Slecting top management Employee

onTopEmployeeSelectionChange(event: any): void {

  console.log('====================================');
  console.log('TOP EMPLOYEE SELECTION CHANGED');
  console.log('Selected IDs:', event.value);

  const selectedIds = event.value || [];

  this.selectedEmployees = this.employees.filter(
    (emp: any) => selectedIds.includes(emp.id)
  );

  console.log('SELECTED TOP EMPLOYEES:', this.selectedEmployees);
}



  // =========================================================
  // LOAD EMPLOYEES BY ROLE
  // =========================================================

  private loadRoleEmployees(): void {

    this.selectedEmployees = [];

    if (
      this.selectedRoleIds.length === 0
    ) {

      return;
    }

    this.selectedRoleIds.forEach(
      (roleId) => {

        this.employeeService
          .getEmployeeByRoleId(roleId)
          .subscribe((data: any) => {

            if (Array.isArray(data)) {

              this.selectedEmployees.push(
                ...data
              );

            }

            // Remove duplicates
            this.selectedEmployees =
              this.selectedEmployees.filter(
                (emp, index, self) =>
                  index ===
                  self.findIndex(
                    (e) =>
                      e.id === emp.id
                  )
              );

          });

      }
    );

  }

// =========================================================
// SELECTION TYPE CHECKS
// =========================================================

isUserWiseSelection(): boolean {
  return (
    this.data?.confidentiality ===
    'USER_WISE'
  );
}



  // =========================================================
  // SELECTION TYPE CHECKS
  // =========================================================

  isHeadOfficeSelection(): boolean {

    return (
      this.data?.confidentiality ===
      'HEAD_OFFICE'
    );

  }


  isRegionWiseSelection(): boolean {

    return (
      this.data?.confidentiality ===
      'REGION_WISE'
    );

  }

  isZoneWiseSelection(): boolean {

    return (
      this.data?.confidentiality ===
      'ZONE_WISE'
    );

  }

  isCircleWiseSelection(): boolean {

    return (
      this.data?.confidentiality ===
      'CIRCLE_WISE'
    );

  }

  isBranchWiseSelection(): boolean {

    return (
      this.data?.confidentiality ===
      'BRANCH_WISE'
    );

  } 



// =========================================================
// DEPARTMENT WISE
// =========================================================

isDepartmentWiseSelection(): boolean {

  return (
    this.data?.confidentiality ===
    'DEPARTMENT_WISE'
  );

}


//These for rolewise Selction 

  isRoleWiseSelection(): boolean {

    return (
      this.data?.confidentiality ===
      'ROLE_WISE'
    );

  }

  isDesignationWiseSelection(): boolean {

    return (
      this.data?.confidentiality ===
      'DESIGNATION_WISE'
    );

  }

  isCommitteeWiseSelection(): boolean {

    return (
      this.data?.confidentiality ===
      'COMMITTEE_WISE'
    );

  }

  isBoardOfDirectorsSelection(): boolean {

    return (
      this.data?.confidentiality ===
      'BOARD_OF_DIRECTORS'
    );

  }

  isMdCeoSelection(): boolean {

    return (
      this.data?.confidentiality ===
      'MD_CEO'
    );

  }

  // isExecutiveCommitteeSelection(): boolean {

  //   return (
  //     this.data?.confidentiality ===
  //     'EXECUTIVE_COMMITTEE'
  //   );

  // }

  isCorporateOfficeSelection(): boolean {

    return (
      this.data?.confidentiality ===
      'CORPORATE_OFFICE'
    );

  }

  // =========================================================
  // HEAD OFFICE
  // =========================================================

  private loadHeadOffices(): void {

    this.userService
      .fetchAllHeadOffice()
      .subscribe((headOffices: any) => {

        this.headOffices =
          headOffices || [];

      });

  }

  // =========================================================
  // REGION
  // =========================================================

  private loadRegions(): void {

    this.userService
      .fetchAllRegions()
      .subscribe((regions: any) => {

        this.regions =
          regions || [];

      });

  }

  // =========================================================
// LOAD ZONES FOR SELECTED REGIONS
// =========================================================

private loadZonesForSelectedRegions(): void {

  this.userService
    .fetchAllZones()
    .subscribe((zones: any) => {

      const allZones = zones || [];

      this.zones = allZones.filter(
        (zone: any) =>
          this.selectedRegionIds.includes(
            zone.region_id
          )
      );

    });

} 


// =========================================================
// LOAD CIRCLES FOR SELECTED ZONES
// =========================================================

private loadCirclesForSelectedZones(): void {

  this.userService
    .fetchAllCircles()
    .subscribe((circles: any) => {

      const allCircles = circles || [];

      this.circles = allCircles.filter(
        (circle: any) =>
          this.selectedZoneIds.includes(
            circle.zone_id
          )
      );

      console.log(
        'Circles for selected zones:',
        this.circles
      );

    });

}

// Add loadCirclesForSelectedRegions()
private loadCirclesForSelectedRegions(): void {

  this.userService.fetchAllZones().subscribe(
    (zonesResponse: any) => {

      const zones = Array.isArray(zonesResponse)
        ? zonesResponse
        : zonesResponse?.data || [];

      // Get zones belonging to selected regions
      const regionZones = zones.filter(
        (zone: any) =>
          this.selectedRegionIds.includes(zone.region_id)
      );

      const zoneIds = regionZones.map(
        (zone: any) => zone.id
      );

      console.log('Selected Region IDs:', this.selectedRegionIds);
      console.log('Zones for selected regions:', regionZones);
      console.log('Zone IDs:', zoneIds);


      // Load circles
      this.userService.fetchAllCircles().subscribe(
        (circlesResponse: any) => {

          const circles = Array.isArray(circlesResponse)
            ? circlesResponse
            : circlesResponse?.data || [];

          // Get circles belonging to selected zones
          this.circles = circles.filter(
            (circle: any) =>
              zoneIds.includes(circle.zone_id)
          );

          console.log(
            'Circles for selected regions:',
            this.circles
          );

        },
        (error) => {

          console.error(
            'Error loading circles:',
            error
          );

          this.circles = [];

        }
      );

    },
    (error) => {

      console.error(
        'Error loading zones:',
        error
      );

    }
  );
}

//For if we select region and department only
private loadDepartmentsForSelectedRegions(): void {

  this.userService.fetchAllZones().subscribe(
    (zonesResponse: any) => {

      const zones = Array.isArray(zonesResponse)
        ? zonesResponse
        : zonesResponse?.data || [];

      const regionZones = zones.filter(
        (zone: any) =>
          this.selectedRegionIds.includes(zone.region_id)
      );

      const zoneIds = regionZones.map(
        (zone: any) => zone.id
      );

      this.userService.fetchAllCircles().subscribe(
        (circlesResponse: any) => {

          const circles = Array.isArray(circlesResponse)
            ? circlesResponse
            : circlesResponse?.data || [];

          const regionCircles = circles.filter(
            (circle: any) =>
              zoneIds.includes(circle.zone_id)
          );

          const circleIds = regionCircles.map(
            (circle: any) => circle.circle_id
          );

          this.employeeService.fetchAllBranches().subscribe(
            (branchesResponse: any) => {

              const branches = Array.isArray(branchesResponse)
                ? branchesResponse
                : branchesResponse?.data || [];

              const regionBranches = branches.filter(
                (branch: any) =>
                  circleIds.includes(branch.circle_id)
              );

              const branchIds = regionBranches.map(
                (branch: any) => branch.id
              );

              // Now load departments
              this.employeeService.getAllDepartment().subscribe(
                (departmentsResponse: any) => {

                  const departments = Array.isArray(departmentsResponse)
                    ? departmentsResponse
                    : departmentsResponse?.data || [];

                  this.departmentsForSelectedBranches =
                    departments.filter(
                      (department: any) =>
                        branchIds.includes(department.branch_id)
                    );

                  console.log(
                    'Departments for selected regions:',
                    this.departmentsForSelectedBranches
                  );

                }
              );

            }
          );

        }
      );

    }
  );
}

//Method for all type department selction
private loadDepartmentsBasedOnLastSelection(): void {

  this.departmentsForSelectedBranches = [];

  console.log('====================================');
  console.log('LOADING DEPARTMENTS');
  console.log('Region:', this.selectedRegionIds);
  console.log('Zone:', this.selectedZoneIds);
  console.log('Circle:', this.selectedCircleIds);
  console.log('Branch:', this.selectedBranchIds);
  console.log('====================================');

  // =====================================================
  // CASE 1:
  // BRANCH IS THE LAST SELECTED LEVEL
  // =====================================================

  if (
    this.selectedBranchWise === true &&
    this.selectedBranchIds.length > 0
  ) {

    console.log(
      'Department source = SELECTED BRANCHES'
    );

    this.loadDepartmentsForSelectedBranches();

    return;
  }


  // =====================================================
  // CASE 2:
  // CIRCLE IS THE LAST SELECTED LEVEL
  // =====================================================

  if (
    this.selectedCircleWise === true &&
    this.selectedCircleIds.length > 0
  ) {

    console.log(
      'Department source = SELECTED CIRCLES'
    );

    this.loadDepartmentsForSelectedCircles();

    return;
  }


  // =====================================================
  // CASE 3:
  // ZONE IS THE LAST SELECTED LEVEL
  // =====================================================

  if (
    this.selectedZoneWise === true &&
    this.selectedZoneIds.length > 0
  ) {

    console.log(
      'Department source = SELECTED ZONES'
    );

    this.loadDepartmentsForSelectedZones();

    return;
  }


  // =====================================================
  // CASE 4:
  // REGION IS THE LAST SELECTED LEVEL
  // =====================================================

  if (
    this.selectedRegionIds.length > 0
  ) {

    console.log(
      'Department source = SELECTED REGIONS'
    );

    this.loadDepartmentsForSelectedRegions();

    return;
  }


  // =====================================================
  // NOTHING SELECTED
  // =====================================================

  console.log(
    'No hierarchy selected. Departments cannot be loaded.'
  );

  this.departmentsForSelectedBranches = [];
}
 
//Load department for selcted zones 
private loadDepartmentsForSelectedZones(): void {

  this.departmentsForSelectedBranches = [];

  if (this.selectedZoneIds.length === 0) {
    return;
  }

  console.log(
    'Loading departments for zones:',
    this.selectedZoneIds
  );

  // =====================================================
  // 1. GET CIRCLES OF SELECTED ZONES
  // =====================================================

  this.userService.fetchAllCircles().subscribe({

    next: (circlesResponse: any) => {

      const circles = Array.isArray(circlesResponse)
        ? circlesResponse
        : circlesResponse?.data || [];

      const selectedCircles = circles.filter(
        (circle: any) =>
          this.selectedZoneIds.includes(circle.zone_id)
      );

      const circleIds = selectedCircles.map(
        (circle: any) => circle.circle_id
      );

      console.log(
        'Circles under selected zones:',
        selectedCircles
      );

      console.log(
        'Circle IDs:',
        circleIds
      );

      // =====================================================
      // 2. GET BRANCHES OF THOSE CIRCLES
      // =====================================================

      this.employeeService.fetchAllBranches().subscribe({

        next: (branchesResponse: any) => {

          const branches = Array.isArray(branchesResponse)
            ? branchesResponse
            : branchesResponse?.data || [];

          const selectedBranches = branches.filter(
            (branch: any) =>
              circleIds.includes(branch.circle_id)
          );

          const branchIds = selectedBranches.map(
            (branch: any) => branch.id
          );

          console.log(
            'Branches under selected zones:',
            selectedBranches
          );

          console.log(
            'Branch IDs:',
            branchIds
          );

          // =====================================================
          // 3. GET DEPARTMENTS OF THOSE BRANCHES
          // =====================================================

          this.employeeService.getAllDepartment().subscribe({

            next: (departmentsResponse: any) => {

              const departments =
                Array.isArray(departmentsResponse)
                  ? departmentsResponse
                  : departmentsResponse?.data || [];

              this.departmentsForSelectedBranches =
                departments.filter(
                  (department: any) =>
                    branchIds.includes(
                      department.branch_id
                    )
                );

              console.log(
                'Departments under selected zones:',
                this.departmentsForSelectedBranches
              );

            },

            error: (error) => {

              console.error(
                'Error loading departments:',
                error
              );

              this.departmentsForSelectedBranches = [];

            }

          });

        },

        error: (error) => {

          console.error(
            'Error loading branches:',
            error
          );

          this.departmentsForSelectedBranches = [];

        }

      });

    },

    error: (error) => {

      console.error(
        'Error loading circles:',
        error
      );

      this.departmentsForSelectedBranches = [];

    }

  });
}


private loadDepartmentsForSelectedCircles(): void {

  this.departmentsForSelectedBranches = [];

  if (this.selectedCircleIds.length === 0) {
    return;
  }

  console.log(
    'Loading departments for circles:',
    this.selectedCircleIds
  );

  // =====================================================
  // 1. GET BRANCHES OF SELECTED CIRCLES
  // =====================================================

  this.employeeService.fetchAllBranches().subscribe({

    next: (branchesResponse: any) => {

      const branches = Array.isArray(branchesResponse)
        ? branchesResponse
        : branchesResponse?.data || [];

      const selectedBranches = branches.filter(
        (branch: any) =>
          this.selectedCircleIds.includes(
            branch.circle_id
          )
      );

      const branchIds = selectedBranches.map(
        (branch: any) => branch.id
      );

      console.log(
        'Branches under selected circles:',
        selectedBranches
      );

      console.log(
        'Branch IDs:',
        branchIds
      );

      // =====================================================
      // 2. GET DEPARTMENTS OF THOSE BRANCHES
      // =====================================================

      this.employeeService.getAllDepartment().subscribe({

        next: (departmentsResponse: any) => {

          const departments =
            Array.isArray(departmentsResponse)
              ? departmentsResponse
              : departmentsResponse?.data || [];

          this.departmentsForSelectedBranches =
            departments.filter(
              (department: any) =>
                branchIds.includes(
                  department.branch_id
                )
            );

          console.log(
            'Departments under selected circles:',
            this.departmentsForSelectedBranches
          );

        },

        error: (error) => {

          console.error(
            'Error loading departments:',
            error
          );

          this.departmentsForSelectedBranches = [];

        }

      });

    },

    error: (error) => {

      console.error(
        'Error loading branches:',
        error
      );

      this.departmentsForSelectedBranches = [];

    }

  });
}



//FOr branch 
private loadBranchesForSelectedZones(): void {

  this.userService.fetchAllCircles().subscribe(
    (circlesResponse: any) => {

      const circles = Array.isArray(circlesResponse)
        ? circlesResponse
        : circlesResponse?.data || [];

      // Get circles belonging to selected zones
      const circlesForZones = circles.filter(
        (circle: any) =>
          this.selectedZoneIds.includes(circle.zone_id)
      );

      const circleIds = circlesForZones.map(
        (circle: any) => circle.circle_id
      );

      console.log('Selected Zone IDs:', this.selectedZoneIds);
      console.log('Circles for selected zones:', circlesForZones);
      console.log('Circle IDs:', circleIds);


      // Load branches belonging to those circles
      this.employeeService.fetchAllBranches().subscribe(
        (branchesResponse: any) => {

          const branches = Array.isArray(branchesResponse)
            ? branchesResponse
            : branchesResponse?.data || [];

          this.branches = branches.filter(
            (branch: any) =>
              circleIds.includes(branch.circle_id)
          );

          console.log(
            'Branches for selected zones:',
            this.branches
          );

        },
        (error) => {

          console.error(
            'Error loading branches:',
            error
          );

          this.branches = [];

        }
      );

    },
    (error) => {

      console.error(
        'Error loading circles:',
        error
      );

      this.branches = [];

    }
  );
}


//For loadBranchesForSelectedRegions
private loadBranchesForSelectedRegions(): void {

  // 1. Load all zones
  this.userService.fetchAllZones().subscribe(
    (zonesResponse: any) => {

      const zones = Array.isArray(zonesResponse)
        ? zonesResponse
        : zonesResponse?.data || [];

      // Zones belonging to selected regions
      const regionZones = zones.filter(
        (zone: any) =>
          this.selectedRegionIds.includes(zone.region_id)
      );

      const zoneIds = regionZones.map(
        (zone: any) => zone.id
      );

      console.log('Selected Region IDs:', this.selectedRegionIds);
      console.log('Zones for selected regions:', regionZones);
      console.log('Zone IDs:', zoneIds);


      // 2. Load all circles
      this.userService.fetchAllCircles().subscribe(
        (circlesResponse: any) => {

          const circles = Array.isArray(circlesResponse)
            ? circlesResponse
            : circlesResponse?.data || [];

          // Circles belonging to those zones
          const regionCircles = circles.filter(
            (circle: any) =>
              zoneIds.includes(circle.zone_id)
          );

          const circleIds = regionCircles.map(
            (circle: any) => circle.circle_id
          );

          console.log(
            'Circles for selected regions:',
            regionCircles
          );

          console.log(
            'Circle IDs:',
            circleIds
          );


          // 3. Load all branches
          this.employeeService.fetchAllBranches().subscribe(
            (branchesResponse: any) => {

              const branches = Array.isArray(branchesResponse)
                ? branchesResponse
                : branchesResponse?.data || [];

              // Branches belonging to those circles
              this.branches = branches.filter(
                (branch: any) =>
                  circleIds.includes(branch.circle_id)
              );

              console.log(
                'Branches for selected regions:',
                this.branches
              );

            },
            (error) => {

              console.error(
                'Error loading branches:',
                error
              );

              this.branches = [];
            }
          );

        },
        (error) => {

          console.error(
            'Error loading circles:',
            error
          );

          this.branches = [];
        }
      );

    },
    (error) => {

      console.error(
        'Error loading zones:',
        error
      );

      this.branches = [];
    }
  );
}




// =========================================================
// LOAD BRANCHES FOR SELECTED CIRCLES
// =========================================================

private loadBranchesForSelectedCircles(): void {

  this.employeeService
    .fetchAllBranches()
    .subscribe((branches: any) => {

      const allBranches = branches || [];

      this.branches = allBranches.filter(
        (branch: any) =>
          this.selectedCircleIds.includes(
            branch.circle_id
          )
      );

      console.log(
        'Branches for selected circles:',
        this.branches
      );

    });

}

// =========================================================
// LOAD DEPARTMENTS FOR SELECTED BRANCHES
// =========================================================

private loadDepartmentsForSelectedBranches(): void {

  this.departmentsForSelectedBranches = [];

  if (this.selectedBranchIds.length === 0) {
    return;
  }

  this.selectedBranchIds.forEach((branchId) => {

    this.employeeService
      .getDepartmentsByBranch(branchId)
      .subscribe({
        next: (departments: any[]) => {

          const newDepartments =
            departments || [];

          this.departmentsForSelectedBranches = [
            ...this.departmentsForSelectedBranches,
            ...newDepartments
          ];

          // Remove duplicate departments
          this.departmentsForSelectedBranches =
            this.departmentsForSelectedBranches.filter(
              (department, index, list) =>
                list.findIndex(
                  (item) =>
                    item.id === department.id
                ) === index
            );

          console.log(
            'Departments for selected branches:',
            this.departmentsForSelectedBranches
          );

        },

        error: (error) => {

          console.error(
            'Error loading departments for branch:',
            branchId,
            error
          );

        }

      });

  });

}



//SelctZonewise method  

selectZoneWise(answer: boolean): void {

  this.selectedZoneWise = answer;

  if (answer === true) {

    // YES → show Zone dropdown
    this.showZoneSelection = true;

    // Circle question waits for Zone selection
    this.showCircleQuestion = false;
    this.showCircleSelection = false;

    this.selectedCircleWise = null;
    this.selectedCircleIds = [];

    this.form.get('circle')?.setValue([], {
      emitEvent: false
    });

    // Load zones belonging to selected regions
    this.loadZonesForSelectedRegions();

    this.selectedEmployees = [];

  } else {

    // ==========================================
    // NO → COMPLETELY SKIP ZONE
    // ==========================================

    this.showZoneSelection = false;

    this.selectedZoneIds = [];

    this.form.get('zone')?.setValue([], {
      emitEvent: false
    });

    // ==========================================
    // IMPORTANT
    // DIRECTLY SHOW CIRCLE QUESTION
    // ==========================================

    this.showCircleQuestion = true;

    // Circle dropdown should NOT appear yet
    this.showCircleSelection = false;

    this.selectedCircleWise = null;
    this.selectedCircleIds = [];

    this.form.get('circle')?.setValue([], {
      emitEvent: false
    }); 


  // ==========================================
  // LOAD EMPLOYEES FROM LAST SELECTED LEVEL
  // ==========================================

  this.loadEmployeesForLastSelectedLevel();



    this.selectedEmployees = [];
  }

  console.log('Zone-wise:', answer);
  console.log('showZoneQuestion:', this.showZoneQuestion);
  console.log('showZoneSelection:', this.showZoneSelection);
  console.log('showCircleQuestion:', this.showCircleQuestion);
  console.log('showCircleSelection:', this.showCircleSelection);
}



//Method foe SelctCircleWise

selectCircleWise(answer: boolean): void {

  this.selectedCircleWise = answer;

  if (answer === true) {

    this.showCircleSelection = true;
    this.showBranchQuestion = false;

    this.selectedCircleIds = [];

    this.form.get('circle')?.setValue([], {
      emitEvent: false
    });

    // ============================================
    // WHICH LEVEL SHOULD LOAD THE CIRCLES?
    // ============================================

    if (this.selectedZoneWise === true) {

      // Normal flow:
      // Region → Zone → Circle
      this.loadCirclesForSelectedZones();

    } else {

      // Zone was skipped:
      // Region → Circle
      this.loadCirclesForSelectedRegions();

    }

    this.selectedEmployees = [];

  } else {

    this.showCircleSelection = false;

    this.selectedCircleIds = [];

    this.form.get('circle')?.setValue([], {
      emitEvent: false
    });

    this.selectedBranchWise = null;
    this.showBranchSelection = false;

    // Show Branch question
    this.showBranchQuestion = true;

    this.selectedEmployees = [];
 
     // ==========================================
  // IMPORTANT
  // Load employees from the last actual
  // selected level.
  // ==========================================

  this.loadEmployeesForLastSelectedLevel();


  }

}


// =========================================================
// SELECT BRANCH-WISE
// =========================================================

selectBranchWise(answer: boolean): void {

  this.selectedBranchWise = answer;

  if (answer) {

    // ==========================================
    // YES -> SHOW BRANCH SELECTION
    // ==========================================

    this.showBranchSelection = true;

    // Department question should wait
    // until branch is actually selected.
    this.showDepartmentQuestion = false;
    this.showDepartmentSelection = false;

    this.selectedDepartmentWise = null;
    this.selectedDepartmentIds = [];

    this.form
      .get('branchDepartmentWise')
      ?.setValue([], { emitEvent: false });

    // Load branches belonging to selected circles
    // this.loadBranchesForSelectedCircles(); 

if (this.selectedCircleWise === true) {

  // Circle was selected
  this.loadBranchesForSelectedCircles();

}
else if (this.selectedZoneWise === true) {

  // Zone selected, Circle skipped
  this.loadBranchesForSelectedZones();

}
else {

  // Zone skipped AND Circle skipped
  // Region is the highest selected level
  this.loadBranchesForSelectedRegions();

}

    // Do not keep circle employees
    this.selectedEmployees = [];

  } else {

    // ==========================================
    // NO -> SKIP BRANCH
    // ==========================================

    this.showBranchSelection = false;

    this.selectedBranchIds = [];

    this.form
      .get('branchWise')
      ?.setValue([], { emitEvent: false });

    // ==========================================
    // IMPORTANT:
    // SHOW NEXT QUESTION
    // ==========================================

    this.showDepartmentQuestion = true;

    this.showDepartmentSelection = false;
    this.selectedDepartmentWise = null;

    this.selectedDepartmentIds = [];

    this.form
      .get('branchDepartmentWise')
      ?.setValue([], { emitEvent: false });

    // Since Branch-wise = NO,
    // keep Circle-wise employees
    // this.loadCircleEmployees();

this.loadEmployeesForLastSelectedLevel();

  }
}


// =========================================================
// SELECT DEPARTMENT-WISE UNDER BRANCH
// =========================================================
selectDepartmentWise(answer: boolean): void {

  this.selectedDepartmentWise = answer;

  // =====================================================
  // NO
  // =====================================================

  if (!answer) {

    this.showDepartmentSelection = false;

    this.departmentsForSelectedBranches = [];

    this.selectedDepartmentIds = [];

    this.form
      .get('branchDepartmentWise')
      ?.setValue([], {
        emitEvent: false
      });
 // ==========================================
  // IMPORTANT
  //
  // Department was skipped.
  // Therefore load employees from the
  // last selected hierarchy level.
  // ==========================================

  this.loadEmployeesForLastSelectedLevel();



    return;
  }


  // =====================================================
  // YES
  // =====================================================

  this.showDepartmentSelection = true;

  console.log('====================================');
  console.log('DEPARTMENT-WISE = YES');
  console.log('====================================');

  console.log(
    'Region:',
    this.selectedRegionIds
  );

  console.log(
    'Zone:',
    this.selectedZoneIds
  );

  console.log(
    'Circle:',
    this.selectedCircleIds
  );

  console.log(
    'Branch:',
    this.selectedBranchIds
  );

  // =====================================================
  // LOAD DEPARTMENTS FROM LAST SELECTED LEVEL
  // =====================================================

  this.loadDepartmentsBasedOnLastSelection();
}



getRegionWiseSelectionCount(): number {
  let count = 0;

  // Region itself
  if (this.selectedRegionIds.length > 0) {
    count++;
  }

  // Zone
  if (
    this.selectedZoneWise === true &&
    this.selectedZoneIds.length > 0
  ) {
    count++;
  }

  // Circle
  if (
    this.selectedCircleWise === true &&
    this.selectedCircleIds.length > 0
  ) {
    count++;
  }

  // Branch
  if (
    this.selectedBranchWise === true &&
    this.selectedBranchIds.length > 0
  ) {
    count++;
  }

  // Department
  if (
    this.selectedDepartmentWise === true &&
    this.selectedDepartmentIds.length > 0
  ) {
    count++;
  }

  return count;
}


  // =========================================================
  // ZONE
  // =========================================================

  private loadZones(): void {

    this.userService
      .fetchAllZones()
      .subscribe((zones: any) => {

        this.zones =
          zones || [];

      });

  }

  // =========================================================
  // CIRCLE
  // =========================================================

  private loadCircles(): void {

    this.userService
      .fetchAllCircles()
      .subscribe((circles: any) => {

        this.circles =
          circles || [];

      });

  }

  // =========================================================
  // BRANCH WISE
  // =========================================================

  private loadBranchWiseBranches(): void {

    this.employeeService
      .fetchAllBranches()
      .subscribe((branches: any) => {

        this.branches =
          branches || [];

      });

  } 



// =========================================================
// LOAD ALL DEPARTMENTS - STANDALONE DEPARTMENT WISE
// =========================================================

private loadAllDepartments(): void {

  this.employeeService
    .getAllDepartment()
    .subscribe({
      next: (data: any) => {

        console.log(
          'DEPARTMENT_WISE - All Departments:',
          data
        );

        this.departments =
          Array.isArray(data)
            ? data
            : data?.data || [];

      },

      error: (error: any) => {

        console.error(
          'DEPARTMENT_WISE - Error loading departments:',
          error
        );

        this.departments = [];

      }
    });

}



  // =========================================================
  // REGION EMPLOYEES
  // =========================================================

  private loadRegionEmployees(): void {

    const selectionRequest =
      ++this.regionSelectionRequest;

    this.selectedEmployees = [];

    if (
      this.selectedRegionIds.length === 0
    ) {

      this.isLoadingRegionEmployees =
        false;

      return;
    }

    this.isLoadingRegionEmployees =
      true;

    const employees: Employee[] = [];

    let completedRequests = 0;

    const completeRequest = () => {

      completedRequests++;

      if (
        completedRequests ===
          this.selectedRegionIds.length &&
        selectionRequest ===
          this.regionSelectionRequest
      ) {

        this.selectedEmployees =
          employees.filter(
            (employee, index, list) =>
              list.findIndex(
                (item) =>
                  item.id === employee.id
              ) === index
          );

        this.isLoadingRegionEmployees =
          false;

        this.completeRegionSelectionIfRequested();

      }

    };

    this.selectedRegionIds.forEach(
      (regionId) => {

        this.employeeService
          .getEmployeeByRegionId(regionId)
          .subscribe({

            next: (data) =>
              employees.push(
                ...(data as Employee[])
              ),

            error: completeRequest,

            complete: completeRequest

          });

      }
    );

  }

  private completeRegionSelectionIfRequested(): void {

    if (
      this.confirmRegionSelectionWhenLoaded
    ) {

      this.confirmRegionSelectionWhenLoaded =
        false;

      this.dialogRef.close(
        this.selectedEmployees
      );

    }

  }

  // =========================================================
  // ZONE EMPLOYEES
  // =========================================================

  private loadZoneEmployees(): void {

    const selectionRequest =
      ++this.zoneSelectionRequest;

    this.selectedEmployees = [];

    if (
      this.selectedZoneIds.length === 0
    ) {

      this.isLoadingZoneEmployees =
        false;

      return;
    }

    this.isLoadingZoneEmployees =
      true;

    const employees: Employee[] = [];

    let completedRequests = 0;

    const completeRequest = () => {

      completedRequests++;

      if (
        completedRequests ===
          this.selectedZoneIds.length &&
        selectionRequest ===
          this.zoneSelectionRequest
      ) {

        this.selectedEmployees =
          employees.filter(
            (employee, index, list) =>
              list.findIndex(
                (item) =>
                  item.id === employee.id
              ) === index
          );

        this.isLoadingZoneEmployees =
          false;

        this.completeZoneSelectionIfRequested();

      }

    };

    this.selectedZoneIds.forEach(
      (zoneId) => {

        this.employeeService
          .getEmployeeByZoneId(zoneId)
          .subscribe({

            next: (data) =>
              employees.push(
                ...(data as Employee[])
              ),

            error: completeRequest,

            complete: completeRequest

          });

      }
    );

  }


//Method to LOad employee acoording to their role 
private loadTopLevelEmployees(): void {
  console.log('====================================');
  console.log('LOADING TOP LEVEL EMPLOYEES');
  console.log('role_level = top');
  console.log('====================================');

  this.employeeService.getEmployeesByRoleLevel('top').subscribe({
    next: (response: any) => {

      console.log('TOP LEVEL API RESPONSE:', response);

      const employees = Array.isArray(response)
        ? response
        : response?.data || [];

      console.log('TOP LEVEL EMPLOYEES:', employees);
      console.log('TOP LEVEL EMPLOYEE COUNT:', employees.length);

      // Store top-level employees
      this.employees = employees;

      // Clear previous employee selections
      this.selectedEmployees = [];

      console.log('FINAL EMPLOYEES:', this.employees);
    },

    error: (error) => {

      console.error(
        'ERROR LOADING TOP LEVEL EMPLOYEES:',
        error
      );

      this.employees = [];
    }
  });
}





  private completeZoneSelectionIfRequested(): void {

    if (
      this.confirmZoneSelectionWhenLoaded
    ) {

      this.confirmZoneSelectionWhenLoaded =
        false;

      this.dialogRef.close(
        this.selectedEmployees
      );

    }

  }

  // =========================================================
  // CIRCLE EMPLOYEES
  // =========================================================

  private loadCircleEmployees(): void {

    const selectionRequest =
      ++this.circleSelectionRequest;

    this.selectedEmployees = [];

    if (
      this.selectedCircleIds.length === 0
    ) {

      this.isLoadingCircleEmployees =
        false;

      return;
    }

    this.isLoadingCircleEmployees =
      true;

    const employees: Employee[] = [];

    let completedRequests = 0;

    const completeRequest = () => {

      completedRequests++;

      if (
        completedRequests ===
          this.selectedCircleIds.length &&
        selectionRequest ===
          this.circleSelectionRequest
      ) {

        this.selectedEmployees =
          employees.filter(
            (employee, index, list) =>
              list.findIndex(
                (item) =>
                  item.id === employee.id
              ) === index
          );

        this.isLoadingCircleEmployees =
          false;

        this.completeCircleSelectionIfRequested();

      }

    };

    this.selectedCircleIds.forEach(
      (circleId) => {

        this.employeeService
          .getEmployeeByCircleId(circleId)
          .subscribe({

            next: (data) =>
              employees.push(
                ...(data as Employee[])
              ),

            error: completeRequest,

            complete: completeRequest

          });

      }
    );

  }

  private completeCircleSelectionIfRequested(): void {

    if (
      this.confirmCircleSelectionWhenLoaded
    ) {

      this.confirmCircleSelectionWhenLoaded =
        false;

      this.dialogRef.close(
        this.selectedEmployees
      );

    }

  }

  // =========================================================
  // BRANCH EMPLOYEES
  // =========================================================

  private loadBranchWiseEmployees(): void {

    const selectionRequest =
      ++this.branchSelectionRequest;

    this.selectedEmployees = [];

    if (
      this.selectedBranchIds.length === 0
    ) {

      this.isLoadingBranchEmployees =
        false;

      return;
    }

    this.isLoadingBranchEmployees =
      true;

    const employees: Employee[] = [];

    let completedRequests = 0;

    const completeRequest = () => {

      completedRequests++;

      if (
        completedRequests ===
          this.selectedBranchIds.length &&
        selectionRequest ===
          this.branchSelectionRequest
      ) {

        this.selectedEmployees =
          employees.filter(
            (employee, index, list) =>
              list.findIndex(
                (item) =>
                  item.id === employee.id
              ) === index
          );

        this.isLoadingBranchEmployees =
          false;

        this.completeBranchSelectionIfRequested();

      }

    };

    this.selectedBranchIds.forEach(
      (branchId) => {

        this.employeeService
          .getEmployeeByBranchId(branchId)
          .subscribe({

            next: (data) =>
              employees.push(
                ...(data as Employee[])
              ),

            error: completeRequest,

            complete: completeRequest

          });

      }
    );

  }


  // =========================================================
// LOAD EMPLOYEES FROM LAST SELECTED HIERARCHY LEVEL
// =========================================================

private loadEmployeesForLastSelectedLevel(): void {

  console.log('====================================');
  console.log('LOAD EMPLOYEES FOR LAST SELECTED LEVEL');
  console.log('Region:', this.selectedRegionIds);
  console.log('Zone:', this.selectedZoneIds);
  console.log('Circle:', this.selectedCircleIds);
  console.log('Branch:', this.selectedBranchIds);

  console.log('Region Wise:', this.selectedRegionIds.length > 0);
  console.log('Zone Wise:', this.selectedZoneWise);
  console.log('Circle Wise:', this.selectedCircleWise);
  console.log('Branch Wise:', this.selectedBranchWise);
  console.log('====================================');


  // =====================================================
  // 1. BRANCH IS LAST SELECTED LEVEL
  // =====================================================

  if (
    this.selectedBranchWise === true &&
    this.selectedBranchIds.length > 0
  ) {

    console.log(
      'FINAL LEVEL = BRANCH'
    );

    this.loadBranchWiseEmployees();

    return;
  }


  // =====================================================
  // 2. CIRCLE IS LAST SELECTED LEVEL
  // =====================================================

  if (
    this.selectedCircleWise === true &&
    this.selectedCircleIds.length > 0
  ) {

    console.log(
      'FINAL LEVEL = CIRCLE'
    );

    this.loadCircleEmployees();

    return;
  }


  // =====================================================
  // 3. ZONE IS LAST SELECTED LEVEL
  // =====================================================

  if (
    this.selectedZoneWise === true &&
    this.selectedZoneIds.length > 0
  ) {

    console.log(
      'FINAL LEVEL = ZONE'
    );

    this.loadZoneEmployees();

    return;
  }


  // =====================================================
  // 4. REGION IS LAST SELECTED LEVEL
  // =====================================================

  if (
    this.selectedRegionIds.length > 0
  ) {

    console.log(
      'FINAL LEVEL = REGION'
    );

    this.loadRegionEmployees();

    return;
  }


  // =====================================================
  // NOTHING SELECTED
  // =====================================================

  console.log(
    'NO FINAL LEVEL FOUND'
  );

  this.selectedEmployees = [];

}



// Method to for Load_DepartmentWise 
private loadDepartmentWiseEmployees(): void {

  this.selectedEmployees = [];

  if (this.selectedDepartmentIds.length === 0) {
    return;
  }

  const employees: Employee[] = [];
  let completedRequests = 0;

  const completeRequest = () => {

    completedRequests++;

    if (
      completedRequests ===
      this.selectedDepartmentIds.length
    ) {

      // Remove duplicate employees
      this.selectedEmployees = employees.filter(
        (employee, index, list) =>
          list.findIndex(
            (item) => item.id === employee.id
          ) === index
      );

      console.log(
        'Department Employees:',
        this.selectedEmployees
      );
    }
  };

  this.selectedDepartmentIds.forEach(
    (departmentId) => {

      this.employeeService
        .getEmployeesByDepartment(departmentId)
        .subscribe({

          next: (data: any) => {

            console.log(
              'Department Employee API Response:',
              data
            );

            if (Array.isArray(data)) {
              employees.push(...data);
            }

          },

          error: (error) => {

            console.error(
              'Error loading department employees:',
              error
            );

            completeRequest();
          },

          complete: completeRequest

        });

    }
  );
}

//Method for Complete branch Selction 

  private completeBranchSelectionIfRequested(): void {

    if (
      this.confirmBranchSelectionWhenLoaded
    ) {

      this.confirmBranchSelectionWhenLoaded =
        false;

      this.dialogRef.close(
        this.selectedEmployees
      );

    }

  }

  // =========================================================
  // HEAD OFFICE EMPLOYEES
  // =========================================================

  private loadHeadOfficeEmployees(): void {

    const selectionRequest =
      ++this.headOfficeSelectionRequest;

    if (
      this.selectedHeadOfficeIds.length === 0
    ) {

      this.selectedEmployees = [];

      this.isLoadingHeadOfficeEmployees =
        false;

      return;
    }

    this.isLoadingHeadOfficeEmployees =
      true;

    const employees: Employee[] = [];

    let completedRequests = 0;

    const completeRequest = () => {

      completedRequests++;

      if (
        completedRequests ===
          this.selectedHeadOfficeIds.length &&
        selectionRequest ===
          this.headOfficeSelectionRequest
      ) {

        this.selectedEmployees =
          employees.filter(
            (employee, index, list) =>
              list.findIndex(
                (item) =>
                  item.id === employee.id
              ) === index
          );

        this.isLoadingHeadOfficeEmployees =
          false;

      }

    };

    this.selectedHeadOfficeIds.forEach(
      (headOfficeId) => {

        this.employeeService
          .getEmployeeByHeadOfficeId(
            headOfficeId
          )
          .subscribe({

            next: (data) =>
              employees.push(
                ...(data as Employee[])
              ),

            error: completeRequest,

            complete: completeRequest

          });

      }
    );

  }

  // =========================================================
  // COMMITTEE
  // =========================================================

  private loadCommittees(): void {

    this.userService
      .getAllCommittees()
      .subscribe((data: any) => {

        console.log(
          'Committee API Response:',
          data
        );

        this.committees =
          data || [];

      });

  }

  // =========================================================
  // COMMITTEE EMPLOYEES
  // =========================================================

  private loadCommitteeEmployees(): void {

    const request =
      ++this.committeeSelectionRequest;

    this.selectedEmployees = [];

    if (
      this.selectedCommitteeIds.length === 0
    ) {

      return;
    }

    const employees: Employee[] = [];

    let completed = 0;

    const finish = () => {

      completed++;

      if (
        completed ===
          this.selectedCommitteeIds.length &&
        request ===
          this.committeeSelectionRequest
      ) {

        this.selectedEmployees =
          employees.filter(
            (emp, index, list) =>
              index ===
              list.findIndex(
                (e) =>
                  e.id === emp.id
              )
          );

        console.log(
          'Committee Employees:',
          this.selectedEmployees
        );

      }

    };

    this.selectedCommitteeIds.forEach(
      (id) => {

        this.employeeService
          .getEmployeeByCommitteeId(id)
          .subscribe({

            next: (data: any) => {

              console.log(
                'Committee Employee API Response:',
                data
              );

              if (Array.isArray(data)) {

                employees.push(
                  ...data
                );

              }

            },

            error: (err) => {

              console.error(
                'Error loading committee employees:',
                err
              );

              finish();

            },

            complete: finish

          });

      }
    );

  }

  // =========================================================
  // DECRYPT DATA
  // =========================================================

  private decryptData(
    encryptedData: string
  ): string {

    try {

      return decodeURIComponent(
        atob(encryptedData)
      );

    } catch {

      return '';

    }

  }



// =========================================================
// USER WISE - LOAD ALL EMPLOYEES
// =========================================================

private loadAllEmployees(): void {

  this.employeeService
    .getAllEmployees()
    .subscribe({
      next: (data: any) => {

        console.log(
          'USER_WISE - All Employees:',
          data
        );

        const employeeList =
          Array.isArray(data)
            ? data
            : data?.data || [];

        this.allEmployees =
          employeeList as Employee[];

        this.employees =
          [...this.allEmployees];

        this.selectedEmployees = [];

      },

      error: (error:any) => {

        console.error(
          'USER_WISE - Error loading employees:',
          error
        );

        this.allEmployees = [];

        this.employees = [];

      }
    });

}

  // =========================================================
  // LOGGED IN EMPLOYEE
  // =========================================================

  private loadLoggedInEmployee(): void {

    const encryptedUser =
      localStorage.getItem(
        'emp_user'
      );

    if (encryptedUser) {

      const decryptedUser =
        this.decryptData(
          encryptedUser
        );

      this.employee =
        JSON.parse(decryptedUser);

      if (this.employee.head_office_id) {

        // Load departments
        this.employeeService
          .getDepartmentsByHeadOffice(
            this.employee.head_office_id
          )
          .subscribe((depts) => {

            this.departments =
              depts;

          });

        // Load employees
        this.employeeService
          .getEmployeeByHeadOfficeId(
            this.employee.head_office_id
          )
          .subscribe((data) => {

            this.allEmployees =
              data as Employee[];

            this.employees =
              [...this.allEmployees];

          });

        // Load branches
        this.employeeService
          .fetchAllBranches()
          .subscribe((branch) => {

            this.branches =
              branch as any;

          });

      }

    }

  }


// =========================================================
// USER WISE - SEARCH EMPLOYEES
// =========================================================

searchEmployees(): void {

  const searchText =
    this.employeeSearchText
      .trim()
      .toLowerCase();

  if (!searchText) {

    this.employees =
      [...this.allEmployees];

    return;
  }

  this.employees =
    this.allEmployees.filter(
      (emp: any) => {

        const fullName =
          `${emp.first_name || ''} ${emp.last_name || ''}`
            .toLowerCase();

        const email =
          (emp.email || '')
            .toLowerCase();

  
        const employeeId =
  String(emp.employee_id || '')
    .toLowerCase();

        return (
          fullName.includes(searchText) ||
          email.includes(searchText) ||
          employeeId.includes(searchText)
        );

      }
    );

}



  // =========================================================
  // EMPLOYEE SELECTION
  // =========================================================


  isSelected(empId: number): boolean {

    return this.selectedEmployees.some(
      (e) =>
        e.id === empId
    );

  }

  // =========================================================
  // TOGGLE EMPLOYEE
  // =========================================================

  toggleEmployee(emp: Employee): void {

    const index =
      this.selectedEmployees.findIndex(
        (e) =>
          e.id === emp.id
      );

    if (index > -1) {

      this.selectedEmployees.splice(
        index,
        1
      );

    } else {

      this.selectedEmployees.push(
        emp
      );

    }

    this.selectAllEmployees =
      this.selectedEmployees.length ===
      this.employees.length;

  }

  // =========================================================
  // SELECT ALL
  // =========================================================

  toggleSelectAll(): void {

    if (this.selectAllEmployees) {

      this.selectedEmployees =
        [...this.employees];

    } else {

      this.selectedEmployees = [];

    }

  }

  // =========================================================
  // TOGGLE ALL
  // =========================================================

  toggleAllEmployees(): void {

    if (
      this.selectedEmployees.length ===
      this.employees.length
    ) {

      // Unselect all
      this.selectedEmployees = [];

    } else {

      // Select all
      this.selectedEmployees =
        [...this.employees];

    }

  }

  // =========================================================
  // TOGGLE ALL DESIGNATION EMPLOYEES
  // =========================================================

  toggleAllDesignationEmployees(): void {

    if (
      this.selectedEmployees.length ===
      this.designationEmployeeList.length
    ) {

      // Unselect all designation employees
      this.selectedEmployees = [];

    } else {

      // Select all designation employees
      this.selectedEmployees = [
        ...this.designationEmployeeList
      ];

    }

  }

  // =========================================================
  // REMOVE EMPLOYEE CHIP
  // =========================================================

  removeEmployee(emp: Employee): void {

    const index =
      this.selectedEmployees.findIndex(
        (e) =>
          e.id === emp.id
      );

    if (index > -1) {

      this.selectedEmployees.splice(
        index,
        1
      );

    }

  }

  // =========================================================
  // CONFIRM SELECTION
  // =========================================================

  confirmSelection(): void {

    // Region
    if (
      this.isRegionWiseSelection() &&
      this.isLoadingRegionEmployees
    ) {

      this.confirmRegionSelectionWhenLoaded =
        true;

      return;

    }

    // Zone
    if (
      this.isZoneWiseSelection() &&
      this.isLoadingZoneEmployees
    ) {

      this.confirmZoneSelectionWhenLoaded =
        true;

      return;

    }

    // Circle
    if (
      this.isCircleWiseSelection() &&
      this.isLoadingCircleEmployees
    ) {

      this.confirmCircleSelectionWhenLoaded =
        true;

      return;

    }

    // Branch
    if (
      this.isBranchWiseSelection() &&
      this.isLoadingBranchEmployees
    ) {

      this.confirmBranchSelectionWhenLoaded =
        true;

      return;

    }

    // Designation
    if (
      this.isDesignationWiseSelection() &&
      this.isLoadingDesignationEmployees
    ) {

      return;

    } 


 // =====================================================
// MD / CEO
// =====================================================

if (this.isMdCeoSelection()) {

  console.log('====================================');
  console.log('CONFIRM MD / CEO');
  console.log('TOP EMPLOYEES:', this.employees);
  console.log('FORM TOP EMPLOYEE:', this.form.get('topEmployee')?.value);
  console.log('SELECTED EMPLOYEES BEFORE CLOSE:', this.selectedEmployees);

  const selectedIds =
    this.form.get('topEmployee')?.value || [];

  const finalSelectedEmployees =
    this.employees.filter(
      (employee: Employee) =>
        selectedIds.includes(employee.id)
    );

  console.log(
    'FINAL SELECTED MD/CEO EMPLOYEES:',
    finalSelectedEmployees
  );

  console.log(
    'FINAL COUNT:',
    finalSelectedEmployees.length
  );

  this.dialogRef.close(finalSelectedEmployees);

  return;
}
  // =====================================================
  // NORMAL SELECTION
  // =====================================================

    // Return selected employees
    this.dialogRef.close(
      this.selectedEmployees
    );

  }

  // =========================================================
  // CLOSE WITHOUT CHANGES
  // =========================================================

  closeOnly(): void {

    this.confirmRegionSelectionWhenLoaded =
      false;

    this.confirmZoneSelectionWhenLoaded =
      false;

    this.confirmCircleSelectionWhenLoaded =
      false;

    this.confirmBranchSelectionWhenLoaded =
      false;

    this.dialogRef.close(null);

  }

  // =========================================================
  // CANCEL / RESET
  // =========================================================

  cancelSelection(): void {

    this.confirmRegionSelectionWhenLoaded =
      false;

    this.confirmZoneSelectionWhenLoaded =
      false;

    this.confirmCircleSelectionWhenLoaded =
      false;

    this.confirmBranchSelectionWhenLoaded =
      false;

    this.selectedEmployees = [];

    // Clear designation selection also
    this.designationEmployeeList = [];

    this.dialogRef.close([]);

  }

  // =========================================================
  // DEPARTMENT NAME
  // =========================================================

  getDepartmentName(
    deptId: number
  ): string {

    return (
      this.departments.find(
        (d) =>
          d.id === deptId
      )?.name || ''
    );

  }

}
