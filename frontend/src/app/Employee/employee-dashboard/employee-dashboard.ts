import { Component } from '@angular/core';
import { CommonModule, NumberSymbol } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { EmployeeService } from '../../services/employee-service';
import { CircularService } from '../../services/circular-service';
import { error } from 'console';
import { Toast } from 'ngx-toastr';
import { ToastComponent } from '../../toast/toast-component/toast-component';
import { Router } from '@angular/router';

interface CircularStats {
  total: number;
  seen: number;
  unseen: number;
  urgent: number;
}

interface Circular {
  id: number;
  title: string;
  content: string;
  circular_code: string;
  send_type: string;
  status: string;
  created_at: string;
  published_at: string;
  effective_from: string;
  reference_circular_id: number;
  source_type_id: number;
  repeat_cycle_id: number;
  count: number | null;
}

interface Circulars {
  trackId: number;
  circular_id: number;
  employee_id: number;
  is_seen: boolean;
  seen_at: string;
  is_completed: boolean;
  completed_at: string;
  title: string;
  effective_from: string;
  published_at: string;
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

interface RecentCircular {
  id: number;
  title: string;
  department: string;
  date: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
}

interface QuickAction {
  icon: string;
  title: string;
  description: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-employee-dashboard',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule, MatBadgeModule],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.scss',
})


export class EmployeeDashboard {
  currentEmployee = {
    name: 'Rohit Chougale',
    employeeId: 'EMP001',
    role: 'Senior Analyst',
    department: 'Finance',
    branch: 'Main Branch',
    avatar: '',
  };

  circularStats: CircularStats = {
    total: 45,
    seen: 32,
    unseen: 13,
    urgent: 3,
  };

  recentCirculars!: Circular[];

  quickActions: QuickAction[] = [
    {
      icon: 'article',
      title: 'All Circulars',
      description: 'View all department circulars',
      route: '/employee/circulars',
      color: 'bg-blue-500',
    },
    {
      icon: 'mark_email_unread',
      title: 'Unread Items',
      description: 'Check unread notifications',
      route: '/employee/unread',
      color: 'bg-red-500',
    },
    {
      icon: 'schedule',
      title: 'My Schedule',
      description: 'View upcoming events',
      route: '/employee/schedule',
      color: 'bg-green-500',
    },
    {
      icon: 'person',
      title: 'My Profile',
      description: 'Update personal information',
      route: '/employee/profile',
      color: 'bg-purple-500',
    },
  ];

  employeeData!: EmployeeData;
  circulars!: Circular;
  circularCount!: number;
  urgentCirculars: Circular[] = [];
  showUrgentModal = false;
  showUnSeenModal = false;
  showSeenModal=false;
  unSeenCirculars:Circulars[] = [];
  seenCirculars:Circulars[]=[];


  constructor(private employeeService: EmployeeService, private circularService: CircularService,  private router: Router) {}

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
    if (!this.employeeData?.id) {
      console.warn('Employee ID missing, skipping circular load');
      return;
    }

    this.circularService.fetchCircularAssignToEmpById(this.employeeData.id).subscribe(
      (res: any) => {
        console.log('Circular response:', res);

        // ✅ Handle backend structure correctly
        this.recentCirculars = res.data || [];
        console.log(this.recentCirculars,'skjadhksa')
        this.circularCount = res.count || 0;
        this.urgentCirculars = this.recentCirculars.filter((circular) => {
          if (!circular.effective_from) return false;

          const effectiveDate = new Date(circular.effective_from);
          const now = new Date();

          // Time difference in milliseconds
          const diffMs = effectiveDate.getTime() - now.getTime();

          // diffDays = number of days until effective date
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          // Include if already effective (diffDays <= 0) OR will be effective within 7 days
          return diffDays <= 7;
        });

        // Update stats
        this.circularStats.urgent = this.urgentCirculars.length;

        this.circularService
          .fetchUnseenCircularsByEmpId(this.employeeData.id)
          .subscribe((res: any) => {
            this.unSeenCirculars = res.data || [];
            console.log(this.unSeenCirculars,'unseen')
            this.circularStats.unseen = this.unSeenCirculars.length;
          });
      },
      (error) => {
        console.error('Failed to fetch Circulars', error);
        this.circularCount = 0;
      }
    );
    this.circularService.fetchSeenCircularsByEmpId(this.employeeData.id)
    .subscribe((res:any)=>{
      this.seenCirculars=res.data || [];
      this.circularStats.seen=this.seenCirculars.length;
    })
  }
  openUrgentModal() {
    this.showUrgentModal = true;
  }

  openUnseenModal() {
    this.showUnSeenModal = true;
  }

  openSeenModal(){
    this.showSeenModal=true;
  }

  closeUrgentModal() {
    this.showUrgentModal = false;
  }

  closeUnseenModal() {
    this.showUnSeenModal = false;
  }

  closeSeenModal(){
    this.showSeenModal=false;
  }

  viewUrgentCircular(id:number){
    this.router.navigate(['employee/circular-details'], { 
          queryParams: { circularId: id } 
        });
  }

  viewCircular(circular: Circulars) {
    const data={
      circularId:circular.circular_id,
      employeeId:this.employeeData.id
    }
   if(circular.is_seen !=null){
     this.router.navigate(['employee/circular-details'], { 
          queryParams: { circularId: circular.circular_id } 
        });
   }else{
    this.circularService.markCircularAsSeenForEmp(data).subscribe(
      (res:any)=>{
        console.log('marked as seen!!!!!!! ', res);
        this.router.navigate(['/circular-details'], { 
          queryParams: { circularId: circular.circular_id } 
        });
      },
      (error) => {
        console.error('Error marking as seen:', error);
      }
    )
  }
    
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low':
        return 'text-green-700 bg-green-100 border-green-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  }

  getPriorityIcon(effectiveFrom: string): string {
    if (!effectiveFrom) return 'info';

    const effectiveDate = new Date(effectiveFrom);
    const now = new Date();

    const diffDays = (effectiveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    let priority = 'low'; // default

    if (diffDays <= 0) {
      priority = 'urgent'; // already effective or past
    } else if (diffDays <= 1) {
      priority = 'high'; // within next 1 day
    } else if (diffDays <= 3) {
      priority = 'medium'; // within next 3 days
    } else if (diffDays <= 7) {
      priority = 'low'; // within next 7 days
    }

    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'check_circle';
      default:
        return 'info';
    }
  }

  getPriorityBadgeClass(effectiveFrom: string): string {
    if (!effectiveFrom) return 'bg-gray-100 text-gray-600';

    const effectiveDate = new Date(effectiveFrom);
    const now = new Date();

    const diffDays = (effectiveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    let priority = 'low'; // default

    if (diffDays <= 0) {
      priority = 'urgent';
    } else if (diffDays <= 1) {
      priority = 'high';
    } else if (diffDays <= 3) {
      priority = 'medium';
    } else if (diffDays <= 7) {
      priority = 'low';
    }

    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-600';
      case 'high':
        return 'bg-orange-100 text-orange-600';
      case 'medium':
        return 'bg-yellow-100 text-yellow-600';
      case 'low':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getPriorityTextClass(effectiveFrom: string): string {
    if (!effectiveFrom) return 'bg-gray-50 text-gray-700';

    const effectiveDate = new Date(effectiveFrom);
    const now = new Date();
    const diffInDays = Math.floor(
      (effectiveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let priority = 'low';
    if (diffInDays <= 0) priority = 'urgent'; // past or today
    else if (diffInDays <= 3) priority = 'high'; // within 3 days
    else if (diffInDays <= 7) priority = 'medium'; // within a week
    else priority = 'low'; // more than 7 days away

    switch (priority) {
      case 'urgent':
        return 'bg-red-50 text-red-700';
      case 'high':
        return 'bg-orange-50 text-orange-700';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700';
      case 'low':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  }

  markAsRead(circularId: number) {
    // const circular = this.recentCirculars.find(c => c.id === circularId);
    // if (circular && !circular.isRead) {
    //   circular.isRead = true;
    //   this.circularStats.seen++;
    //   this.circularStats.unseen--;
    // }
  }

  navigateToAction(route: string) {
    // Navigate to specific route
    console.log('Navigating to:', route);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
