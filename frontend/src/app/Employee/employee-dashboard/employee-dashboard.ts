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
  priority: string;
  effective_from: string;
  reference_circular_id: number;
  source_type_id: number;
  repeat_cycle_id: number;
  count: number | null;
  is_seen: boolean;
  is_completed: boolean;
  next_recurrence_date: string | null;
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

//Adding interface for pending Assignment

interface PendingAssignment {
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
  item_type: string;
  priority: string;
  circular_code?: string;
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
  currentDate = new Date();

  //Adding variables for calender
  calendarDate = new Date();
  calendarDays: any[] = [];
  calendarDueDates: Date[] = [];

  //Adding variable for view circular which is due on calender date
  selectedDueCirculars: Circular[] = [];
  showDueCircularModal = false;

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

  calendarCirculars: Circular[] = [];

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
      route: '/employee/filtered-circulars?type=unread',
      color: 'bg-red-500',
    },
    {
      icon: 'schedule',
      title: 'My Tasks',
      description: 'View upcoming events',
      route: '/employee/all-circulars?type=HO_ASSIGNMENT',
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
  showSeenModal = false;
  pendingApprovals: any[] = [];
  showPendingApprovalModal = false;
  pendingApprovalCount = 0;
  unSeenCirculars: Circulars[] = [];
  seenCirculars: Circulars[] = [];

  //Adding variable for pending assignments
  pendingAssignments: PendingAssignment[] = [];
  pendingAssignmentCount = 0;

  constructor(
    private employeeService: EmployeeService,
    private circularService: CircularService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadEmployeeData();
  }

  // async loadEmployeeData() {
  //   this.employeeData = await this.employeeService.getCurrentEmployee();
  //   if (this.employeeData?.id) {
  //     this.loadCirculars();
  //     this.loadPendingApprovals();
  //   }
  // }

  async loadEmployeeData() {
    this.employeeData = await this.employeeService.getCurrentEmployee();

    if (this.employeeData?.id) {
      this.loadCirculars();
      this.loadPendingApprovals();
      this.generateCalendar();
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

        console.log(
  'URGENT CIRCULAR SEEN STATUS:',
  (res.data || [])
    .filter((c: any) => c.priority === 'URGENT')
    .map((c: any) => ({
      id: c.id,
      title: c.title,
      is_seen: c.is_seen,
      is_completed: c.is_completed,
      priority: c.priority
    }))
);

        console.log(
          'NEXT RECURRENCE DATES:',
          (res.data || []).map((c: any) => ({
            id: c.id,
            title: c.title,
            effective_from: c.effective_from,
            repeat_cycle_id: c.repeat_cycle_id,
            next_recurrence_date: c.next_recurrence_date,
          })),
        );

        // ✅ Handle backend structure correctly

        //   const approvedCirculars = res.data.filter((circular: any) =>
        //     circular.status === 'APPROVED' || 'COMPLETED'
        // );
        const approvedCirculars = (res.data || []).filter(
          (circular: any) => circular.status === 'APPROVED' || circular.status === 'COMPLETED',
        );

        this.calendarCirculars = approvedCirculars;
        this.getDueDatesFromCirculars();

        console.log(approvedCirculars, 'approvedddddd');
        // this.recentCirculars = approvedCirculars.sort((a: any, b: any) => {
        //   const dateA = new Date(a.published_at).getTime();
        //   const dateB = new Date(b.published_at).getTime();
        //   return dateB - dateA; // Descending order (latest first)
        // })
        // .slice(0, 5);
        // this.circularStats.total = approvedCirculars.length;
        //   this.urgentCirculars = this.recentCirculars.filter((circular) => {
        //    return circular.priority === 'URGENT' && circular.is_completed != true;
        //   });

        this.recentCirculars = approvedCirculars
          .sort((a: any, b: any) => {
            const dateA = new Date(a.published_at).getTime();
            const dateB = new Date(b.published_at).getTime();

            return dateB - dateA;
          })
          .slice(0, 5);

        this.circularStats.total = approvedCirculars.length;

        // Get ALL urgent circulars 

        // this.urgentCirculars = approvedCirculars
        //   .filter((circular: Circular) => {
        //     return circular.priority === 'URGENT' && circular.is_completed !== true;
        //   })  



        
        
        
        
        // Update stats
        // this.circularStats.urgent = this.urgentCirculars.length;

       this.circularService
  .fetchUnseenCircularsByEmpId(this.employeeData.id)
  .subscribe((res: any) => {
    const unseenItems = res.data || [];
console.log(
  'DETAILED UNSEEN ITEMS:',
  unseenItems.map((item: any) => ({
    track_id: item.track_id,
    circular_id: item.circular_id,
    employee_id: item.employee_id,
    is_seen: item.is_seen,
    is_completed: item.is_completed,
    title: item.title,
    priority: item.priority,
    item_type: item.item_type
  }))
);
    console.log('All unseen items:', unseenItems);

    // -----------------------------------------
    // UNSEEN CIRCULARS
    // -----------------------------------------

    this.unSeenCirculars = unseenItems.filter(
      (item: any) => item.item_type === 'CIRCULAR'
    );

    // -----------------------------------------
    // UNSEEN CIRCULAR IDs
    // -----------------------------------------

    const unseenCircularIds = new Set(
      this.unSeenCirculars.map(
        (item: any) => Number(item.circular_id)
      )
    );
    console.log(
      'UNSEEN CIRCULAR IDs:',
      Array.from(unseenCircularIds)
    );
    this.urgentCirculars = approvedCirculars
  .filter((circular: Circular) => {  

    return (
      circular.priority === 'URGENT' &&
      circular.is_completed !== true &&
      !circular.is_seen
       
        // unseenCircularIds.has(Number(circular.id))
    );
  })
  .sort((a: Circular, b: Circular) => {
    const dateA = new Date(a.published_at).getTime();
    const dateB = new Date(b.published_at).getTime();

    return dateB - dateA;
  });

this.circularStats.urgent = this.urgentCirculars.length;







    console.log(
      'FINAL URGENT CIRCULARS:',
      this.urgentCirculars
    );

    console.log(
      'FINAL URGENT COUNT:',
      this.circularStats.urgent
    );

    // -----------------------------------------
    // PENDING HO ASSIGNMENTS
    // -----------------------------------------

    this.pendingAssignments = unseenItems
      .filter(
        (item: any) =>
          item.item_type === 'HO_ASSIGNMENT' &&
          item.is_completed !== true
      )
      .slice(0, 5);

    this.pendingAssignmentCount =
      this.pendingAssignments.length;

    console.log(
      'Pending HO Assignments:',
      this.pendingAssignments
    );

    // -----------------------------------------
    // UNSEEN COUNT
    // -----------------------------------------

    this.circularStats.unseen =
      this.unSeenCirculars.length;
  });
},



      
      (error) => {
        console.error('Failed to fetch Circulars', error);
        this.circularCount = 0;
      },
    );
    this.circularService.fetchSeenCircularsByEmpId(this.employeeData.id).subscribe((res: any) => {
      this.seenCirculars = res.data || [];
      this.circularStats.seen = this.seenCirculars.length;
    });
  }

  loadPendingApprovals() {
    if (!this.employeeData?.id) {
      return;
    }

    this.circularService.getAssingedCircularForApproval(this.employeeData.id).subscribe({
      next: (res: any) => {
        const approvals = res.data || [];

        this.pendingApprovals = approvals.filter(
          (c: any) => c.circular_status === 'PENDING_APPROVAL',
        );

        this.pendingApprovalCount = this.pendingApprovals.length;
      },

      error: (err) => {
        console.error(err);
        this.pendingApprovalCount = 0;
      },
    });
  }

  viewPendingApproval(approval: any) {
    this.closePendingApprovalModal();

    this.router.navigate(['/employee/circular-approval'], {
      queryParams: {
        circularId: approval.id,
      },
    });
  }

  //Veiew pending Assignments
  viewPendingAssignment(assignment: PendingAssignment) {
    const data = {
      circularId: assignment.circular_id,
      employeeId: this.employeeData.id,
    };

    if (!assignment.is_seen) {
      this.circularService.markCircularAsSeenForEmp(data).subscribe({
        next: () => {
          this.router.navigate(['/employee/circular-details'], {
            queryParams: {
              circularId: assignment.circular_id,
            },
          });
        },
        error: (error) => {
          console.error('Error marking assignment as seen:', error);
        },
      });
    } else {
      this.router.navigate(['/employee/circular-details'], {
        queryParams: {
          circularId: assignment.circular_id,
        },
      });
    }
  }

  //Adding method to generate calender days and dates
  generateCalendar() {
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.calendarDays = [];

    // Previous month's dates
    const previousMonthDays = new Date(year, month, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      this.calendarDays.push({
        date: previousMonthDays - i,
        currentMonth: false,
        fullDate: new Date(year, month - 1, previousMonthDays - i),
      });
    }

    // Current month's dates
    for (let day = 1; day <= daysInMonth; day++) {
      this.calendarDays.push({
        date: day,
        currentMonth: true,
        fullDate: new Date(year, month, day),
      });
    }

    // Next month's dates
    let nextDay = 1;

    while (this.calendarDays.length < 42) {
      this.calendarDays.push({
        date: nextDay,
        currentMonth: false,
        fullDate: new Date(year, month + 1, nextDay),
      });

      nextDay++;
    }
  }

  //Adding the method to check due date
  // getDueDatesFromCirculars() {
  //   this.calendarDueDates = [];

  //   if (!this.calendarCirculars || this.calendarCirculars.length === 0) {
  //     return;
  //   }

  //   this.calendarCirculars.forEach((circular: Circular) => {
  //     if (circular.effective_from) {
  //       this.calendarDueDates.push(
  //         new Date(circular.effective_from)
  //       );
  //     }
  //   });

  //   console.log('Calendar due dates:', this.calendarDueDates);
  // }
  getDueDatesFromCirculars() {
    this.calendarDueDates = [];

    if (!this.calendarCirculars || this.calendarCirculars.length === 0) {
      return;
    }

    this.calendarCirculars.forEach((circular: Circular) => {
      if (!circular.effective_from || !circular.repeat_cycle_id) {
        return;
      }

      const dueDate = new Date(circular.effective_from);

      switch (circular.repeat_cycle_id) { 

       case 1: // Daily
    dueDate.setDate(dueDate.getDate() + 1);
    break;

        case 2: // Monthly
          dueDate.setMonth(dueDate.getMonth() + 1);
          break;

        case 3: // Quarterly
          dueDate.setMonth(dueDate.getMonth() + 3);
          break;

        case 4: // Weekly
          dueDate.setDate(dueDate.getDate() + 7);
          break;

        case 5: // Yearly
          dueDate.setFullYear(dueDate.getFullYear() + 1);
          break;

        case 6: // Fortnight
          dueDate.setDate(dueDate.getDate() + 14);
          break;

        case 7: // Half-Yearly
          dueDate.setMonth(dueDate.getMonth() + 6);
          break;

        default:
          console.warn('Unknown repeat cycle:', circular.repeat_cycle_id);
          return;
      }

      this.calendarDueDates.push(dueDate);

      console.log(
        'Calendar Due Date:',
        circular.title,
        'Effective:',
        circular.effective_from,
        'Repeat Cycle:',
        circular.repeat_cycle_id,
        'Due Date:',
        dueDate,
      );
    });

    console.log('Calendar due dates:', this.calendarDueDates);
  }

  isDueDate(date: Date): boolean {
    return this.calendarDueDates.some((dueDate) => {
      return (
        dueDate.getFullYear() === date.getFullYear() &&
        dueDate.getMonth() === date.getMonth() &&
        dueDate.getDate() === date.getDate()
      );
    });
  }

  //Method to view circulars which are due on selcted date
  // getDueCirculars(date: Date): Circular[] {
  //   return this.calendarCirculars.filter((circular: Circular) => {

  //     if (!circular.effective_from) {
  //       return false;
  //     }

  //     const dueDate = new Date(circular.effective_from);

  //     return (
  //       dueDate.getFullYear() === date.getFullYear() &&
  //       dueDate.getMonth() === date.getMonth() &&
  //       dueDate.getDate() === date.getDate()
  //     );
  //   });
  // }
  getDueCirculars(date: Date): Circular[] {
    return this.calendarCirculars.filter((circular: Circular) => {
      if (!circular.effective_from || !circular.repeat_cycle_id) {
        return false;
      }

      const dueDate = new Date(circular.effective_from);

      switch (circular.repeat_cycle_id) { 
         
        case 1: // Daily
    dueDate.setDate(dueDate.getDate() + 1);
    break;


        case 2: // Monthly
          dueDate.setMonth(dueDate.getMonth() + 1);
          break;

        case 3: // Quarterly
          dueDate.setMonth(dueDate.getMonth() + 3);
          break;

        case 4: // Weekly
          dueDate.setDate(dueDate.getDate() + 7);
          break;

        case 5: // Yearly
          dueDate.setFullYear(dueDate.getFullYear() + 1);
          break;

        case 6: // Fortnight
          dueDate.setDate(dueDate.getDate() + 14);
          break;

        case 7: // Half-Yearly
          dueDate.setMonth(dueDate.getMonth() + 6);
          break;

        default:
          console.warn('Unknown repeat cycle:', circular.repeat_cycle_id);
          return false;
      }

      return (
        dueDate.getFullYear() === date.getFullYear() &&
        dueDate.getMonth() === date.getMonth() &&
        dueDate.getDate() === date.getDate()
      );
    });
  }

  openDueCirculars(date: Date) {
    const dueCirculars = this.getDueCirculars(date);

    if (dueCirculars.length === 0) {
      return;
    }

    // If only one circular is due on this date,
    // open that circular directly.
    if (dueCirculars.length === 1) {
      this.viewUrgentCircular(dueCirculars[0].id);
      return;
    }

    // If multiple circulars are due on the same date,
    // show them in a modal.
    this.selectedDueCirculars = dueCirculars;
    this.showDueCircularModal = true;
  }

  closeDueCircularModal() {
    this.showDueCircularModal = false;
    this.selectedDueCirculars = [];
  }

  //Method for previous month And next month
  previousMonth() {
    this.calendarDate = new Date(
      this.calendarDate.getFullYear(),
      this.calendarDate.getMonth() - 1,
      1,
    );

    this.generateCalendar();
  }

  nextMonth() {
    this.calendarDate = new Date(
      this.calendarDate.getFullYear(),
      this.calendarDate.getMonth() + 1,
      1,
    );

    this.generateCalendar();
  }

  getCalendarMonthName(): string {
    return this.calendarDate.toLocaleString('en-US', {
      month: 'long',
    });
  }

  getCalendarYear(): number {
    return this.calendarDate.getFullYear();
  }

  //Addding a method to get view circular
  viewDueCircular(circular: Circular) {
    this.closeDueCircularModal();

    const data = {
      circularId: circular.id,
      employeeId: this.employeeData.id,
    };

    if (!circular.is_seen) {
      this.circularService.markCircularAsSeenForEmp(data).subscribe({
        next: () => {
          this.router.navigate(['employee/circular-details'], {
            queryParams: {
              circularId: circular.id,
            },
          });
        },

        error: (error) => {
          console.error('Error marking circular as seen:', error);
        },
      });
    } else {
      this.router.navigate(['employee/circular-details'], {
        queryParams: {
          circularId: circular.id,
        },
      });
    }
  }

  openUrgentModal() {
    this.showUrgentModal = true;
  }

  openUnseenModal() {
    this.showUnSeenModal = true;
  }

  openSeenModal() {
    this.showSeenModal = true;
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

  closeSeenModal() {
    this.showSeenModal = false;
  }

 
// viewUrgentCircular(id: number): void {
//   if (!this.employeeData?.id) {
//     return;
//   }

//   console.log('🔴 Marking urgent circular as seen:', {
//     circularId: id,
//     employeeId: this.employeeData.id
//   });

//   this.circularService.markCircularAsSeenForEmp({
//     circularId: id,
//     employeeId: this.employeeData.id
//   }).subscribe({
//     next: (res: any) => {

//       console.log('✅ Mark as seen API SUCCESS:', res);

//       // Find the circular before removing it
//       const clickedCircular = this.urgentCirculars.find(
//         circular => Number(circular.id) === Number(id)
//       );

//       console.log('Clicked urgent circular:', clickedCircular);

//       // Remove clicked circular from urgent list
//       this.urgentCirculars = this.urgentCirculars.filter(
//         circular => Number(circular.id) !== Number(id)
//       );

//       console.log(
//         'Updated urgent circulars:',
//         this.urgentCirculars
//       );

//       // Update urgent count
//       this.circularStats.urgent = this.urgentCirculars.length;

//       console.log(
//         'Updated urgent count:',
//         this.circularStats.urgent
//       );

//       // -----------------------------------------
//       // Update READ / UNREAD counts
//       // -----------------------------------------

//       if (clickedCircular && !clickedCircular.is_seen) {

//         // Mark it locally as seen
//         clickedCircular.is_seen = true;

//         // Increase READ count
//         this.circularStats.seen++;

//         // Decrease UNREAD count
//         if (this.circularStats.unseen > 0) {
//           this.circularStats.unseen--;
//         }

//         // Remove it from unread modal/list
//         this.unSeenCirculars = this.unSeenCirculars.filter(
//           circular =>
//             Number(circular.circular_id) !== Number(id)
//         );

//         console.log('Updated READ count:', this.circularStats.seen);
//         console.log('Updated UNREAD count:', this.circularStats.unseen);
//       }

//       // Navigate to details
//       this.router.navigate(['/employee/circular-details'], {
//         queryParams: {
//           circularId: id
//         }
//       });
//     },

//     error: (error) => {

//       console.error(
//         '❌ Error marking urgent circular as seen:',
//         error
//       );

//       // Still allow user to view the circular
//       this.router.navigate(['/employee/circular-details'], {
//         queryParams: {
//           circularId: id
//         }
//       });
//     }
//   });
// }

viewUrgentCircular(id: number): void {
  if (!this.employeeData?.id) {
    return;
  }

  console.log('🔴 Marking urgent circular as seen:', {
    circularId: id,
    employeeId: this.employeeData.id
  });

  this.circularService.markCircularAsSeenForEmp({
    circularId: id,
    employeeId: this.employeeData.id
  }).subscribe({
    next: (res: any) => {

      console.log('✅ Mark as seen API SUCCESS:', res);

      // Find the circular before removing it 

      const clickedCircular = this.urgentCirculars.find(
        circular => Number(circular.id) === Number(id)
      );

      // Remove the viewed circular from URGENT list
      this.urgentCirculars = this.urgentCirculars.filter(
        circular => Number(circular.id) !== Number(id)
      );

      // Update URGENT count
      this.circularStats.urgent = this.urgentCirculars.length;

      // -----------------------------------------
      // Update READ / UNREAD counts
      // -----------------------------------------

      if (clickedCircular && !clickedCircular.is_seen) {

        clickedCircular.is_seen = true;

        // Increase READ count
        this.circularStats.seen++;

        // Decrease UNREAD count
        if (this.circularStats.unseen > 0) {
          this.circularStats.unseen--;
        }

        // Remove from UNREAD modal/list
        this.unSeenCirculars = this.unSeenCirculars.filter(
          circular =>
            Number(circular.circular_id) !== Number(id)
        );
      }

      // Keep the urgent modal open while the user is viewing
      // the circular. It will automatically show the updated list
      // when they return to the dashboard.

      // Navigate to circular details
      this.router.navigate(['/employee/circular-details'], {
        queryParams: {
          circularId: id
        }
      });
    },

    error: (error) => {

      console.error(
        '❌ Error marking urgent circular as seen:',
        error
      );

      // Do not remove the circular if the API failed.
      // Still allow the user to view it.
      this.router.navigate(['/employee/circular-details'], {
        queryParams: {
          circularId: id
        }
      });
    }
  });
}




  viewCircular(circular: Circulars) {
    const data = {
      circularId: circular.circular_id,
      employeeId: this.employeeData.id,
    };
    if (circular.is_seen) {
      this.router.navigate(['employee/circular-details'], {
        queryParams: { circularId: circular.circular_id },
      });
    } else {
      this.circularService.markCircularAsSeenForEmp(data).subscribe(
        (res: any) => {
          console.log('marked as seen!!!!!!! ', res);
          this.router.navigate(['employee/circular-details'], {
            queryParams: { circularId: circular.circular_id },
          });
        },
        (error) => {
          console.error('Error marking as seen:', error);
        },
      );
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

  // navigateToAction(route: string) {
  //   this.router.navigate([route]);
  //   console.log('Navigating to:', route);
  // }

  navigateToAction(route: string) {
    this.router.navigateByUrl(route);
    console.log('Navigating to:', route);
  }

  // formatDate(date: Date): string {
  //   return new Intl.DateTimeFormat('en-US', {
  //     month: 'short',
  //     day: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit',
  //   }).format(date);
  // }
  formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }
}
