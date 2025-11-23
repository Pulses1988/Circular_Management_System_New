import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CircularService } from '../../services/circular-service';
import { EmployeeService } from '../../services/employee-service';
import { Router } from '@angular/router';

interface Circular {
  circular_id: number;
  title: string;
  content: string;
  effective_from: string;
  published_at: string;
  circular_status: string;
  tracking_id: number;
  is_seen: boolean;
  seen_at: string | null;
  is_completed: boolean;
  completed_at: string | null;
  creator_employee_id: number;
  creator_name: string;
  department_id: number;
  department_name: string;
  branch_id: number;
  branch_name: string;
  priority: string;
  hasAttachment: boolean;
  isRead: boolean;
  circular_code: string;
  department: string;
}

interface GroupedCirculars {
  [date: string]: Circular[];
}
interface EmployeeData {
  id: number;
  first_name: string;
  last_name: string;
  role_name: string;
  department_name: string | null;
  branch_name: string | null;
  head_office_name: string | null;
  employee_id: string;
  can_approve_circular: number;
  can_create_circular: number;
}
@Component({
  selector: 'app-all-circulars',
  standalone: true,
  imports: [ CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './all-circulars.html',
  styleUrl: './all-circulars.scss'
})
export class AllCirculars implements OnInit{
availableYears: number[] = [];
  selectedYear: number = new Date().getFullYear();
  selectedMonth: string = 'all';
  
  months = [
    { value: 'all', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' }
  ];

  searchQuery: string = '';
  selectedPriority: string = 'all';
  showReadCirculars: boolean = true;
  
  totalCirculars: number = 0;
  unreadCount: number = 0;
   employeeData!: EmployeeData;
  
  allCirculars: Circular[] = [];
  filteredCirculars: Circular[] = [];
  groupedCirculars: GroupedCirculars = {};
  groupedDates: string[] = [];
  
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(private circularService: CircularService,private employeeService:EmployeeService, private router: Router) {}

  ngOnInit() {
   this.loadEmployeeData();
  }

 async loadEmployeeData() {
    this.employeeData = await this.employeeService.getCurrentEmployee();
    if (this.employeeData?.id) {
      this.loadCirculars();
    }
  }
  loadCirculars() {
    this.isLoading = true;
    this.errorMessage = '';
   if (!this.employeeData?.id) {
      console.warn('Employee ID missing, skipping circular load');
      return;
    }
    this.circularService.fetchAllCircularsWithTrackingDetailsByEmpId(this.employeeData.id)
      .subscribe({
        next: (response: any) => {
          if (response.data && Array.isArray(response.data)) {
            console.log(response.data,'data')
            this.allCirculars = this.transformCircularData(response.data);
            console.log(this.allCirculars,'circulars')
            this.generateYearsFromData();
            this.applyFilters();
            this.calculateStats();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching circulars:', error);
          this.errorMessage = 'Failed to load circulars. Please try again.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Transform API data to component format
   */
  transformCircularData(apiData: any[]): Circular[] {
    return apiData
     .filter(item => item.circular_status === 'APPROVED') 
     .map((item, index) => {
      // const priority = this.calculatePriority(item.effective_from);
      const hasAttachment = this.checkForAttachment(item.content);
      
      return {
        circular_id: item.circular_id,
        title: item.title,
        content: item.content,
        effective_from: item.effective_from,
        published_at: item.published_at,
        circular_status: item.circular_status,
        tracking_id: item.tracking_id,
        is_seen: item.is_seen,
        seen_at: item.seen_at,
        is_completed: item.is_completed,
        completed_at: item.completed_at,
        creator_employee_id: item.creator_employee_id,
        creator_name: item.creator_name,
        department_id: item.department_id,
        department_name: item.department_name,
        branch_id: item.branch_id,
        branch_name: item.branch_name,
        priority: item.priority,
        hasAttachment: hasAttachment,
        isRead: item.is_seen,
        circular_code: item.circular_code,
        department: item.department_name
      };
    });
  }

  /**
   * Calculate priority based on published date
   * Logic: 
   * - Published within 24 hours: urgent
   * - Published within 3 days: high
   * - Published within 7 days: medium
   * - Published more than 7 days ago: low
   */
  calculatePriority(publishedAt: string): 'low' | 'medium' | 'high' | 'urgent' {
    const publishedDate = new Date(publishedAt);
    const now = new Date();
    const diffHours = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;
    
    if (diffHours <= 24) {
      return 'urgent';
    } else if (diffDays <= 3) {
      return 'high';
    } else if (diffDays <= 7) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Check if circular has attachment (basic check)
   * You can enhance this based on your actual attachment logic
   */
  checkForAttachment(content: string): boolean {
    // Simple check - you can modify based on your backend attachment structure
    // For now, randomly assign or check content for attachment keywords
    return content.toLowerCase().includes('attachment') || 
           content.toLowerCase().includes('document') ||
           content.toLowerCase().includes('file');
  }

  /**
   * Generate circular code
   */
  generateCircularCode(circularId: number, publishedAt: string): string {
    const year = new Date(publishedAt).getFullYear();
    const paddedId = String(circularId).padStart(3, '0');
    return `CIR-${year}-${paddedId}`;
  }

  /**
   * Generate available years from circular data
   */
  generateYearsFromData() {
    const years = new Set<number>();
    this.allCirculars.forEach(circular => {
      const year = new Date(circular.published_at).getFullYear();
      years.add(year);
    });
    this.availableYears = Array.from(years).sort((a, b) => b - a);
    
    const currentYear = new Date().getFullYear();
    if (this.availableYears.includes(currentYear)) {
      this.selectedYear = currentYear;
    } else if (this.availableYears.length > 0) {
      this.selectedYear = this.availableYears[0];
    }
  }

  /**
   * Apply all filters
   */
  applyFilters() {
    let filtered = [...this.allCirculars];

    // Filter by year
    filtered = filtered.filter(circular => {
      const year = new Date(circular.published_at).getFullYear();
      return year === this.selectedYear;
    });

    // Filter by month
    if (this.selectedMonth !== 'all') {
      const monthIndex = parseInt(this.selectedMonth);
      filtered = filtered.filter(circular => {
        const month = new Date(circular.published_at).getMonth();
        return month === monthIndex;
      });
    }

    // Filter by priority
    if (this.selectedPriority !== 'all') {
      filtered = filtered.filter(circular => circular.priority === this.selectedPriority);
    }

    // Filter by read status
    if (!this.showReadCirculars) {
      filtered = filtered.filter(circular => !circular.isRead);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(circular =>
        circular.title.toLowerCase().includes(query) ||
        circular.circular_code.toLowerCase().includes(query) ||
        circular.department.toLowerCase().includes(query) ||
        circular.content.toLowerCase().includes(query) ||
        circular.creator_name.toLowerCase().includes(query)
      );
    }

    this.filteredCirculars = filtered;
    this.groupCircularsByDate();
  }

  /**
   * Group circulars by date
   */
  groupCircularsByDate() {
    const grouped: GroupedCirculars = {};
    
    this.filteredCirculars.forEach(circular => {
      const date = new Date(circular.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(circular);
    });

    this.groupedCirculars = grouped;
    this.groupedDates = Object.keys(grouped).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }

  /**
   * Calculate statistics
   */
  calculateStats() {
    this.totalCirculars = this.filteredCirculars.length;
    this.unreadCount = this.filteredCirculars.filter(c => !c.isRead).length;
  }

  /**
   * Event handlers
   */
  onYearChange(year: number) {
    this.selectedYear = year;
    this.selectedMonth = 'all';
    this.applyFilters();
    this.calculateStats();
  }

  onMonthChange(month: string) {
    this.selectedMonth = month;
    this.applyFilters();
    this.calculateStats();
  }

  onSearchChange(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.applyFilters();
    this.calculateStats();
  }

  onPriorityChange(priority: string) {
    this.selectedPriority = priority;
    this.applyFilters();
    this.calculateStats();
  }

  toggleReadCirculars() {
    this.showReadCirculars = !this.showReadCirculars;
    this.applyFilters();
    this.calculateStats();
  }

  viewCircular(circular: Circular) {
     const data={
      circularId:circular.circular_id,
      employeeId:this.employeeData.id
    }
     
    this.circularService.markCircularAsSeenForEmp(data).subscribe(
      (res:any)=>{
        console.log('Mark as seen!!!!!')
      }
    )
    this.router.navigate(['employee/circular-details'], { 
          queryParams: { circularId: circular.circular_id } 
        });
  }

  markAsRead(circular: Circular) {
    circular.isRead = true;
    circular.is_seen = true;
    circular.seen_at = new Date().toISOString();
    this.calculateStats();
    
    // TODO: Call API to update read status on backend
    // this.circularService.markCircularAsRead(circular.tracking_id).subscribe();
  }

  downloadCircular(circular: Circular, event: Event) {
    event.stopPropagation();
    console.log('Download circular:', circular);
    // TODO: Implement download functionality
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'URGENT': return 'priority-urgent';
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return 'priority-low';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'check_circle';
      default: return 'info';
    }
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  parseInt(value: string): number {
    return parseInt(value, 10);
  }

  getRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

}
