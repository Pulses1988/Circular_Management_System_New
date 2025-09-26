import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeeService } from '../../services/employee-service';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

interface Circular {
  id: number;
  title: string;
  reference_code: string;
}

interface SourceType {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Reviewer {
  id: number;
  name: string;
  department: string;
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

@Component({
  selector: 'app-create-circular',
  imports: [MatIcon,FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './create-circular.html',
  styleUrl: './create-circular.scss'
})
export class CreateCircular {
private destroy$ = new Subject<void>();
  
  circularForm!: FormGroup;
  isDarkMode = false;
  isProcessing = false;
  lastSaved: Date | null = null;
  assistantExpanded = false;
  
  attachedFiles: AttachedFile[] = [];
  selectedReviewers: number[] = [];
  
  // Data arrays
  previousCirculars: Circular[] = [];
  sourceTypes: SourceType[] = [];
  departments: Department[] = [];
  availableReviewers: Reviewer[] = [];
  
  confidentialityLevels = [
    { value: 'public', label: 'Public', description: 'Available to all employees' },
    { value: 'internal', label: 'Internal', description: 'Restricted to internal staff' },
    { value: 'confidential', label: 'Confidential', description: 'Limited access only' },
    { value: 'restricted', label: 'Restricted', description: 'Highly sensitive information' }
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.initializeForm();
    this.detectSystemTheme();
  }

  ngOnInit(): void {
    this.loadData();
    this.generateReferenceCode();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.circularForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      reference_code: ['', Validators.required],
      previous_circular_id: [''],
      source_type_id: ['', Validators.required],
      originator_department_id: ['', Validators.required],
      originator: ['', Validators.required],
      confidentiality: ['internal', Validators.required],
      effective_from: ['', Validators.required],
      content: ['', [Validators.required, Validators.minLength(10)]]
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
      .pipe(
        debounceTime(3000),
        takeUntil(this.destroy$)
      )
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
    this.loadPreviousCirculars();
    this.loadSourceTypes();
    this.loadDepartments();
    this.loadReviewers();
  }

  private loadPreviousCirculars(): void {
    // Mock data - replace with actual service call
    this.previousCirculars = [
      { id: 1, title: 'Holiday Notice 2024', reference_code: 'CIR/2024/001' },
      { id: 2, title: 'Policy Update', reference_code: 'CIR/2024/002' },
      { id: 3, title: 'New Procedures', reference_code: 'CIR/2024/003' }
    ];
  }

  private loadSourceTypes(): void {
    this.sourceTypes = [
      { id: 1, name: 'Head Office' },
      { id: 2, name: 'Branch Office' },
      { id: 3, name: 'Department' },
      { id: 4, name: 'External' }
    ];
  }

  private loadDepartments(): void {
    this.departments = [
      { id: 1, name: 'Human Resources' },
      { id: 2, name: 'Information Technology' },
      { id: 3, name: 'Finance' },
      { id: 4, name: 'Operations' },
      { id: 5, name: 'Marketing' }
    ];
  }

  private loadReviewers(): void {
    this.availableReviewers = [
      { id: 1, name: 'John Smith', department: 'Human Resources' },
      { id: 2, name: 'Sarah Johnson', department: 'Finance' },
      { id: 3, name: 'Mike Davis', department: 'Operations' },
      { id: 4, name: 'Emily Brown', department: 'IT' },
      { id: 5, name: 'David Wilson', department: 'Marketing' }
    ];
  }

  // Reference code generation
  generateReferenceCode(): void {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const code = `CIR/${year}/${month}/${random}`;
    
    this.circularForm.patchValue({ reference_code: code });
  }

  // File management
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open(`File ${file.name} is too large (max 10MB)`, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
      
      const attachedFile: AttachedFile = {
        id: this.generateId(),
        name: file.name,
        size: file.size,
        file: file
      };
      
      this.attachedFiles.push(attachedFile);
    });
    
    input.value = '';
  }

  removeFile(fileId: string): void {
    this.attachedFiles = this.attachedFiles.filter(f => f.id !== fileId);
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
  toggleReviewer(reviewerId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    
    if (checked) {
      if (!this.selectedReviewers.includes(reviewerId)) {
        this.selectedReviewers.push(reviewerId);
      }
    } else {
      this.selectedReviewers = this.selectedReviewers.filter(id => id !== reviewerId);
    }
  }

  removeReviewer(reviewerId: number): void {
    this.selectedReviewers = this.selectedReviewers.filter(id => id !== reviewerId);
  }

  getReviewerName(reviewerId: number): string {
    const reviewer = this.availableReviewers.find(r => r.id === reviewerId);
    return reviewer ? reviewer.name : '';
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

  saveDraft(): void {
    if (this.circularForm.value.title || this.circularForm.value.content) {
      this.lastSaved = new Date();
      this.snackBar.open('Draft saved successfully', 'Close', {
        duration: 2000,
        panelClass: ['success-snackbar']
      });
    }
  }

  previewCircular(): void {
    this.snackBar.open('Preview feature coming soon', 'Close', { duration: 2000 });
  }

  discardDraft(): void {
    if (confirm('Are you sure you want to discard this draft? All changes will be lost.')) {
      this.circularForm.reset();
      this.attachedFiles = [];
      this.selectedReviewers = [];
      this.router.navigate(['/employee-dashboard']);
    }
  }

  submitCircular(): void {
    if (this.circularForm.valid && this.selectedReviewers.length > 0) {
      this.isProcessing = true;
      
      // Simulate submission
      setTimeout(() => {
        this.isProcessing = false;
        this.snackBar.open('Circular submitted successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        setTimeout(() => {
          this.router.navigate(['/employee-dashboard']);
        }, 1500);
      }, 2000);
    } else {
      this.snackBar.open('Please fill all required fields and select reviewers', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
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
