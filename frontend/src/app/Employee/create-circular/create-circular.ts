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
  lastSaved: Date | null = null;
  assistantExpanded = false;
  employee: any;

  attachedFile: AttachedFile | null = null;
  selectedApprovers: number[] = [];
  selectedEmployees: any[] = [];

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
    { value: 'PUBLIC', label: 'Public', description: 'Available to all employees' },
    { value: 'INTERNAL', label: 'Internal', description: 'Restricted to internal staff' },
    { value: 'CONFIDENTIAL', label: 'Confidential', description: 'Limited access only' },
    { value: 'RESTRICTED', label: 'Restricted', description: 'Highly sensitive information' },
    {
      value: 'CUSTOM',
      label: 'Custom',
      description: 'Visible only to selected employees or groups',
    },
  ];

  filteredConfidentialityLevels: { value: string; label: string; description: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private circularService: CircularService,
    private employeeService: EmployeeService,
    private dialog: MatDialog
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
    this.setupAutoSave();

    // Confidentiality change handler
    this.circularForm.get('confidentiality')?.valueChanges.subscribe((value) => {
      this.handleConfidentialityChange(value);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  private handleConfidentialityChange(value: string): void {
    // Skip if modal is already opening
    if (this.isModalOpening) {
      this.isModalOpening = false;
      return;
    }

    // Check if this is a modal-required confidentiality level
    if (value === 'CONFIDENTIAL' || value === 'RESTRICTED' || value === 'CUSTOM') {
      this.pendingConfidentialityChange = value;

      setTimeout(() => {
        this.openEmployeeModal();
      });
    } else {
      // For non-modal levels, clear selected employees
      this.selectedEmployees = [];
      this.pendingConfidentialityChange = null;
    }
  }

  // Open employee modal with proper state management
  openEmployeeModal(): void {
    // Prevent multiple modals from opening
    if (this.isModalOpening) {
      return;
    }

    this.isModalOpening = true;

    const dialogRef = this.dialog.open(SelectEmployeeModal, {
      width: '800px',
      panelClass: 'custom-dialog-container',
      data: {
        preSelectedEmployees: [...this.selectedEmployees],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.isModalOpening = false;
      if (result === null) {
        return;
      } else if (result && Array.isArray(result)) {
        if (result.length > 0) {
          // User confirmed selection
          this.selectedEmployees = result;
          console.log('Selected employees:', this.selectedEmployees);

          // Ensure the confidentiality level stays as selected
          if (this.pendingConfidentialityChange) {
            this.circularForm.patchValue(
              {
                confidentiality: this.pendingConfidentialityChange,
              },
              { emitEvent: false }
            );
            this.pendingConfidentialityChange = null;
          }
        } else {
          // User cancelled with empty array - remove employees and reset confidentiality
          this.handleModalCancellation();
        }
      } else {
        // User cancelled (undefined result) - remove employees and reset confidentiality
        this.handleModalCancellation();
      }
    });
  }

  // Handle modal cancellation
  private handleModalCancellation(): void {
    // Clear selected employees
    this.selectedEmployees = [];

    // Revert to default confidentiality level
    const defaultLevel = 'INTERNAL';
    this.circularForm.patchValue(
      {
        confidentiality: defaultLevel,
      },
      { emitEvent: false }
    );

    this.pendingConfidentialityChange = null;
    console.log('Modal cancelled - reverted to default confidentiality');
  }

  // Method to manually open modal for existing selection
  editSelectedEmployees(): void {
    this.openEmployeeModal();
  }

  private filterConfidentialityOptions(): void {
    if (this.employee!.branch_id) {
      this.filteredConfidentialityLevels = this.confidentialityLevels.filter(
        (level) => level.value === 'INTERNAL'
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
  private confidentialityValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    const requiresEmployees = ['CONFIDENTIAL', 'RESTRICTED', 'CUSTOM'];

    if (requiresEmployees.includes(value) && this.selectedEmployees.length === 0) {
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
      selectedDate.getDate()
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
      effective_from: ['', [Validators.required, this.todayOrFutureDateValidator.bind(this)]],
      repeat_cycle: ['', Validators.required],
      content: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['MEDIUM', Validators.required],
      specialKeyword: [''],
    });
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().slice(0, 16);
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
        if (this.circularForm.valid) {
          this.autoSave();
        }
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
    this.router.navigate(['/employee/employee-dashboard']);
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
    this.circularService.getAllCircular().subscribe((data) => {
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

  // Rich text editor
  formatText(command: string): void {
    document.execCommand(command, false);
  }

  onContentChange(event: Event) {
    const content = (event.target as HTMLElement).innerHTML;
    this.circularForm.get('content')?.setValue(content, { emitEvent: false });
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
  toggleApprover(approverId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.selectedApprovers.includes(approverId)) {
        this.selectedApprovers.push(approverId);
      }
    } else {
      this.selectedApprovers = this.selectedApprovers.filter((id) => id !== approverId);
    }
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
    this.lastSaved = new Date();
  }

  previewCircular(): void {
    this.snackBar.open('Preview feature coming soon', 'Close', { duration: 2000 });
  }

  discardDraft(): void {
    if (confirm('Are you sure you want to discard this draft? All changes will be lost.')) {
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
        return;
      }
      if (!this.attachedFile) {
        this.snackBar.open('PDF file is required', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        return;
      }
      if (this.selectedApprovers.length === 0) {
        this.snackBar.open('Please select at least one approver', 'Close', {
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
    formData.append('send_type', this.circularForm.value.confidentiality);
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

    this.circularService.uploadCircular(formData).subscribe({
      next: (res) => {
        this.isProcessing = false;
        const message = status === 'DRAFT' ? 'Draft saved!' : 'Submitted for approval!';
        this.snackBar.open(message, 'Close', { duration: 3000 });

        this.clearForm();
        this.loadEmployeeData();

        if (status === 'PENDING_APPROVAL') {
          setTimeout(() => {
            this.router.navigate(['/employee/employee-dashboard']);
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
