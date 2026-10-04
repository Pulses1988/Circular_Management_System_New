import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CircularService } from '../../services/circular-service';
import { EmployeeService } from '../../services/employee-service';

interface Circular {
  id: number;
  circular_id: number;
  title: string;
  content: string;
  circular_code: string;
  send_type: string;
  status: string;
  priority: string;
  created_at: string;
  published_at: string;
  effective_from: string;
  is_seen: boolean;
  seen_at?: string;
  creator_first_name: string;
  creator_last_name: string;
  department_name?: string;
  branch_name?: string;
  tracking?: any;
  is_completed:boolean;
}


@Component({
  selector: 'app-filtered-circulars',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filtered-circulars.html',
  styleUrl: './filtered-circulars.scss'
})
export class FilteredCirculars {

filterType: 'urgent' | 'unread' | 'all' = 'all'; 

itemType: 'CIRCULAR' | 'HO_ASSIGNMENT' = 'CIRCULAR';
  circulars: Circular[] = [];
  filteredCirculars: Circular[] = [];
  loading = true;
  employeeData: any;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  // Stats
  totalCount = 0;
  urgentCount = 0;
  unreadCount = 0;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private circularService: CircularService,
    private employeeService: EmployeeService
  ) {}

  async ngOnInit() {
    this.employeeData = await this.employeeService.getCurrentEmployee();
    
    // this.route.queryParams.subscribe(params => {
    //   this.filterType = params['type'] || 'all';
    //   this.loadCirculars();
    // }); 

this.route.queryParams.subscribe(params => {
  this.filterType = params['type'] || 'all';
  this.itemType = params['itemType'] || 'CIRCULAR';
  this.loadCirculars();
});



  }

  loadCirculars() {
    this.loading = true;
    
    if (this.filterType === 'unread') {
      this.circularService.fetchUnseenCircularsByEmpId(this.employeeData.id).subscribe({
        next: (res: any) => {
          // this.circulars = res.data || [];
          // this.applyFilters();
          // this.loading = false; 
           console.log("EMPLOYEE ID:", this.employeeData.id);
      console.log("UNREAD API RESPONSE:", res.data);

          this.circulars = (res.data || []).filter(
  (item: any) => item.item_type === this.itemType
);
 console.log("AFTER ITEM TYPE FILTER:", this.circulars);

this.applyFilters();
this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      this.circularService.fetchCircularAssignToEmpById(this.employeeData.id).subscribe({
        next: (res: any) => {
          // this.circulars = res.data.filter((c: any) => c.status === 'APPROVED') || []; 
this.circulars = (res.data || []).filter(
  (c: any) =>
    c.status === 'APPROVED' &&
    c.item_type === this.itemType
);



          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  applyFilters() {
    if (this.filterType === 'urgent') {
      console.log(this.circulars,'from filtercomponet')
      this.filteredCirculars = this.circulars.filter(c => c.priority === 'URGENT' && c.is_completed != true);
    } else if (this.filterType === 'unread') {
      this.filteredCirculars = this.circulars;
    } else {
      this.filteredCirculars = this.circulars;
    }

    // Update stats
    this.totalCount = this.circulars.length;
    this.urgentCount = this.circulars.filter(c => c.priority === 'URGENT').length;
    this.unreadCount = this.circulars.filter(c => !c.is_seen).length;
    
    // Calculate pagination
    this.totalPages = Math.ceil(this.filteredCirculars.length / this.itemsPerPage);
  }

  switchFilter(type: 'urgent' | 'unread' | 'all') {
    this.filterType = type;
    this.currentPage = 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type },
      queryParamsHandling: 'merge'
    });
    this.applyFilters();
  }

  getPaginatedCirculars() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredCirculars.slice(start, end);
  }

  viewCircular(circular: Circular) {
    const data = {
      circularId: circular.circular_id || circular.id,
      employeeId: this.employeeData.id
    };

    if (!circular.is_seen) {
      this.circularService.markCircularAsSeenForEmp(data).subscribe(() => {
        this.router.navigate(['/employee/circular-details'], {
          queryParams: { circularId: circular.circular_id || circular.id }
        });
      });
    } else {
      this.router.navigate(['/employee/circular-details'], {
        queryParams: { circularId: circular.circular_id || circular.id }
      });
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority?.toUpperCase()) {
      case 'URGENT':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'HIGH':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'MEDIUM':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'LOW':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  }

  getFilterIcon(): string {
    switch (this.filterType) {
      case 'urgent':
        return 'priority_high';
      case 'unread':
        return 'mark_email_unread';
      default:
        return 'description';
    }
  }

  getFilterTitle(): string {
   
 if (this.itemType === 'HO_ASSIGNMENT') {
    switch (this.filterType) {
      case 'urgent':
        return 'Urgent HO Assignments';
      case 'unread':
        return 'Unread HO Assignments';
      default:
        return 'All HO Assignments';
    }
  }

  switch (this.filterType) {
    case 'urgent':
      return 'Urgent Circulars';
    case 'unread':
      return 'Unread Circulars';
    default:
      return 'All Circulars';
  }


  }

  getFilterDescription(): string {
    
 if (this.itemType === 'HO_ASSIGNMENT') {
    switch (this.filterType) {
      case 'urgent':
        return 'Urgent HO assignments that require your attention';
      case 'unread':
        return "HO assignments you haven't viewed yet";
      default:
        return 'All HO assignments assigned to you';
    }
  }

  switch (this.filterType) {
    case 'urgent':
      return 'Urgent circulars that require your attention';
    case 'unread':
      return "Circulars you haven't viewed yet";
    default:
      return 'All circulars assigned to you';
  }

  }


  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getTimeAgo(date: string): string {
    const now = new Date().getTime();
    const past = new Date(date).getTime();
    const diff = now - past;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  Math = Math;
}
