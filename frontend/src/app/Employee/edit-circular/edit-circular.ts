import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CircularService } from '../../services/circular-service';
import { EmployeeService } from '../../services/employee-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { SelectEmployeeModal } from '../select-employee-modal/select-employee-modal';

interface Approver {
  id: number;
  first_name: string;
  last_name: string;
}

interface Circular {
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
  send_type: 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'PUBLIC' | 'CUSTOM';
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'APPROVED' | 'PUBLISHED';
  repeat_cycle: number;
  repeat_cycle_id: number;
  priority: 'LOW' | 'URGENT' | 'HIGH' | 'MEDIUM';
  specialKeyword: string;
}

interface repeatCycle {
  id: number;
  name: string;
  duration_days: number;
  created_at: string;
}

interface SourceType {
  id: number;
  name: string;
}

@Component({
  selector: 'app-edit-circular',
  imports: [ReactiveFormsModule, CommonModule, MatIcon],
  templateUrl: './edit-circular.html',
  styleUrls: ['./edit-circular.scss'],
})
export class EditCircular implements OnInit {
  circularForm!: FormGroup;
  circularId!: number;
  attachedFile: File | null = null;
  employee: any;
  circularData: any;

  selectedApprovers: number[] = [];
  selectedEmployees: any[] = [];
  availableApprovers: Approver[] = [];
  repeatCycleData: repeatCycle[] = [];
  sourceTypes: SourceType[] = [];
  previousCirculars: Circular[] = [];
  employees: any = [];
  existingApprovers: number[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private circularService: CircularService,
    private employeeService: EmployeeService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.circularForm = this.fb.group({
      title: ['', [Validators.required]],
      circular_code: ['', [Validators.required]],
      source_type_id: ['', Validators.required],
      effective_from: ['', Validators.required],
      repeat_cycle: ['', Validators.required],
      send_type: ['', Validators.required],
      reference_circular_id: [''],
      content: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['MEDIUM'], // <-- new
      specialKeyword: [''],
    });
  }

  ngOnInit(): void {
    this.loadEmployee();
    this.circularService.getReapetCycleDataForEmployee().subscribe((data) => {
      this.repeatCycleData = data as repeatCycle[];
    });

    this.circularService.getSourceTypes().subscribe((data) => {
      this.sourceTypes = data as SourceType[];
    });

    this.circularService.getAllCircular().subscribe((data) => {
      console.log(data);
      this.previousCirculars = data as Circular[];
    });

    this.employeeService.getAllEmployees().subscribe((data) => {
      this.employees = data;
    });

    this.route.queryParams.subscribe((params) => {
      this.circularId = +params['id'];
      if (this.circularId) {
        // Load approvers first
        this.employeeService.getApprovers().subscribe((data) => {
          this.availableApprovers = data as Approver[];

          // Now load circular data
          this.loadCircularData();
        });
      }
    });
  }

  private loadEmployee(): void {
    if (typeof window !== 'undefined') {
      const encryptedUser = localStorage.getItem('emp_user');
      if (encryptedUser) {
        const decryptedUser = decodeURIComponent(atob(encryptedUser));
        this.employee = JSON.parse(decryptedUser);
      }
    }
  }

  private loadCircularData(): void {
    this.employeeService.getCircularById(this.circularId).subscribe({
      next: (data: any) => {
        this.circularData = data;
        console.log(this.circularData);
        this.circularForm.patchValue({
          title: data.title,
          circular_code: data.circular_code,
          source_type_id: data.source_type_id,
          effective_from: this.toLocalDateTime(data.effective_from),
          repeat_cycle: data.repeat_cycle_id,
          reference_circular_id: data.reference_circular_id,
          send_type: data.send_type,
          content: data.content,
          priority: data.priority,
          specialKeyword: data.special_keyword,
        });

        this.selectedApprovers = data.selectedApprovers || [];
        this.existingApprovers = [...this.selectedApprovers];
        if (data.send_type === 'CONFIDENTIAL' || data.send_type === 'RESTRICTED') {
          this.selectedEmployees = (data.selectedEmployees || [])
            .map((e: any) => this.employees.find((emp: any) => emp.id === e.id))
            .filter((emp: any) => emp);
        }
        if (data.circular_pdf?.data) {
          const blob = new Blob([new Uint8Array(data.circular_pdf.data)], {
            type: 'application/pdf',
          });
          this.attachedFile = new File([blob], `${data.title}.pdf`, { type: 'application/pdf' });
        }
      },
    });
  }

  private toLocalDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.snackBar.open('Only PDF files are allowed', 'Close', { duration: 3000 });
        return;
      }
      this.attachedFile = file;
    }
  }

  removeFile(): void {
    this.attachedFile = null;
  }

  onSendTypeChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    if (selectedValue === 'CONFIDENTIAL' || selectedValue === 'RESTRICTED') {
      this.openEmployeeModal();
    } else {
      this.selectedEmployees = [];
    }
  }

  openEmployeeModal(): void {
    const dialogRef = this.dialog.open(SelectEmployeeModal, {
      width: '800px',
      data: { preSelectedEmployees: [...this.selectedEmployees] },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && Array.isArray(result)) {
        this.selectedEmployees = result;
      }
    });
  }

  removeSelectedEmployee(empId: number): void {
    this.selectedEmployees = this.selectedEmployees.filter((e) => e.id !== empId);
  }

  toggleApprover(approverId: number): void {
    if (this.selectedApprovers.includes(approverId)) {
      // ✅ Uncheck (remove approver)
      this.selectedApprovers = this.selectedApprovers.filter((id) => id !== approverId);
    } else {
      // ✅ Check (add approver)
      this.selectedApprovers.push(approverId);
    }

    console.log('Updated selectedApprovers:', this.selectedApprovers);
  }

  onSubmit(): void {
    if (this.circularForm.invalid) {
      this.circularForm.markAllAsTouched();
      return;
    }

    const formValue = this.circularForm.value;
    const sendTypeChanged = formValue.send_type !== this.circularData.send_type;

    const updatedCircular = {
      ...this.circularData,
      ...formValue,
      repeat_cycle_id: formValue.repeat_cycle,
      status: 'PENDING_APPROVAL',
      creator_employee_id: this.employee.id,
      creator_name: `${this.employee.first_name} ${this.employee.last_name}`,
      approvers: this.selectedApprovers,
      selectedEmployees: this.selectedEmployees,
      sendTypeChanged, // 👈 important flag
      updated_at: new Date().toISOString(),
    };

    const formData = new FormData();
    formData.append('circular', JSON.stringify(updatedCircular));
    console.log(updatedCircular);

    if (this.attachedFile) {
      // Change 'circular_pdf' to 'pdfFile' to match Multer's expectation
      formData.append('pdfFile', this.attachedFile, this.attachedFile.name);
    }
    this.employeeService.updateCircular(this.circularId, formData).subscribe({
      next: () => {
        this.snackBar.open('Circular updated successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/employee/employee-dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Failed to update circular', 'Close', { duration: 3000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/employee/employee-dashboard']);
  }
}
