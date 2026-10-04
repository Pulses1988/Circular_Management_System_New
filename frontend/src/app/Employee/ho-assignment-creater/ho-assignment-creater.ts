import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,

  Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { SelectEmployeeModal } from '../select-employee-modal/select-employee-modal';
import { HoAssignmentService } from '../../services/ho-assignment';



interface SourceType {
  id: number;
  name: string;
}

@Component({
  selector: 'app-ho-assignment-creater',

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIcon,
      MatFormFieldModule,
MatSelectModule
  ],

  templateUrl: './ho-assignment-creater.html',
  styleUrl: './ho-assignment-creater.scss'
})
export class HoAssignmentCreater {

  /* =========================================================
     FORM
  ========================================================= */

  hoAssignmentForm!: FormGroup;


  /* =========================================================
     THEME
  ========================================================= */

  isDarkMode = false;


  /* =========================================================
     PROCESSING
  ========================================================= */

  isProcessing = false;


  /* =========================================================
     DRAFT
  ========================================================= */

  private readonly draftStorageKey =
    'createHOAssignmentDraft';


  /* =========================================================
     FILE
  ========================================================= */

  selectedFile: File | null = null;


  /* =========================================================
     EMPLOYEES
  ========================================================= */

  selectedEmployees: any[] = [];  
  previousAssignments: any[] = []; 

  
sourceTypes: SourceType[] = [];


  showSelectedEmployeesPopup = false;
showSelectedEmployeesList = false;

  /* =========================================================
     VISIBILITY
  ========================================================= */

  selectedConfidentialityLevels: string[] = [];

  /*
   * Controls whether the visibility dropdown is shown
   * inside Assignment Visibility.
   *
   * Flow:
   *
   * Select Employees
   *       ↓
   * Show Visibility
   *       ↓
   * Select Visibility
   *       ↓
   * Open Employee Modal
   */
  showEmployeeVisibility = false;


  /* =========================================================
     RICH TEXT EDITOR
  ========================================================= */

  @ViewChild('richEditor')
  richEditor?: ElementRef<HTMLDivElement>;


  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private hoAssignmentService: HoAssignmentService,
    private dialog: MatDialog
  ) {}


  /* =========================================================
     INIT
  ========================================================= */

  ngOnInit(): void {

    this.initializeForm();

    this.loadTheme();

    this.loadDraft();
 this.loadPreviousAssignments(); 
  this.loadSourceTypes();
  }


  /* =========================================================
     FORM INITIALIZATION
  ========================================================= */

  private initializeForm(): void {

    this.hoAssignmentForm = this.fb.group({

      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ],

      assignment_code: [
        '',
        // Validators.required
      ],

      specialKeyword: [
        ''
      ],

      previous_assignment_id: [
        ''
      ],

      source_type_id: [
        '',
        // Validators.required
      ],

      originator: [
        ''
      ],

      /*
       * Visibility is now selected from
       * Assignment Visibility section.
       *
       * Empty initially so user can select
       * the visibility after clicking
       * "Select Employees".
       */
      confidentiality: [
        '',
        // Validators.required
      ],

      effective_from: [
        this.getTodayDate(),
        // Validators.required
      ],

      repeat_cycle: [
        '',
        // Validators.required
      ],

      priority: [
        'MEDIUM',
        // Validators.required
      ],

      content: [
        '',
        [
          // Validators.required,
          // Validators.minLength(10)
        ]
      ]

    });


    /*
     * Keep selected confidentiality
     * state synchronized with the form.
     */

    this.hoAssignmentForm
     this.hoAssignmentForm
  .get('confidentiality')
  ?.valueChanges
  .subscribe((value: string) => {

    if (!value) {
      return;
    }

    this.selectedConfidentialityLevels = [
      value
    ];

    /*
     * Open employee selection automatically
     * after visibility is selected.
     */

    this.openEmployeeSelection();

  });

  }

  //Adding Method for LoadAssignment 
  private loadPreviousAssignments(): void {
  this.hoAssignmentService.getAllHOAssignments().subscribe({
    next: (response) => {
      console.log('Previous HO Assignments:', response);

      this.previousAssignments = response?.assignments || [];
    },
    error: (error) => {
      console.error('Error loading previous HO assignments:', error);
      this.previousAssignments = [];
    }
  });
}


//Adding Method for Loading Source_types 
private loadSourceTypes(): void {

  this.hoAssignmentService.getSourceTypes().subscribe({

    next: (data: SourceType[]) => {

      console.log('Source Types:', data);

      this.sourceTypes = data || [];

    },

    error: (error) => {

      console.error(
        'Error loading source types:',
        error
      );

      this.sourceTypes = [];

    }

  });

}



  /* =========================================================
     TODAY'S DATE
  ========================================================= */

  private getTodayDate(): string {

    const today = new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        today.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;

  }


  /* =========================================================
     THEME
  ========================================================= */

  private loadTheme(): void {

    const savedTheme =
      localStorage.getItem(
        'hoAssignmentTheme'
      );

    if (savedTheme === 'dark') {

      this.isDarkMode = true;

    } else {

      this.isDarkMode = false;

    }

  }


  toggleTheme(): void {

    this.isDarkMode =
      !this.isDarkMode;

    localStorage.setItem(
      'hoAssignmentTheme',
      this.isDarkMode
        ? 'dark'
        : 'light'
    );

  }


  /* =========================================================
     BACK
  ========================================================= */

  goBack(): void {

    this.router.navigate([
      '/employee/all-ho-assignments'
    ]);

  }


  /* =========================================================
     FILE SELECTION
  ========================================================= */

  onFileSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      input.files.length === 0
    ) {

      return;

    }

    const file =
      input.files[0];


    /*
     * Only PDF
     */

    if (
      file.type !==
      'application/pdf'
    ) {

      alert(
        'Please select a PDF file.'
      );

      input.value = '';

      return;

    }


    /*
     * Maximum 10 MB
     */

    const maxSize =
      10 * 1024 * 1024;

    if (
      file.size > maxSize
    ) {

      alert(
        'File size should not exceed 10 MB.'
      );

      input.value = '';

      return;

    }


    this.selectedFile =
      file;

  }


  /* =========================================================
     FILE NAME
  ========================================================= */

  getSelectedFileName(): string {

    if (!this.selectedFile) {

      return '';

    }

    return this.selectedFile.name;

  }


  /* =========================================================
     REMOVE FILE
  ========================================================= */

  removeSelectedFile(): void {

    this.selectedFile =
      null;

  }


  /* =========================================================
     EMPLOYEE SELECTION
     
     New flow:
     
     Click Select Employees
          ↓
     Show Visibility dropdown
     
     The employee modal will open only
     after a visibility is selected.
  ========================================================= */

  openEmployeeSelection(): void {

    this.showEmployeeVisibility =
      !this.showEmployeeVisibility;

  }


  /* =========================================================
     EMPLOYEE VISIBILITY CHANGE
     
     Called when user selects:
     
     HEAD_OFFICE
     REGION_WISE
     ZONE_WISE
     CIRCLE_WISE
     BRANCH_WISE
     DEPARTMENT_WISE
     DESIGNATION_WISE
     ROLE_WISE
     USER_WISE
     
     from the visibility dropdown.
  ========================================================= */

  onEmployeeVisibilityChange(): void {

    const confidentiality =
      this.hoAssignmentForm
        .get('confidentiality')
        ?.value;

    if (!confidentiality) {

      return;

    }


    console.log(
      'HO Assignment Visibility:',
      confidentiality
    );


    /*
     * Open the existing employee selection
     * modal used by Circular Creator.
     */

    this.openEmployeeModal();

  }


  /* =========================================================
     OPEN EMPLOYEE MODAL
     
     Uses the existing:
     
     SelectEmployeeModal
     
     No changes are required in
     select-employee-modal.ts.
  ========================================================= */

  private openEmployeeModal(): void {

    const confidentiality =
      this.hoAssignmentForm
        .get('confidentiality')
        ?.value;

    if (!confidentiality) {

      return;

    }


    const dialogRef =
      this.dialog.open(
        SelectEmployeeModal,
        {
          width: '800px',

          panelClass:
            'custom-dialog-container',

          data: {

            preSelectedEmployees:
              [
                ...this.selectedEmployees
              ],

            confidentiality:
              confidentiality

          }

        }
      );


    dialogRef
      .afterClosed()
      .subscribe(
        (result) => {

          /*
           * User closed the modal
           * without confirming.
           */

          if (
            result === null ||
            result === undefined
          ) {

            return;

          }


          /*
           * SelectEmployeeModal can return:
           *
           * 1. Employee[]
           *
           * OR
           *
           * 2. {
           *      employees: Employee[],
           *      hierarchy: {...}
           *    }
           */

          const employees =
            Array.isArray(result)
              ? result
              : result?.employees || [];


          /*
           * Employees selected
           */

          if (
            employees.length > 0
          ) {

            this.selectedEmployees =
              [
                ...employees
              ];


            console.log(
              'Selected HO Assignment employees:',
              this.selectedEmployees
            );

          } else {

            this.selectedEmployees =
              [];

          }

        }
      );

  }


  /* =========================================================
     EMPLOYEE COUNT
  ========================================================= */

  getSelectedEmployeeCount(): number {

    return this.selectedEmployees.length;

  }
toggleSelectedEmployeesList(): void {

  this.showSelectedEmployeesList =
    !this.showSelectedEmployeesList;

}

  /* =========================================================
     REMOVE EMPLOYEE
  ========================================================= */

  removeEmployee(
    index: number
  ): void {

    if (
      index >= 0 &&
      index <
      this.selectedEmployees.length
    ) {

      this.selectedEmployees.splice(
        index,
        1
      );

    }

  }


  /* =========================================================
     RICH TEXT EDITOR
  ========================================================= */

  executeCommand(
    command: string
  ): void {

    document.execCommand(
      command,
      false
    );

  }


  /* =========================================================
     EDITOR CONTENT CHANGE
  ========================================================= */

  onContentChange(
    event: Event
  ): void {

    const editor =
      event.target as HTMLElement;

    const content =
      editor.innerHTML.trim();

    this.hoAssignmentForm
      .get('content')
      ?.setValue(content);

  }


  /* =========================================================
     SAVE DRAFT
  ========================================================= */

  saveDraft(): void {

    if (
      !this.hoAssignmentForm
    ) {

      return;

    }


    const draft = {

      form:
        this.hoAssignmentForm.value,

      selectedEmployees:
        this.selectedEmployees,

      selectedConfidentialityLevels:
        this.selectedConfidentialityLevels,

      savedAt:
        new Date().toISOString()

    };


    localStorage.setItem(
      this.draftStorageKey,
      JSON.stringify(draft)
    );


    alert(
      'HO Assignment draft saved successfully.'
    );

  }


  /* =========================================================
     LOAD DRAFT
  ========================================================= */

  private loadDraft(): void {

    const savedDraft =
      localStorage.getItem(
        this.draftStorageKey
      );


    if (!savedDraft) {

      return;

    }


    try {

      const draft =
        JSON.parse(
          savedDraft
        );


      if (draft.form) {

        this.hoAssignmentForm.patchValue(
          draft.form
        );

      }


      if (
        Array.isArray(
          draft.selectedEmployees
        )
      ) {

        this.selectedEmployees =
          draft.selectedEmployees;

      }


      if (
        Array.isArray(
          draft.selectedConfidentialityLevels
        )
      ) {

        this.selectedConfidentialityLevels =
          draft.selectedConfidentialityLevels;

      }

    } catch (error) {

      console.error(
        'Unable to load HO Assignment draft:',
        error
      );

    }

  }


  /* =========================================================
     DISCARD DRAFT
  ========================================================= */

  discardDraft(): void {

    const confirmed =
      window.confirm(
        'Are you sure you want to discard this HO Assignment draft?'
      );


    if (!confirmed) {

      return;

    }


    localStorage.removeItem(
      this.draftStorageKey
    );


    this.hoAssignmentForm.reset({

      title: '',

      assignment_code: '',

      specialKeyword: '',

      previous_assignment_id: '',

      source_type_id: '',

      originator: '',

      /*
       * Visibility should again start
       * empty after discard.
       */

      confidentiality:
        '',

      effective_from:
        this.getTodayDate(),

      repeat_cycle: '',

      priority:
        'MEDIUM',

      content: ''

    });


    this.selectedEmployees =
      [];


    this.selectedConfidentialityLevels =
      [];


    this.showEmployeeVisibility =
      false;


    this.selectedFile =
      null;


    alert(
      'HO Assignment draft discarded.'
    );

  }


  /* =========================================================
     DECRYPT EMPLOYEE DATA
     
     Same logic used by your existing
     CircularCreater.
  ========================================================= */

  private decryptData(
    encryptedData: string
  ): string {

    try {

      return decodeURIComponent(
        atob(encryptedData)
      );

    } catch (error) {

      console.error(
        'Error decrypting employee data:',
        error
      );

      return '';

    }

  }


  /* =========================================================
     GET CURRENT EMPLOYEE ID
     
     Reads employee information from:
     
     localStorage
          ↓
     emp_user
          ↓
     decrypt
          ↓
     JSON.parse
          ↓
     employee.id
  ========================================================= */

  private getCurrentEmployeeId():
    number | null {

    if (
      typeof window ===
      'undefined'
    ) {

      return null;

    }


    const encryptedUser =
      localStorage.getItem(
        'emp_user'
      );


    if (!encryptedUser) {

      console.error(
        'Logged-in employee data not found.'
      );

      return null;

    }


    try {

      const decryptedUser =
        this.decryptData(
          encryptedUser
        );


      if (!decryptedUser) {

        return null;

      }


      const employee =
        JSON.parse(
          decryptedUser
        );


      console.log(
        'Logged in employee for HO Assignment:',
        employee
      );


      if (
        employee?.id ===
        undefined ||
        employee?.id ===
        null
      ) {

        console.error(
          'Employee ID not found in emp_user.'
        );

        return null;

      }


      return Number(
        employee.id
      );

    } catch (error) {

      console.error(
        'Unable to read logged-in employee:',
        error
      );

      return null;

    }

  }


  /* =========================================================
     CREATE ASSIGNMENT
     
     1. Validate form
     2. Get logged-in employee ID
     3. Get selected employee IDs
     4. Send assignment to backend
     5. Backend creates HO Assignment
     6. Backend creates tracking rows
        for selected employees
     7. Show success
     8. Navigate to All HO Assignments
  ========================================================= */

  createAssignment(): void {

    /* -------------------------------------------------------
       Prevent duplicate submission
    ------------------------------------------------------- */

    if (
      this.isProcessing
    ) {

      return;

    }


    /* -------------------------------------------------------
       Validate form
    ------------------------------------------------------- */

    if (
      this.hoAssignmentForm.invalid
    ) {

      this.markFormTouched();

      alert(
        'Please fill all required fields.'
      );

      return;

    }


    /* -------------------------------------------------------
       Get logged-in employee ID
    ------------------------------------------------------- */

    const createdBy =
      this.getCurrentEmployeeId();


    if (!createdBy) {

      alert(
        'Unable to identify the logged-in employee.'
      );

      return;

    }


    /* -------------------------------------------------------
       Get form data
    ------------------------------------------------------- */

    const formData =
      this.hoAssignmentForm.value;


    /* -------------------------------------------------------
       Prepare API payload
       
       Backend expects:
       
       title
       assignment_code
       description
       priority
       due_date
       created_by
       employeeIds
    ------------------------------------------------------- */

    const assignmentData = {

      title:
        formData.title?.trim(),

      assignment_code:
        formData.assignment_code?.trim(),

      description:
        formData.content ||
        null,

      priority:
        formData.priority ||
        'MEDIUM',

      due_date:
        formData.effective_from ||
        null,

      created_by:
        createdBy,

      // employeeIds:
      //   this.selectedEmployees.map(
      //     employee =>
      //       Number(employee.id)
      //   ) 
employeeIds:
  this.selectedEmployees
    .filter(
      employee =>
        Number(employee.id) !==
        Number(createdBy)
    )
    .map(
      employee =>
        Number(employee.id)
    )




    };


    console.log(
      'HO Assignment API payload:',
      assignmentData
    );


    /* -------------------------------------------------------
       Start processing
    ------------------------------------------------------- */

    this.isProcessing =
      true;


    /* -------------------------------------------------------
       Call backend
    ------------------------------------------------------- */

    this.hoAssignmentService
      .createHOAssignment(
        assignmentData
      )
      .subscribe({

        /* ===================================================
           SUCCESS
        =================================================== */

        next: (response) => {

          console.log(
            'HO Assignment created successfully:',
            response
          );


          this.isProcessing =
            false;


          /* -------------------------------------------------
             Remove saved draft
          ------------------------------------------------- */

          localStorage.removeItem(
            this.draftStorageKey
          );


          /* -------------------------------------------------
             Show success message
             
             Backend returns:
             
             assigned
          ------------------------------------------------- */

          alert(
            `HO Assignment created successfully.\n\n` +
            `Assignment Code: ${
              response.assignment_code || 'N/A'
            }\n` +
            `Assigned to ${
              response.assigned || 0
            } employees.`
          );


          /* -------------------------------------------------
             Navigate to All HO Assignments
          ------------------------------------------------- */

          this.router.navigate([
            '/employee/all-ho-assignments'
          ]);

        },


        /* ===================================================
           ERROR
        =================================================== */

        error: (error) => {

          console.error(
            'Error creating HO Assignment:',
            error
          );


          this.isProcessing =
            false;


          const message =
            error?.error?.message ||
            'Failed to create HO Assignment. Please try again.';


          alert(
            message
          );

        }

      });

  }


  /* =========================================================
     MARK FORM AS TOUCHED
  ========================================================= */

  private markFormTouched(): void {

    Object.keys(
      this.hoAssignmentForm.controls
    ).forEach(
      controlName => {

        const control =
          this.hoAssignmentForm.get(
            controlName
          );

        control?.markAsTouched();

      }
    );

  }


  /* =========================================================
     FORM ERROR HELPER
  ========================================================= */

  hasError(
    controlName: string,
    errorName: string
  ): boolean {

    const control =
      this.hoAssignmentForm.get(
        controlName
      );


    return !!(
      control &&
      control.touched &&
      control.hasError(
        errorName
      )
    );

  }


  /* =========================================================
     GET CONTROL
  ========================================================= */

  getControl(
    controlName: string
  ): AbstractControl | null {

    return this.hoAssignmentForm.get(
      controlName
    );

  }

}