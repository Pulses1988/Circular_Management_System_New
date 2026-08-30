import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-export-report',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './export-report.html',
  styleUrl: './export-report.scss'
})
export class ExportReport {

  reportData = {
    reportType: 'Reading History',
    fromDate: '',
    toDate: '',
    readStatus: 'All',
    approvalStatus: 'All',
    format: 'PDF'
  };

  constructor(
    private dialogRef: MatDialogRef<ExportReport>
  ) {}

  exportReport(): void {

    console.log('Export Report Data:', this.reportData);

    this.dialogRef.close(this.reportData);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}