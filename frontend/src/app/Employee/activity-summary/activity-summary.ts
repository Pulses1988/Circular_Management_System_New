import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CircularService } from '../../services/circular-service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

interface CircularActivity {
  circular_id: number;
  circular_title: string;
  circular_code: string;
  circular_status: string;
  priority: string;
  created_at: string;
  published_at: string;
  effective_from: string;
  creator_name: string;
  creator_email: string;
  department_name: string | null;
  branch_name: string | null;
  total_employees: number;
  seen_count: number;
  completed_count: number;
  pending_count: number;
  approval_status: string;
  approvers: Approver[];
  employee_activities: EmployeeActivity[];
   completion_details: CompletionDetails | null;
}
interface CompletionDetails {
  completion_id: number;
  reference_number: string;
  submission_mode: string;
  completion_notes: string | null;
  completed_at: string;
  completed_by_name: string;
  completed_by_email: string;
}

interface Approver {
  approver_id: number;
  first_name: string;
  last_name: string;
  status: string;
  comments: string | null;
  updated_at: string;
}

interface EmployeeActivity {
  employee_id: number;
  employee_name: string;
  email: string;
  department: string | null;
  branch: string | null;
  is_seen: boolean;
  seen_at: string | null;
  is_completed: boolean;
  completed_at: string | null;
}

@Component({
  selector: 'app-activity-summary',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './activity-summary.html',
  styleUrl: './activity-summary.scss'
})
export class ActivitySummary implements OnInit {
   circularId: number = 0;
  activityData: CircularActivity | null = null;
  isLoading: boolean = false;
  isDarkMode: boolean = false;

  // Filters
  // filterStatus: 'all' | 'seen' | 'unseen' | 'completed' | 'pending' = 'all'; 
isSeenSelected = false;
isUnseenSelected = false;
isCompletedSelected = false;
isPendingSelected = false;

  searchQuery: string = '';
  filteredActivities: EmployeeActivity[] = [];

  // Stats
  seenPercentage: number = 0;
  completedPercentage: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private circularService: CircularService
  ) {
    this.detectSystemTheme();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.circularId = +params['circularId'];
      if (this.circularId) {
        this.loadActivitySummary();
      }
    });
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

  loadActivitySummary(): void {
    this.isLoading = true;
    this.circularService.getCircularActivitySummary(this.circularId).subscribe({
      next: (response: any) => {
        console.log('Activity Summary:', response);
        this.activityData = response;
        this.filteredActivities = response.employee_activities || [];
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading activity summary:', error);
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    if (!this.activityData) return;

    const total = this.activityData.total_employees;
    this.seenPercentage = total > 0 ? Math.round((this.activityData.seen_count / total) * 100) : 0;
    this.completedPercentage = total > 0 ? Math.round((this.activityData.completed_count / total) * 100) : 0;
  }

  getSubmissionModeLabel(mode: string): string {
  const modes: { [key: string]: string } = {
    'BY_HAND': 'By Hand',
    'BY_COURIER': 'By Courier',
    'BY_RPD': 'By RPD'
  };
  return modes[mode] || mode;
}

  applyFilters(): void {
    // if (!this.activityData) return;

    // let filtered = [...this.activityData.employee_activities];

    // // Apply status filter
    // switch (this.filterStatus) {
    //   case 'seen':
    //     filtered = filtered.filter(emp => emp.is_seen);
    //     break;
    //   case 'unseen':
    //     filtered = filtered.filter(emp => !emp.is_seen);
    //     break;
    //   case 'completed':
    //     filtered = filtered.filter(emp => emp.is_completed);
    //     break;
    //   case 'pending':
    //     filtered = filtered.filter(emp => !emp.is_completed);
    //     break;
    // }

    // // Apply search filter
    // if (this.searchQuery.trim()) {
    //   const query = this.searchQuery.toLowerCase();
    //   filtered = filtered.filter(emp =>
    //     emp.employee_name.toLowerCase().includes(query) ||
    //     emp.email.toLowerCase().includes(query) ||
    //     emp.department?.toLowerCase().includes(query) ||
    //     emp.branch?.toLowerCase().includes(query)
    //   );
    // }

    // this.filteredActivities = filtered;
if (!this.activityData) return;

  let filtered = [...this.activityData.employee_activities];

  // Seen
  if (this.isSeenSelected) {
    filtered = filtered.filter(emp => emp.is_seen);
  }

  // Unseen
  if (this.isUnseenSelected) {
    filtered = filtered.filter(emp => !emp.is_seen);
  }

  // Completed
  if (this.isCompletedSelected) {
    filtered = filtered.filter(emp => emp.is_completed);
  }

  // Pending
  if (this.isPendingSelected) {
    filtered = filtered.filter(emp => emp.is_seen && !emp.is_completed);
  }

  // Search
  if (this.searchQuery.trim()) {
    const query = this.searchQuery.toLowerCase();

    filtered = filtered.filter(emp =>
      emp.employee_name.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      (emp.department ?? '').toLowerCase().includes(query) ||
      (emp.branch ?? '').toLowerCase().includes(query)
    );
  }

  this.filteredActivities = filtered;







  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'APPROVED': 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
      'PENDING_APPROVAL': 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
      'REJECTED': 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
      'DRAFT': 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30'
    };
    return classes[status] || classes['DRAFT'];
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'URGENT': 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
      'HIGH': 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
      'MEDIUM': 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
      'LOW': 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
    };
    return classes[priority] || classes['MEDIUM'];
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getInitials(name: string): string {
    const names = name.split(' ');
    return names.map(n => n.charAt(0).toUpperCase()).join('');
  }

  goBack(): void {
    window.history.back();
  }

  exportToCSV(): void {
    if (!this.activityData) return;

    const headers = ['Employee Name', 'Email', 'Department', 'Branch', 'Seen', 'Seen At', 'Completed', 'Completed At'];
    const rows = this.filteredActivities.map(emp => [
      emp.employee_name,
      emp.email,
      emp.department || 'N/A',
      emp.branch || 'N/A',
      emp.is_seen ? 'Yes' : 'No',
      emp.seen_at ? this.formatDate(emp.seen_at) : 'N/A',
      emp.is_completed ? 'Yes' : 'No',
      emp.completed_at ? this.formatDate(emp.completed_at) : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `circular_${this.activityData.circular_code}_activity.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  } 



toggleSeen() {
  this.isSeenSelected = !this.isSeenSelected;
  this.applyFilters();
}

toggleUnseen() {
  this.isUnseenSelected = !this.isUnseenSelected;
  this.applyFilters();
}

toggleCompleted() {
  this.isCompletedSelected = !this.isCompletedSelected;
  this.applyFilters();
}

togglePending() {
  this.isPendingSelected = !this.isPendingSelected;
  this.applyFilters();
}

clearFilters() {
  this.isSeenSelected = false;
  this.isUnseenSelected = false;
  this.isCompletedSelected = false;
  this.isPendingSelected = false;
  this.applyFilters();
}















}
