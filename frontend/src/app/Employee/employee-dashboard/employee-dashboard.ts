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
  priority:string;
  effective_from: string;
  reference_circular_id: number;
  source_type_id: number;
  repeat_cycle_id: number;
  count: number | null;
   is_seen: boolean;
   is_completed:boolean;

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
  is_seen: boolean;
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
      route: '/employee/all-circulars',
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
  pendingApprovals: any[] = [];
showPendingApprovalModal = false;
pendingApprovalCount = 0;
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
      this.loadPendingApprovals();
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
        const approvedCirculars = res.data.filter((circular: any) => 
          circular.status === 'APPROVED' || 'COMPLETED'
      );
      console.log(approvedCirculars,'approvedddddd')
      this.recentCirculars = approvedCirculars.sort((a: any, b: any) => {
        const dateA = new Date(a.published_at).getTime();
        const dateB = new Date(b.published_at).getTime();
        return dateB - dateA; // Descending order (latest first)
      })
      .slice(0, 5);
      this.circularStats.total = approvedCirculars.length;
        this.urgentCirculars = this.recentCirculars.filter((circular) => {
         return circular.priority === 'URGENT' && circular.is_completed != true;
        });

        // Update stats
        this.circularStats.urgent = this.urgentCirculars.length;

        this.circularService
          .fetchUnseenCircularsByEmpId(this.employeeData.id)
          .subscribe((res: any) => {
            this.unSeenCirculars = res.data || [];
            console.log(this.unSeenCirculars,'unseen')
            this.circularStats.unseen = this.unSeenCirculars.length;
            //  this.circularStats.total = this.circularStats.seen + this.circularStats.unseen;
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



loadPendingApprovals() {

  if (!this.employeeData?.id) {
    return;
  }

  this.circularService
    .getAssingedCircularForApproval(this.employeeData.id)
    .subscribe({

      next: (res: any) => {

        const approvals = res.data || [];

        this.pendingApprovals = approvals.filter(
          (c: any) => c.circular_status === 'PENDING_APPROVAL'
        );

        this.pendingApprovalCount = this.pendingApprovals.length;

      },

      error: (err) => {
        console.error(err);
        this.pendingApprovalCount = 0;
      }

    });

}

viewPendingApproval(approval: any) {
  this.closePendingApprovalModal();

  this.router.navigate(['/employee/circular-approval'], {
    queryParams: {
      circularId: approval.id
    }
  });
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

openPendingApprovalModal() {
  this.showPendingApprovalModal = true;
}

closePendingApprovalModal() {
  this.showPendingApprovalModal = false;
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
    const data={
      circularId:id,
      employeeId:this.employeeData.id
    }
     
    this.circularService.markCircularAsSeenForEmp(data).subscribe(
      (res:any)=>{
        console.log('Mark as seen!!!!!')
      }
    )
    this.router.navigate(['employee/circular-details'], { 
          queryParams: { circularId: id } 
        });
  }

  viewCircular(circular: Circulars) {
    const data={
      circularId:circular.circular_id,
      employeeId:this.employeeData.id
    }
   if(circular.is_seen){
     this.router.navigate(['employee/circular-details'], { 
          queryParams: { circularId: circular.circular_id } 
        });
   }else{
    this.circularService.markCircularAsSeenForEmp(data).subscribe(
      (res:any)=>{
        console.log('marked as seen!!!!!!! ', res);
        this.router.navigate(['employee/circular-details'], { 
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

  getPriorityIcon(priority: string): string {

    switch (priority) {
      case 'URGENT':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'check_circle';
      default:
        return 'info';
    }
  }

  getPriorityBadgeClass(priority: string): string {

    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-600';
      case 'HIGH':
        return 'bg-orange-100 text-orange-600';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-600';
      case 'LOW':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getPriorityTextClass(priority: string): string {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-50 text-red-700';
      case 'HIGH':
        return 'bg-orange-50 text-orange-700';
      case 'MEDIUM':
        return 'bg-yellow-50 text-yellow-700';
      case 'LOW':
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
    this.router.navigate([route])
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
