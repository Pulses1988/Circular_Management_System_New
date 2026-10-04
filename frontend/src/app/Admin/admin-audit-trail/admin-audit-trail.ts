import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/user';

@Component({
  selector: 'app-admin-audit-trail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-audit-trail.html',
  styleUrl: './admin-audit-trail.scss',
})
export class AdminAuditTrail implements OnInit {
  auditLogs: any[] = [];
  displayAuditLogs: any[] = [];
  //Adding pagination
  // Pagination
  allDisplayAuditLogs: any[] = [];

  currentPage: number = 1;

  itemsPerPage: number = 10;

  totalPages: number = 0;

  loading = false;

  errorMessage = '';

  // Search and filters
  searchTerm: string = '';
  selectedAction: string = '';
  selectedStatus: string = '';

  //Add these variables
  // 1. Declare these properties at the top of your class
  isModalOpen: boolean = false;
  selectedLog: any = null;
  trackingLoading = false;
  trackingError = '';
  trackingSummary: any = null;

  regionWiseHierarchy: any = null;

  closeViewModal(): void {
    this.isModalOpen = false;
    this.selectedLog = null;
    this.trackingSummary = null;
    this.trackingError = '';
    this.regionWiseHierarchy = null;
  }

  //Adding methods for heirachy
  parseRegionWiseHierarchy(log: any): void {
    this.regionWiseHierarchy = null;

    // Only process REGION_WISE audit logs
    if (log.visibility_type !== 'REGION_WISE' || !log.description) {
      return;
    }

    const hierarchyText = 'REGION_WISE_HIERARCHY:';

    const hierarchyIndex = log.description.indexOf(hierarchyText);

    // Hierarchy information not found
    if (hierarchyIndex === -1) {
      return;
    }

    try {
      const jsonText = log.description.substring(hierarchyIndex + hierarchyText.length).trim();

      this.regionWiseHierarchy = JSON.parse(jsonText);

      console.log('Parsed REGION_WISE Hierarchy:', this.regionWiseHierarchy);
    } catch (error) {
      console.error('Failed to parse REGION_WISE hierarchy:', error);

      this.regionWiseHierarchy = null;
    }
  }

  //to get clean description

  // Get clean description without rejection reason
  getCleanDescription(description: any): string {
    if (!description) {
      return '—';
    }

    let cleanDescription = description;

    // Remove REGION_WISE hierarchy
    const hierarchyIndex = cleanDescription.indexOf('REGION_WISE_HIERARCHY:');

    if (hierarchyIndex !== -1) {
      cleanDescription = cleanDescription.substring(0, hierarchyIndex).trim();
    }

    // Remove rejection reason from description
    cleanDescription = cleanDescription.replace(/\s*Reason\s*:[\s\S]*$/i, '').trim();

    return cleanDescription || '—';
  }

  // Get rejection reason from description
  getRejectionReason(description: any): string {
    if (!description) {
      return '';
    }

    // Remove REGION_WISE hierarchy first
    const hierarchyIndex = description.indexOf('REGION_WISE_HIERARCHY:');

    let cleanDescription = description;

    if (hierarchyIndex !== -1) {
      cleanDescription = description.substring(0, hierarchyIndex).trim();
    }

    // Extract reason after "Reason:"
    const reasonMatch = cleanDescription.match(/Reason\s*:\s*([\s\S]*)$/i);

    return reasonMatch ? reasonMatch[1].trim() : '';
  }

  constructor(private userService: User) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getAuditLogs().subscribe({
      next: (response: any) => {
        console.log('Audit API Response:', response);

        this.auditLogs = response.data || [];

        this.prepareDisplayLogs();

        this.loading = false;
      },

      error: (error: any) => {
        console.error('Failed to load audit logs:', error);

        this.errorMessage = 'Failed to load audit logs.';

        this.loading = false;
      },
    });
  }

  // Add these methods inside your AdminAuditTrailComponent class

  // openViewModal(log: any): void {
  //   console.log('Viewing audit log details:', log);
  //   // Add your modal display logic here
  // }

  openViewModal(log: any): void {
    console.log('Viewing audit log details:', log);

    this.selectedLog = log;
    this.isModalOpen = true;

    this.trackingSummary = null;
    this.trackingError = '';

    // Parse REGION_WISE hierarchy
    this.parseRegionWiseHierarchy(log);
    // Load tracking summary only for employee actions
    if (log.action === 'EMPLOYEE_READ_CIRCULAR' || log.action === 'EMPLOYEE_COMPLETED_CIRCULAR') {
      this.loadTrackingSummary(log.circular_id);
    }
  }

  //Loadtracking Summary
  loadTrackingSummary(circularId: number | string): void {
    this.trackingLoading = true;
    this.trackingError = '';

    this.userService.getCompletionStatusEmployees(circularId).subscribe({
      next: (response: any) => {
        console.log('Tracking Summary Response:', response);

        this.trackingSummary = response;

        this.trackingLoading = false;
      },

      error: (error: any) => {
        console.error('Failed to load tracking summary:', error);

        this.trackingError = 'Failed to load employee tracking details.';

        this.trackingLoading = false;
      },
    });
  }

  deleteAuditLog(id: number | string): void {
    if (!confirm('Are you sure you want to delete this audit log?')) {
      return;
    }

    console.log('Deleting audit log with ID:', id);

    this.userService.deleteAuditLog(id).subscribe({
      next: (response: any) => {
        console.log('Delete audit response:', response);

        // Remove deleted record from the table
        // this.auditLogs = this.auditLogs.filter(
        //   log => log.id !== id
        // );
        this.auditLogs = this.auditLogs.filter((log) => log.id !== id);

        // Refresh displayed logs
        this.prepareDisplayLogs();
        alert('Audit log deleted successfully.');
      },

      error: (error: any) => {
        console.error('Failed to delete audit log:', error);

        alert('Failed to delete audit log.');
      },
    });
  }

  prepareDisplayLogs(): void {
    const employeeReadLogs = this.auditLogs.filter(
      (log) => log.action === 'EMPLOYEE_READ_CIRCULAR',
    );

    const employeeCompletedLogs = this.auditLogs.filter(
      (log) => log.action === 'EMPLOYEE_COMPLETED_CIRCULAR',
    );

    // Keep all non-employee activity logs unchanged
    const otherLogs = this.auditLogs.filter(
      (log) =>
        log.action !== 'EMPLOYEE_READ_CIRCULAR' && log.action !== 'EMPLOYEE_COMPLETED_CIRCULAR',
    );

    // Group employee read logs by circular ID
    const readGroups = new Map<number, any[]>();

    employeeReadLogs.forEach((log) => {
      const circularId = Number(log.circular_id);

      if (!readGroups.has(circularId)) {
        readGroups.set(circularId, []);
      }

      readGroups.get(circularId)!.push(log);
    });

    // Group employee completion logs by circular ID
    const completedGroups = new Map<number, any[]>();

    employeeCompletedLogs.forEach((log) => {
      const circularId = Number(log.circular_id);

      if (!completedGroups.has(circularId)) {
        completedGroups.set(circularId, []);
      }

      completedGroups.get(circularId)!.push(log);
    });

    const summaryLogs: any[] = [];

    // Display only the first employee-read log per circular
    readGroups.forEach((logs, circularId) => {
      const sortedLogs = [...logs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      const readCount = sortedLogs.length;

      const firstReadLog = {
        ...sortedLogs[0],
        isSummaryLog: true,
        summaryType: 'FIRST_READ',
        description: `${readCount} employee${readCount > 1 ? 's' : ''} read circular ${circularId}`,
        relatedLogs: sortedLogs,
      };

      summaryLogs.push(firstReadLog);
    });

    // Display only the last employee-completed log per circular
    completedGroups.forEach((logs, circularId) => {
      const sortedLogs = [...logs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      const completedCount = sortedLogs.length;

      const lastCompletedLog = {
        ...sortedLogs[0],
        isSummaryLog: true,
        summaryType: 'LAST_COMPLETED',
        description: `${completedCount} employee${completedCount > 1 ? 's' : ''} completed circular ${circularId}`,
        relatedLogs: sortedLogs,
      };

      summaryLogs.push(lastCompletedLog);
    });

    // Final display list
    //   this.displayAuditLogs = [
    //     ...otherLogs,
    //     ...summaryLogs
    //   ].sort(
    //     (a, b) =>
    //       new Date(b.created_at).getTime() -
    //       new Date(a.created_at).getTime()
    //   );
    // }

    // Final display list
    this.allDisplayAuditLogs = [...otherLogs, ...summaryLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    // Reset pagination
    this.currentPage = 1;

    // Apply pagination
    // this.applyPagination();
    this.applyFilters();
  }
  // Final display list
  // ============================================
  // Pagination
  // ============================================

  applyPagination(): void {
    this.totalPages = Math.ceil(this.allDisplayAuditLogs.length / this.itemsPerPage);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;

    const endIndex = startIndex + this.itemsPerPage;

    this.displayAuditLogs = this.allDisplayAuditLogs.slice(startIndex, endIndex);
  }
  // Go to next page
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;

      this.applyPagination();
    }
  }
  // Go to previous page
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;

      this.applyPagination();
    }
  }

  changeItemsPerPage(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;

    this.itemsPerPage = Number(selectElement.value);

    this.currentPage = 1;

    this.applyPagination();
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    const filteredLogs = this.allDisplayAuditLogs.filter((log) => {
      // Search across multiple fields
      const searchableText = [
        log.id,
        log.circular_id,
        log.action,
        log.performed_by,
        log.performed_by_name,
        log.performed_by_code,
        log.target_employee_id,
        log.target_employee_code,
        log.old_status,
        log.new_status,
        log.description,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      // Action filter
      const matchesAction = !this.selectedAction || log.action === this.selectedAction;

      // Status filter
      const matchesStatus =
        !this.selectedStatus ||
        log.old_status === this.selectedStatus ||
        log.new_status === this.selectedStatus;

      return matchesSearch && matchesAction && matchesStatus;
    });

    this.totalPages = Math.ceil(filteredLogs.length / this.itemsPerPage);

    // Prevent invalid page number
    if (this.totalPages > 0 && this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.totalPages === 0) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;

    const endIndex = startIndex + this.itemsPerPage;

    this.displayAuditLogs = filteredLogs.slice(startIndex, endIndex);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedAction = '';
    this.selectedStatus = '';

    this.currentPage = 1;

    this.applyFilters();
  }
}
