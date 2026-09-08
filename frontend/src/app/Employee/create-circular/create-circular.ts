import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeeService } from '../../services/employee-service';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { CircularService } from '../../services/circular-service';
import { MatDialog } from '@angular/material/dialog';
import { SelectEmployeeModal } from '../select-employee-modal/select-employee-modal';

export interface Circular {

  id: number;
  title: string;
  content: string | null;
  circular_code: string;
  circular_pdf: Buffer | null;
  creator_employee_id: number;
  creator_name: string;
  reference_circular_id: number | null;
  source_type_id: number;
  source_type: string;
  effective_from: string;
  created_at: string;
  
  published_at: string | null;
  send_type: 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'PUBLIC';
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'APPROVED' | 'PUBLISHED';
  repeat_cycle: number;
  priority: 'LOW' | 'URGENT' | 'HIGH' | 'MEDIUM';
  specialKeyword: string;
}

interface SourceType {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

export interface Approver {
  id: number;
  employee_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_no: string | null;
  email: string;
  role_name: string | null;
  department_name: string | null;
  branch_name: string | null;
  head_office_name: string | null;
  can_create_circular: 0 | 1;
  can_approve_circular: 0 | 1;
  created_at: string;
}

export interface repeatCycle {
  id: number;
  name: string;
  duration_days: number;
  created_at: string;
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

@Component({
  selector: 'app-create-circular',
  imports: [MatIcon, FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './create-circular.html',
  styleUrl: './create-circular.scss',
})
export class CreateCircular {
  private destroy$ = new Subject<void>();

  circularForm!: FormGroup;
  isDarkMode = false;
  isProcessing = false;
  isPreviousCircularDropdownOpen = false;
  hoveredCircular: Circular | null = null;
isConfidentialityDropdownOpen = false;

  hoverPopupPosition = {
    top: 0,
    left: 0,
  };

  lastSaved: Date | null = null;
  assistantExpanded = false;
  employee: any;
  private readonly DRAFT_KEY = 'createCircularDraft';

  attachedFile: AttachedFile | null = null;
  selectedApprovers: number[] = [];
  maxApprovers: number = 1;
  selectedEmployees: any[] = [];   

//Variable for showing multiple select option 
// All confidentiality levels selected by the user
selectedConfidentialityLevels: string[] = [];

// Employees selected for each confidentiality level
employeesByConfidentiality: { [key: string]: any[] } = {};


  showSelectedEmployeesPopup = false;
  
//Variables for head Office
  branches: any[] = [];
selectedBranches: any[] = [];



  // Track modal state
  private isModalOpening = false;
  private pendingConfidentialityChange: string | null = null;
  private isManualDropdownClick = false;

  // Data arrays
  previousCirculars: Circular[] = [];
  sourceTypes: SourceType[] = [];
  departments: Department[] = [];
  availableApprovers: Approver[] = [];
  repeatCycleData: repeatCycle[] = [];

  confidentialityLevels = [
    // { value: 'PUBLIC', label: 'Public', description: 'Available to all employees' },
    // { value: 'INTERNAL', label: 'Internal', description: 'Restricted to internal staff' },
    // { value: 'CONFIDENTIAL', label: 'Confidential', description: 'Limited access only' },
    // { value: 'RESTRICTED', label: 'Restricted', description: 'Highly sensitive information' },
    // {
    //   value: 'CUSTOM',
    //   label: 'Custom',
    //   description: 'Visible only to selected employees or groups',
    // }, 
 { value: 'PUBLIC', label: 'Public', description: 'Visible to all employees' },

  { value: 'INTERNAL', label: 'Internal', description: 'Visible only to authenticated employees' },

  { value: 'HEAD_OFFICE', label: 'Head Office (HO)', description: 'Only Head Office users' },

  { value: 'CORPORATE_OFFICE', label: 'Corporate Office', description: 'Corporate office staff only' },

  { value: 'BOARD_OF_DIRECTORS', label: 'Board of Directors', description: 'Chairman, Vice Chairman, Directors' },

  { value: 'MD_CEO', label: 'Managing Director / CEO', description: 'Top management only' },

  // { value: 'EXECUTIVE_COMMITTEE', label: 'Executive Committee', description: 'Committee members only' },

  { value: 'REGION_WISE', label: 'Region Wise', description: 'Selected regions' },

  { value: 'ZONE_WISE', label: 'Zone Wise', description: 'Selected zones' },

  { value: 'CIRCLE_WISE', label: 'Circle Wise', description: 'Selected circles' },

  { value: 'BRANCH_WISE', label: 'Branch Wise', description: 'Selected branches' },

  { value: 'DEPARTMENT_WISE', label: 'Department Wise', description: 'Selected departments' },

  { value: 'DESIGNATION_WISE', label: 'Designation Wise', description: 'Managers, Clerks, Officers' },

  { value: 'ROLE_WISE', label: 'Role Wise', description: 'Based on system roles' },

  { value: 'USER_WISE', label: 'User Wise', description: 'Specific users' },

  { value: 'COMMITTEE_WISE', label: 'Committee Wise', description: 'Committee members' }, 

  { value: 'CONFIDENTIAL_USER', label: 'Confidential', description: 'Restricted to user' },

  // { value: 'PRODUCT_WISE', label: 'Product Wise', description: 'Product teams' },

  // { value: 'CUSTOMER_FACING', label: 'Customer Facing', description: 'Customer-facing staff' },

  // { value: 'CONFIDENTIAL_GROUP', label: 'Confidential Group', description: 'Restricted users only' },

  // { value: 'EXTERNAL', label: 'External', description: 'Auditors, Consultants, Regulators' }

  ];

  activeFormats = {
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    orderedList: false,
  };

  filteredConfidentialityLevels: { value: string; label: string; description: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private circularService: CircularService,
    private employeeService: EmployeeService,
    private dialog: MatDialog,
  ) {
    this.initializeForm();
    this.detectSystemTheme();
  }

  private decryptData(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch (error) {
      return '';
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadEmployeeData();
    this.loadData();
    this.loadMaxApprovers();
   

    const draft = localStorage.getItem(this.DRAFT_KEY);

    if (draft) {
      if (confirm('An unsaved circular draft was found. Do you want to restore it?')) {
        this.restoreDraft();
      } else {
        localStorage.removeItem(this.DRAFT_KEY);
      }
    }

    this.setupAutoSave();
    this.setupEditorEventListeners();

    // Confidentiality change handler
    this.circularForm.get('confidentiality')?.valueChanges.subscribe((value) => {
      this.handleConfidentialityChange(value);
    });
  }

  // ADD THE METHOD HERE
  loadMaxApprovers(): void {
    this.circularService.getMaxApprovers().subscribe({
      next: (response: any) => {
        this.maxApprovers = Number(response.maxApprovers);
        console.log('Maximum approvers allowed:', this.maxApprovers);
      },
      error: (error) => {
        console.error('Error loading maximum approvers:', error);
      },
    });
  }

  // metod for selection color

  isConfidentialityPreviouslySelected(level: string): boolean {
  return this.selectedConfidentialityLevels.includes(level);
} 

toggleConfidentialityDropdown(): void {
  this.isConfidentialityDropdownOpen =
    !this.isConfidentialityDropdownOpen;
} 


selectConfidentialityLevel(level: string): void {

  // Set the current form value
  this.circularForm
    .get('confidentiality')
    ?.setValue(level);

  // Add to previously selected levels
  if (!this.selectedConfidentialityLevels.includes(level)) {

    this.selectedConfidentialityLevels.push(level);

  }

  // Close dropdown
  this.isConfidentialityDropdownOpen = false;

  // Run your existing logic
  this.onConfidentialityDropdownClick();
} 

getConfidentialityDropdownLabel(levelValue: string): string {

  const level = this.filteredConfidentialityLevels.find(
    l => l.value === levelValue
  );

  return level
    ? `${level.label} - ${level.description}`
    : 'Select confidentiality level';
}




  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //   private generateCircularCode(): string {
  //   const now = new Date();

  //   return (
  //     'CIR-' +
  //     now.getFullYear() +
  //     String(now.getMonth() + 1).padStart(2, '0') +
  //     String(now.getDate()).padStart(2, '0') +
  //     String(now.getHours()).padStart(2, '0') +
  //     String(now.getMinutes()).padStart(2, '0') +
  //     String(now.getSeconds()).padStart(2, '0') +
  //     '-' +
  //     Math.floor(1000 + Math.random() * 9000)
  //   );
  // }

  // Handle dropdown click to detect manual selection
  onConfidentialityDropdownClick(): void {
    const currentValue = this.circularForm.get('confidentiality')?.value;

    // If we already have a modal-required level selected AND we have employees, open modal
    if (
      (currentValue === 'CONFIDENTIAL' ||
        currentValue === 'RESTRICTED' ||
        currentValue === 'CUSTOM') &&
      this.selectedEmployees.length > 0
    ) {
      // Use setTimeout to avoid interfering with the dropdown opening
      setTimeout(() => {
        this.openEmployeeModal();
      }, 100);
    }
  }


//   private handleConfidentialityChange(value: string): void 
//   {
    
//     if (this.isModalOpening) {
//       this.isModalOpening = false;
//       return;
//     }
     
// if (
  
//  value === 'HEAD_OFFICE' ||
//   value === 'CORPORATE_OFFICE' ||
//   value === 'BOARD_OF_DIRECTORS' ||
//   value === 'MD_CEO' ||
//   value === 'EXECUTIVE_COMMITTEE' ||
//   value === 'REGION_WISE' ||
//   value === 'ZONE_WISE' ||
//   value === 'CIRCLE_WISE' ||
//   value === 'BRANCH_WISE' ||
//   value === 'DEPARTMENT_WISE' ||
//   value === 'DESIGNATION_WISE' ||
//   value === 'ROLE_WISE' ||
//   value === 'USER_WISE' ||
//   value === 'COMMITTEE_WISE' ||
//   value === 'PRODUCT_WISE' ||
//   value === 'CUSTOMER_FACING' ||
//   value === 'CONFIDENTIAL_GROUP' ||
//   value === 'EXTERNAL'


// ) {
//   this.pendingConfidentialityChange = value;

//   setTimeout(() => {
//     this.openEmployeeModal();
//   });

//   return;
// }
 
//     else {
//       // For non-modal levels, clear selected employees
//       this.selectedEmployees = [];
//       this.pendingConfidentialityChange = null;
//     }
//   } 


private handleConfidentialityChange(value: string): void {

  // Ignore empty value
  if (!value) {
    return;
  }

  // =====================================================
  // PUBLIC
  // =====================================================

  if (value === 'PUBLIC') {

    this.addConfidentialityLevel('PUBLIC');

    // Load ALL employees
    this.loadAllEmployeesForPublic();

    return;
  }


  // =====================================================
  // INTERNAL
  // =====================================================

  if (value === 'INTERNAL') {

    this.addConfidentialityLevel('INTERNAL');

    // Keep existing employees from other levels
    this.updateCombinedSelectedEmployees();

    return;
  }


  // =====================================================
  // OTHER CONFIDENTIALITY LEVELS
  // =====================================================

  this.addConfidentialityLevel(value);

  this.pendingConfidentialityChange = value;
  // console.log('pending confidentiablity:',value);

  setTimeout(() => {
    this.openEmployeeModal();
  });

}









toggleBranch(branch: any, event: Event): void {

  const checked = (event.target as HTMLInputElement).checked;

  if (checked) {

    this.selectedBranches.push(branch);

  } else {

    this.selectedBranches = this.selectedBranches.filter(
      b => b.id !== branch.id
    );

  }

  console.log(this.selectedBranches);

}


  //ConfidentialityNote
  getConfidentialityNote(): string {
    const value = this.circularForm.get('confidentiality')?.value;

    switch (value) {
      case 'PUBLIC':
        return 'This circular will be visible to all employees.';

      case 'INTERNAL':
        return 'This circular will be visible to internal employees of your Head Office, Branch, and/or Department.';

      case 'CONFIDENTIAL':
        return 'This circular will be visible only to the selected employees.';

      case 'RESTRICTED':
        return 'This highly sensitive circular will be visible only to the selected employees.';

      case 'CUSTOM':
        return 'This circular will be visible only to the employees or groups you select.';

      default:
        return '';
    }
  }

  //For going submit but to rquired filled
  scrollToFirstInvalidField(): void {
    const firstInvalidControl = document.querySelector(
      '.form-input.ng-invalid, .form-select.ng-invalid, .rich-editor.error',
    ) as HTMLElement;

    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      firstInvalidControl.focus();
    }
  }

//helper function for multiple option selction 
private isEmployeeSelectionLevel(level: string): boolean {
  return [
    'HEAD_OFFICE',
    'CORPORATE_OFFICE',
    'BOARD_OF_DIRECTORS',
    'MD_CEO',
    'EXECUTIVE_COMMITTEE',
    'REGION_WISE',
    'ZONE_WISE',
    'CIRCLE_WISE',
    'BRANCH_WISE',
    'DEPARTMENT_WISE',
    'DESIGNATION_WISE',
    'ROLE_WISE',
    'USER_WISE', 
    'CONFIDENTIAL_USER',
    'COMMITTEE_WISE',
    'PRODUCT_WISE',
    'CUSTOMER_FACING',
    'CONFIDENTIAL_GROUP',
    'EXTERNAL'
  ].includes(level);
} 

//For adding confendentiablity 
private addConfidentialityLevel(level: string): void {
  if (!this.selectedConfidentialityLevels.includes(level)) {
    this.selectedConfidentialityLevels.push(level);
  }
}

//For removing confendentiablity 
removeConfidentialityLevel(level: string): void {
  this.selectedConfidentialityLevels =
    this.selectedConfidentialityLevels.filter(
      item => item !== level
    );

  delete this.employeesByConfidentiality[level];

  // Rebuild combined employee list
  this.updateCombinedSelectedEmployees();

  // If removing current level, select another one
  if (this.circularForm.get('confidentiality')?.value === level) {

    const nextLevel = this.selectedConfidentialityLevels[0] || 'INTERNAL';

    this.circularForm.patchValue(
      {
        confidentiality: nextLevel
      },
      { emitEvent: false }
    );
  }
}

//Update Confendentiablity level 

private updateCombinedSelectedEmployees(): void {
  const employeeMap = new Map<number, any>();

  Object.values(this.employeesByConfidentiality)
    .flat()
    .forEach(emp => {
      if (emp?.id != null) {
        employeeMap.set(emp.id, emp);
      }
    });

  this.selectedEmployees = Array.from(employeeMap.values());
}




  // Open employee modal with proper state management
  // openEmployeeModal(): void {
  //   // Prevent multiple modals from opening
  //   if (this.isModalOpening) {
  //     return;
  //   }

  //   this.isModalOpening = true;

  //   const dialogRef = this.dialog.open(SelectEmployeeModal, {
  //     width: '800px',
  //     panelClass: 'custom-dialog-container',
  //     data: {
  //       preSelectedEmployees: [...this.selectedEmployees],
  //       confidentiality: this.pendingConfidentialityChange || this.circularForm.get('confidentiality')?.value,
  //     },
  //   });

  //   dialogRef.afterClosed().subscribe((result) => {
  //     this.isModalOpening = false;
  //     if (result === null) {
  //       return;
  //     } else if (result && Array.isArray(result)) {
  //       if (result.length > 0) {
  //         // User confirmed selection
  //         this.selectedEmployees = result;
  //         console.log('Selected employees:', this.selectedEmployees);

  //         // Ensure the confidentiality level stays as selected
  //         if (this.pendingConfidentialityChange) {
  //           this.circularForm.patchValue(
  //             {
  //               confidentiality: this.pendingConfidentialityChange,
  //             },
  //             { emitEvent: false },
  //           );
  //           this.pendingConfidentialityChange = null;
  //         }
  //       } else {
  //         // User cancelled with empty array - remove employees and reset confidentiality
  //         this.handleModalCancellation();
  //       }
  //     } else {
  //       // User cancelled (undefined result) - remove employees and reset confidentiality
  //       this.handleModalCancellation();
  //     }
  //   });
  // }
openEmployeeModal(): void {

  if (this.isModalOpening) {
    return;
  }

  this.isModalOpening = true;

  const confidentiality =
    this.pendingConfidentialityChange ||
    this.circularForm.get('confidentiality')?.value;

  const previousEmployees =
    this.employeesByConfidentiality[confidentiality] || [];

  const dialogRef = this.dialog.open(SelectEmployeeModal, {

    width: '800px',

    panelClass: 'custom-dialog-container',

    data: {

      // IMPORTANT:
      // Only employees belonging to THIS confidentiality level
      preSelectedEmployees: [...previousEmployees],

      // Existing modal logic continues to use this
      confidentiality: confidentiality,

    },

  });

  dialogRef.afterClosed().subscribe((result) => {

    this.isModalOpening = false;

    // User clicked Cancel / closed modal
    if (result === null || result === undefined) {
      return;
    }

    // User confirmed employees
    if (Array.isArray(result)) {

      if (result.length > 0) {

        // Store employees under THIS confidentiality level
        this.employeesByConfidentiality[confidentiality] = [...result];

        console.log(
          'Employees for',
          confidentiality,
          ':',
          this.employeesByConfidentiality[confidentiality]
        );

        // Rebuild combined employee list
        this.updateCombinedSelectedEmployees();

        // Keep current confidentiality in form
        this.circularForm.patchValue(
          {
            confidentiality: confidentiality
          },
          {
            emitEvent: false
          }
        );

        this.pendingConfidentialityChange = null;

      } else {

        // Empty result = remove this newly selected level
        this.removeConfidentialityLevel(confidentiality);

        this.pendingConfidentialityChange = null;
      }

    }

  });
}


//LoadEMployee for public and internal Confedentiability Level
private loadAllEmployeesForPublic(): void {

  console.log('PUBLIC selected - loading ALL employees');

  this.employeeService.getAllEmployees().subscribe({

    next: (response: any) => {

      const employees = Array.isArray(response)
        ? response
        : response?.data || [];

      console.log(
        'PUBLIC - Total employees:',
        employees.length
      );

      // Store ALL employees under PUBLIC
      this.employeesByConfidentiality['PUBLIC'] = [
        ...employees
      ];

      // Combine PUBLIC + other selected levels
      this.updateCombinedSelectedEmployees();

      console.log(
        'Final selected employees:',
        this.selectedEmployees.length
      );

    },

    error: (error) => {

      console.error(
        'Error loading all employees for PUBLIC:',
        error
      );

      this.employeesByConfidentiality['PUBLIC'] = [];

      this.updateCombinedSelectedEmployees();

    }

  });

}










  // Handle modal cancellation
  // private handleModalCancellation(): void {
  //   // Clear selected employees
  //   this.selectedEmployees = [];

  //   // Revert to default confidentiality level
  //   const defaultLevel = 'INTERNAL';
  //   this.circularForm.patchValue(
  //     {
  //       confidentiality: defaultLevel,
  //     },
  //     { emitEvent: false },
  //   );

  //   this.pendingConfidentialityChange = null;
  //   console.log('Modal cancelled - reverted to default confidentiality');
  // }



//Get confedentiablity level 
getConfidentialityLabel(value: string): string {

  const level = this.confidentialityLevels.find(
    item => item.value === value
  );

  return level ? level.label : value;
}

  // Method to manually open modal for existing selection
  editSelectedEmployees(): void {
    this.openEmployeeModal();
  }

  private filterConfidentialityOptions(): void {
    if (this.employee!.branch_id) {
      this.filteredConfidentialityLevels = this.confidentialityLevels.filter(
        (level) => level.value === 'INTERNAL',
      );
    } else {
      this.filteredConfidentialityLevels = [...this.confidentialityLevels];
    }

    const current = this.circularForm.get('confidentiality')?.value;
    if (!this.filteredConfidentialityLevels.some((lvl) => lvl.value === current)) {
      this.circularForm.patchValue({
        confidentiality: this.filteredConfidentialityLevels[0].value,
      });
    }
  }

  private loadEmployeeData(): void {
    if (typeof window !== 'undefined') {
      const encryptedUser = localStorage.getItem('emp_user');
      if (encryptedUser) {
        const decryptedUser = this.decryptData(encryptedUser);
        this.employee = JSON.parse(decryptedUser);
        console.log('Logged in employee:', this.employee);

        const fullName = `${this.employee.first_name} ${this.employee.last_name}`.trim();

        this.circularForm.patchValue({
          originator: fullName,
          originator_id: this.employee.id,
        });
        this.filterConfidentialityOptions();
      }
    }
  }

  // validator for select employee when the confidentiality is CONFIDENTIAL ,RESTRICTED ,CUSTOM
//   private confidentialityValidator(control: AbstractControl): ValidationErrors | null {
//     const value = control.value;
//     // const requiresEmployees = ['CONFIDENTIAL', 'RESTRICTED', 'CUSTOM'];
//     const requiresEmployees = [
//   'DEPARTMENT_WISE',
//   'ROLE_WISE',
//   'USER_WISE'
// ];



//     if (requiresEmployees.includes(value) && this.selectedEmployees.length === 0) {
//       return { employeesRequired: true };
//     }

//     return null;
//   }
private confidentialityValidator(
  control: AbstractControl
): ValidationErrors | null {

  const value = control.value;

  const requiresEmployees = [
    'DEPARTMENT_WISE',
    'ROLE_WISE',
    'USER_WISE',
    'CONFIDENTIAL_USER'
  ];

  if (
    requiresEmployees.includes(value) &&
    (!this.employeesByConfidentiality[value] ||
      this.employeesByConfidentiality[value].length === 0)
  ) {
    return { employeesRequired: true };
  }

  return null;
}




  // Custom validator for today or future dates
  private todayOrFutureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const selectedDate = new Date(control.value);
    const today = new Date();

    const selectedDateOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    );
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (selectedDateOnly < todayOnly) {
      return { pastDate: true };
    }

    return null;
  }

  private initializeForm(): void {
    this.circularForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      circular_code: ['', Validators.required],
      previous_circular_id: [''],
      source_type_id: ['', Validators.required],
      originator: ['', Validators.required],
      originator_id: [''],
      confidentiality: [
        'INTERNAL',
        [Validators.required, this.confidentialityValidator.bind(this)],
      ],
      // effective_from: ['', [Validators.required, this.todayOrFutureDateValidator.bind(this)]],
      effective_from: [
        this.getTodayDate(),
        [Validators.required, this.todayOrFutureDateValidator.bind(this)],
      ],
      repeat_cycle: ['', Validators.required],
      content: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['MEDIUM', Validators.required],
      specialKeyword: [''],
    });
  }

  // getTodayDate(): string {
  //   const today = new Date();
  //   return today.toISOString().slice(0, 16);
  // }
  getTodayDate(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private detectSystemTheme(): void {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.isDarkMode = mediaQuery.matches;

      mediaQuery.addEventListener('change', (e) => {
        this.isDarkMode = e.matches;
      });
    }
  }

  private setupAutoSave(): void {
    this.circularForm.valueChanges
      .pipe(debounceTime(3000), takeUntil(this.destroy$))
      .subscribe(() => {
        this.autoSave();
      });
  }

  // Form validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.circularForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  // Theme management
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
  }

  // Navigation
  goBack(): void {
    // this.router.navigate(['/employee/employee-dashboard']);
    window.history.back();
  }

  togglePreviousCircularDropdown(): void {
    this.isPreviousCircularDropdownOpen = !this.isPreviousCircularDropdownOpen;
  }

  selectPreviousCircular(circular: Circular): void {
    this.circularForm.patchValue({
      previous_circular_id: circular.id,
    });

    this.isPreviousCircularDropdownOpen = false;
    this.hoveredCircular = null;

    console.log('Selected previous circular:', circular);
  }

  showCircularPopup(event: MouseEvent, circular: Circular): void {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();

    this.hoveredCircular = circular;

    this.hoverPopupPosition = {
      top: rect.top,
      left: rect.right + 12,
    };
  }

  hideCircularPopup(): void {
    this.hoveredCircular = null;
  }

  getSelectedPreviousCircularText(): string {
    const selectedId = Number(this.circularForm.get('previous_circular_id')?.value);

    const selectedCircular = this.previousCirculars.find((circular) => circular.id === selectedId);

    return selectedCircular
      ? `${selectedCircular.circular_code} - ${selectedCircular.title}`
      : 'Select previous circular';
  }

  // Data loading
  private loadData(): void {
    // get source type
    this.circularService.getSourceTypes().subscribe((data) => {
      this.sourceTypes = data as SourceType[];

      if (this.circularForm.value.source_type_id) {
        this.circularForm.patchValue({
          source_type_id: this.circularForm.value.source_type_id,
        });
      }
    });

    // get circular
    this.circularService.getAllApprovedCirculars().subscribe((data) => {
      console.log(data);
      this.previousCirculars = data as Circular[];
    });

    // get Approvers
    this.employeeService.getApprovers().subscribe((data) => {
      console.log(data);
      this.availableApprovers = data as Approver[];
    });

    this.circularService.getReapetCycleDataForEmployee().subscribe((data) => {
      this.repeatCycleData = data as repeatCycle[];
    });
  }

loadBranches(): void {

  // this.circularService
  //   .getBranchesByHeadOfficeId(this.employee.head_office_id)
  //   .subscribe({

  //     next: (res: any) => {

  //       this.branches = res.data;

  //       console.log("Branches", this.branches);

  //     },

  //     error: err => {

  //       console.error(err);

  //     }

  //   });
 this.employeeService
    .getBranchesByHeadOfficeId(this.employee.head_office_id)
    .subscribe({
      next: (res: any) => {
        this.branches = res.data;
        console.log("Branches:", this.branches);
      },
      error: (err: any) => {
        console.error(err);
      }
    });










}






  // File management
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open(`File ${file.name} is too large (max 10MB)`, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        input.value = '';
        return;
      } else if (file.type !== 'application/pdf') {
        this.snackBar.open(`Only PDF files are allowed.`, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        input.value = '';
        return;
      }

      this.attachedFile = {
        id: this.generateId(),
        name: file.name,
        size: file.size,
        file: file,
      };
    } else {
      this.attachedFile = null;
    }

    input.value = '';
  }

  removeFile(): void {
    this.attachedFile = null;
  }

  truncateFileName(name: string): string {
    return name.length > 20 ? name.substring(0, 17) + '...' : name;
  }

  trackByFileId(index: number, file: AttachedFile): string {
    return file.id;
  }

  




  // Method to check current formatting state
  checkActiveFormats(): void {
    if (typeof document === 'undefined') return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const parentElement = range.commonAncestorContainer.parentElement;

    if (parentElement) {
      // Check if we're in a list
      const listParent = parentElement.closest('ul, ol, li');

      this.activeFormats = {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        unorderedList: listParent?.tagName === 'UL',
        orderedList: listParent?.tagName === 'OL',
      };
    }
  }

  // Rich text editor
  // Update your formatText method to check formats after applying
  formatText(command: string): void {
    document.execCommand(command, false);

    // Check active formats after a short delay to ensure the command has been applied
    this.checkActiveFormats();
  }

  onContentChange(event: Event) {
    const content = (event.target as HTMLElement).innerHTML;
    this.circularForm.get('content')?.setValue(content, { emitEvent: false });

    // Check active formats when content changes
    this.checkActiveFormats();
  }

  // Add click handler for the editor to update formats when user clicks
  onEditorClick(): void {
    // Check formats after a short delay to ensure selection is updated
    setTimeout(() => {
      this.checkActiveFormats();
    }, 50);
  }

  // Add selection change handler to track formats in real-time
  setupEditorEventListeners(): void {
    if (typeof document === 'undefined') return;

    // Listen for selection changes
    document.addEventListener('selectionchange', () => {
      this.checkActiveFormats();
    });
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }

  getContentLength(): number {
    const content = this.circularForm.get('content')?.value || '';
    return content.replace(/<[^>]*>/g, '').length;
  }

  // Reviewer management
  // toggleApprover(approverId: number, event: Event): void {
  //   const checked = (event.target as HTMLInputElement).checked;

  //   if (checked) {
  //     if (!this.selectedApprovers.includes(approverId)) {
  //       this.selectedApprovers.push(approverId);
  //     }
  //   } else {
  //     this.selectedApprovers = this.selectedApprovers.filter((id) => id !== approverId);
  //   }
  // }
  toggleApprover(approverId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const checked = checkbox.checked;

    if (checked) {
      if (this.selectedApprovers.length >= this.maxApprovers) {
        checkbox.checked = false;

        this.snackBar.open(`You can select only ${this.maxApprovers} approver(s)`, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });

        return;
      }

      if (!this.selectedApprovers.includes(approverId)) {
        this.selectedApprovers.push(approverId);
      }
    } else {
      this.selectedApprovers = this.selectedApprovers.filter((id) => id !== approverId);
    }

    console.log('Selected approvers:', this.selectedApprovers);
  }

  removeApprover(approverId: number): void {
    this.selectedApprovers = this.selectedApprovers.filter((id) => id !== approverId);
  }

  getApproverName(approverId: number): string {
    const approver = this.availableApprovers.find((r) => r.id === approverId);
    return approver ? approver.first_name : '';
  }

  // Smart assistant
  toggleAssistant(): void {
    this.assistantExpanded = !this.assistantExpanded;
  }

  applySuggestion(type: string): void {
    switch (type) {
      case 'template':
        this.applyTemplate();
        break;
      case 'check':
        this.performGrammarCheck();
        break;
      case 'similar':
        this.findSimilarCirculars();
        break;
    }
    this.assistantExpanded = false;
  }

  private clearForm(): void {
    this.circularForm.reset();
    this.attachedFile = null;
    this.selectedApprovers = [];
    this.selectedEmployees = [];
    this.selectedConfidentialityLevels = [];

this.employeesByConfidentiality = {};
    this.circularForm.patchValue({
      confidentiality: 'INTERNAL',
    });
    this.isModalOpening = false;
    this.pendingConfidentialityChange = null;
  }

  private applyTemplate(): void {
    const template = `
      <p><strong>Subject:</strong> [Enter subject here]</p>
      <br>
      <p><strong>Dear All,</strong></p>
      <p>This is to inform you that...</p>
      <br>
      <p>Key points:</p>
      <ul>
        <li>Point 1</li>
        <li>Point 2</li>
        <li>Point 3</li>
      </ul>
      <br>
      <p>For any queries, please contact...</p>
      <br>
      <p>Best regards,<br>[Your name]</p>
    `;

    this.circularForm.patchValue({ content: template });
    this.snackBar.open('Template applied successfully', 'Close', { duration: 2000 });
  }

  private performGrammarCheck(): void {
    this.snackBar.open('Grammar check feature coming soon', 'Close', { duration: 2000 });
  }

  private findSimilarCirculars(): void {
    this.snackBar.open('Similar circulars feature coming soon', 'Close', { duration: 2000 });
  }

  // Actions
  autoSave(): void {
    // this.lastSaved = new Date();
    console.log('Auto Save Called');

    const draft = {
      form: this.circularForm.value,
      selectedApprovers: this.selectedApprovers,
      selectedEmployees: this.selectedEmployees,
        selectedConfidentialityLevels:
    this.selectedConfidentialityLevels,

  employeesByConfidentiality:
    this.employeesByConfidentiality
    };

    localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));

    console.log('Saved Draft:', draft);

    this.lastSaved = new Date();
  }

  private restoreDraft(): void {
    console.log('Restore Called');

    const draft = localStorage.getItem(this.DRAFT_KEY);

    console.log('Draft from localStorage:', draft);

    if (!draft) return;

    const data = JSON.parse(draft);

    console.log('Parsed Draft:', data);

    this.circularForm.patchValue(data.form);

    this.selectedApprovers = data.selectedApprovers || [];
    this.selectedEmployees = data.selectedEmployees || [];

this.selectedConfidentialityLevels =
  data.selectedConfidentialityLevels || [];

this.employeesByConfidentiality =
  data.employeesByConfidentiality || {};


  }

  previewCircular(): void {
    this.snackBar.open('Preview feature coming soon', 'Close', { duration: 2000 });
  }

  discardDraft(): void {
    if (confirm('Are you sure you want to discard this draft? All changes will be lost.')) {
      localStorage.removeItem(this.DRAFT_KEY);

      this.clearForm();
      this.router.navigate(['/employee/employee-dashboard']);
    }
  }

  submitCircular(status: 'DRAFT' | 'PENDING_APPROVAL'): void {
    // For DRAFT - only check title and circular code
    if (status === 'DRAFT') {
      if (!this.circularForm.value.title || !this.circularForm.value.circular_code) {
        this.snackBar.open('Title and Circular Code are required to save draft', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        return;
      }
    }  





    // For APPROVAL - check everything
    if (status === 'PENDING_APPROVAL') {
      if (this.circularForm.invalid) {
        this.circularForm.markAllAsTouched();
        setTimeout(() => {
          this.scrollToFirstInvalidField();
        }, 100);
        return;
      }

      if (!this.attachedFile) {
        this.snackBar.open('PDF file is required', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        return;
      }
      if (this.selectedApprovers.length !== this.maxApprovers) {
        this.snackBar.open(`You must select exactly ${this.maxApprovers} approver(s)`, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        return;
      }
    }

    this.isProcessing = true;

    const formData = new FormData();
    formData.append('title', this.circularForm.value.title || '');
    formData.append('content', this.circularForm.value.content || '');
    formData.append('source_type_id', this.circularForm.value.source_type_id || '');
    formData.append('creator_employee_id', this.circularForm.value.originator_id || '');
    formData.append('circular_code', this.circularForm.value.circular_code);
    // formData.append('send_type', this.circularForm.value.confidentiality);


//new change that support current UI
const confidentiality = this.circularForm.value.confidentiality;

let sendType = 'CUSTOM';

switch (confidentiality) {

  case 'PUBLIC':
    sendType = 'PUBLIC';
    break;

  case 'INTERNAL':
    sendType = 'INTERNAL';
    break;

  case 'HEAD_OFFICE':
    sendType = 'CUSTOM';
    break;

  case 'CORPORATE_OFFICE':
  case 'BOARD_OF_DIRECTORS':
  case 'MD_CEO':
  case 'EXECUTIVE_COMMITTEE':
  case 'REGION_WISE':
  case 'ZONE_WISE':
  case 'CIRCLE_WISE':
  case 'BRANCH_WISE':
    sendType = 'INTERNAL';
    break;

  case 'DEPARTMENT_WISE':
  case 'DESIGNATION_WISE':
  case 'ROLE_WISE':
  case 'USER_WISE':
  case 'COMMITTEE_WISE':
  case 'PRODUCT_WISE':
  case 'CUSTOMER_FACING':
  case 'CONFIDENTIAL_GROUP':
  case 'EXTERNAL':
    sendType = 'CUSTOM';
    break;
}

formData.append('send_type', sendType);
formData.append('visibility_type', confidentiality);






    formData.append('effective_from', this.circularForm.value.effective_from || '');
    formData.append('repeat_cycle', this.circularForm.value.repeat_cycle);
    formData.append('status', status);
    formData.append('reference_circular_id', this.circularForm.value.previous_circular_id || '');
    formData.append('priority', this.circularForm.value.priority || '');
    formData.append('specialKeyword', this.circularForm.value.specialKeyword || '');
    if (this.attachedFile) {
      formData.append('pdfFile', this.attachedFile.file, this.attachedFile.name);
    }

    if (status === 'PENDING_APPROVAL') {
      formData.append('approvers', JSON.stringify(this.selectedApprovers));
    }

    if (status === 'PENDING_APPROVAL') {
      const employeeIds = this.selectedEmployees.map((e) => e.id);
      formData.append('visiblityEmployee', JSON.stringify(employeeIds));
    }

    if (status === 'PENDING_APPROVAL') {
      if (this.circularForm.value.confidentiality === 'INTERNAL') {
        formData.append('headOfficeId', this.employee.head_office_id || '');
        formData.append('branchId', this.employee.branch_id || '');
        formData.append('departmentId', this.employee.department_id || '');
      }
    }

    console.log(formData.values, 'formdata');
    console.log(this.circularForm.value, 'circularForm');


    for (const pair of formData.entries()) {
  console.log(pair[0], pair[1]);
}
 

    this.circularService.uploadCircular(formData).subscribe({
      next: (res) => {
        this.isProcessing = false;
        const message = status === 'DRAFT' ? 'Draft saved!' : 'Submitted for approval!';
        this.snackBar.open(message, 'Close', { duration: 3000 });

        // Remove temporary draft from browser
        // localStorage.removeItem(this.DRAFT_KEY);
        if (status === 'PENDING_APPROVAL') {
          localStorage.removeItem(this.DRAFT_KEY);
        }

        this.clearForm();
        this.loadEmployeeData();

        if (status === 'PENDING_APPROVAL') {
          setTimeout(() => {
            this.router.navigate(['/employee/circular-creater']);
          }, 1500);
        }
      },
      error: (err) => {
        this.isProcessing = false;
        this.snackBar.open('Failed to submit circular', 'Close', { duration: 3000 });
      },
    });
  }
  
  // Add this simple method to check if draft can be saved
  canSaveDraft(): boolean {
    return !!(this.circularForm.value.title && this.circularForm.value.circular_code);
  }

  // Utility functions
  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}
