import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
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

export interface Circular {
  id: number;
  title: string;
  content: string | null;
  circular_code: string;
  circular_pdf: Buffer | null; // PDF as blob/buffer
  creator_employee_id: number;
  creator_name: string;
  reference_circular_id: number | null;
  source_type_id: number;
  source_type: string;
  effective_from: string; // ISO date string
  created_at: string; // ISO date string
  published_at: string | null; // ISO date string or null
  send_type: 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'PUBLIC';
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  repeat_cycle: 'ONE_TIME' | 'WEEKLY' | 'QUARTERLY' | 'ANNUALLY';
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
  can_create_circular: 0 | 1; // MySQL tinyint returns as number
  can_approve_circular: 0 | 1;
  created_at: string; // ISO timestamp
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

  // Data arrays
  previousCirculars: Circular[] = [];
  sourceTypes: SourceType[] = [];
  departments: Department[] = [];
  availableApprovers: Approver[] = [];

  confidentialityLevels = [
    { value: 'PUBLIC', label: 'Public', description: 'Available to all employees' },
    { value: 'INTERNAL', label: 'Internal', description: 'Restricted to internal staff' },
    { value: 'CONFIDENTIAL', label: 'Confidential', description: 'Limited access only' },
    { value: 'RESTRICTED', label: 'Restricted', description: 'Highly sensitive information' },
  ];

  repeatCycles = [
    { value: 'ONE_TIME', label: 'One Time' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'ANNUALLY', label: 'Annually' },
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private circularService: CircularService,
    private employeeService: EmployeeService
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
    const encryptedUser = localStorage.getItem('emp_user');
    if (encryptedUser) {
      const decryptedUser = this.decryptData(encryptedUser);
      this.employee = JSON.parse(decryptedUser);
      console.log('Logged in employee:', this.employee);

      const fullName = `${this.employee.first_name} ${this.employee.last_name}`.trim();

      this.circularForm.patchValue({
        originator: fullName, // visible
        originator_id: this.employee.id, // hidden
      });
    }

    this.loadData();
    // this.generateReferenceCode();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.circularForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      circular_code: ['', Validators.required],
      previous_circular_id: [''],
      source_type_id: ['', Validators.required],
      originator: ['', Validators.required],
      originator_id: [''],
      confidentiality: ['INTERNAL', Validators.required],
      effective_from: ['', Validators.required],
      repeat_cycle: ['', Validators.required],
      content: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  private detectSystemTheme(): void {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.isDarkMode = mediaQuery.matches;

      // Listen for system theme changes
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
    this.router.navigate(['/employee-dashboard']);
  }

  // Data loading
  private loadData(): void {
    // get source type
    this.circularService.getSourceTypes().subscribe((data) => {
      console.log(data);
      this.sourceTypes = data as SourceType[];
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

    // this.loadSourceTypes();
    this.loadDepartments();
  }

  private loadDepartments(): void {
    this.departments = [
      { id: 1, name: 'Human Resources' },
      { id: 2, name: 'Information Technology' },
      { id: 3, name: 'Finance' },
      { id: 4, name: 'Operations' },
      { id: 5, name: 'Marketing' },
    ];
  }

  // Reference code generation
  // generateReferenceCode(): void {
  //   const year = new Date().getFullYear();
  //   const month = String(new Date().getMonth() + 1).padStart(2, '0');
  //   const random = Math.floor(Math.random() * 1000)
  //     .toString()
  //     .padStart(3, '0');
  //   const code = `CIR/${year}/${month}/${random}`;

  //   this.circularForm.patchValue({ reference_code: code });
  // }

  // File management
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null; // Get only the first file

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open(`File ${file.name} is too large (max 10MB)`, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        input.value = ''; // Clear the input so the same file can be selected again
        return;
      }

      this.attachedFile = {
        id: this.generateId(), // Still useful for tracking if needed
        name: file.name,
        size: file.size,
        file: file,
      };
    } else {
      this.attachedFile = null; // Clear if no file is selected
    }

    input.value = ''; // Clear the input value to allow re-selection of the same file
  }

  removeFile(): void {
    // Simply set the attachedFile to null to remove it
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

  onContentChange(event: Event): void {
    const content = (event.target as HTMLElement).innerHTML;
    this.circularForm.patchValue({ content }, { emitEvent: false });
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
    // Implement actual auto-save logic here
  }

  // saveDraft(): void {
  //   if (this.circularForm.value.title || this.circularForm.value.content) {
  //     this.lastSaved = new Date();
  //     this.snackBar.open('Draft saved successfully', 'Close', {
  //       duration: 2000,
  //       panelClass: ['success-snackbar'],
  //     });
  //   }
  // }

  previewCircular(): void {
    this.snackBar.open('Preview feature coming soon', 'Close', { duration: 2000 });
  }

  discardDraft(): void {
    if (confirm('Are you sure you want to discard this draft? All changes will be lost.')) {
      this.circularForm.reset();
      // this.attachedFiles = [];
      this.selectedApprovers = [];
      this.router.navigate(['/employee-dashboard']);
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

    // Your existing formData code here...
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

    if (this.attachedFile) {
      formData.append('pdfFile', this.attachedFile.file, this.attachedFile.name);
    }

    if (status === 'PENDING_APPROVAL') {
      formData.append('approvers', JSON.stringify(this.selectedApprovers));
    }

    this.circularService.uploadCircular(formData).subscribe({
      next: (res) => {
        this.isProcessing = false;
        const message = status === 'DRAFT' ? 'Draft saved!' : 'Submitted for approval!';
        this.snackBar.open(message, 'Close', { duration: 3000 });

        if (status === 'PENDING_APPROVAL') {
          setTimeout(() => {
            this.router.navigate(['/employee-dashboard']);
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
