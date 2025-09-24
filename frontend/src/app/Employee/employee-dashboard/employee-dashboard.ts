import { Component } from '@angular/core';
import { CommonModule, NumberSymbol } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { EmployeeService } from '../../services/employee-service';

interface CircularStats {
  total: number;
  seen: number;
  unseen: number;
  urgent: number;
}

interface EmployeeData{
  id:Number
  first_name:string,
  last_name:string,
  role_name:string,
  department_name:string | null,
  branch_name:string | null,
  head_office_name: string | null,
  employee_id:string,
  can_approve_circular: number
  can_create_circular: number
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
  styleUrl: './employee-dashboard.scss'
})
export class EmployeeDashboard {
  currentEmployee = {
    name: 'Rohit Chougale',
    employeeId: 'EMP001',
    role: 'Senior Analyst',
    department: 'Finance',
    branch: 'Main Branch',
    avatar: ''
  };

  circularStats: CircularStats = {
    total: 45,
    seen: 32,
    unseen: 13,
    urgent: 3
  };

  recentCirculars: RecentCircular[] = [
    {
      id: 1,
      title: 'New Banking Regulations - Compliance Update',
      department: 'Compliance',
      date: new Date('2024-01-15'),
      priority: 'urgent',
      isRead: false
    },
    {
      id: 2,
      title: 'Q1 Financial Review Meeting Schedule',
      department: 'Finance',
      date: new Date('2024-01-14'),
      priority: 'high',
      isRead: false
    },
    {
      id: 3,
      title: 'IT Security Policy Updates',
      department: 'IT Department',
      date: new Date('2024-01-13'),
      priority: 'medium',
      isRead: true
    },
    {
      id: 4,
      title: 'Employee Benefits Enrollment Period',
      department: 'HR',
      date: new Date('2024-01-12'),
      priority: 'medium',
      isRead: true
    },
    {
      id: 5,
      title: 'Branch Holiday Schedule 2024',
      department: 'Administration',
      date: new Date('2024-01-10'),
      priority: 'low',
      isRead: true
    }
  ];

  quickActions: QuickAction[] = [
    {
      icon: 'article',
      title: 'All Circulars',
      description: 'View all department circulars',
      route: '/employee/circulars',
      color: 'bg-blue-500'
    },
    {
      icon: 'mark_email_unread',
      title: 'Unread Items',
      description: 'Check unread notifications',
      route: '/employee/unread',
      color: 'bg-red-500'
    },
    {
      icon: 'schedule',
      title: 'My Schedule',
      description: 'View upcoming events',
      route: '/employee/schedule',
      color: 'bg-green-500'
    },
    {
      icon: 'person',
      title: 'My Profile',
      description: 'Update personal information',
      route: '/employee/profile',
      color: 'bg-purple-500'
    }
  ];

  employeeData!:EmployeeData;

  constructor(
    private employeeService: EmployeeService
  ){}

  ngOnInit() {
    this.loadEmployeeData();
  }

  loadEmployeeData() {
    // Load employee data from service
    this.employeeData=this.employeeService.getCurrentEmployee()
    console.log('Loading employee dashboard data...',this.employeeData);
  }

  getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return 'text-red-700 bg-red-100 border-red-300';
    case 'high': return 'text-orange-700 bg-orange-100 border-orange-300';
    case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    case 'low': return 'text-green-700 bg-green-100 border-green-300';
    default: return 'text-gray-700 bg-gray-100 border-gray-300';
  }
}

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'check_circle';
      default: return 'info';
    }
  }
  // Add these methods to your EmployeeDashboardComponent class

getPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-600';
    case 'high': return 'bg-orange-100 text-orange-600';
    case 'medium': return 'bg-yellow-100 text-yellow-600';
    case 'low': return 'bg-green-100 text-green-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

getPriorityTextClass(priority: string): string {
  switch (priority) {
    case 'urgent': return 'bg-red-50 text-red-700';
    case 'high': return 'bg-orange-50 text-orange-700';
    case 'medium': return 'bg-yellow-50 text-yellow-700';
    case 'low': return 'bg-green-50 text-green-700';
    default: return 'bg-gray-50 text-gray-700';
  }
}

  markAsRead(circularId: number) {
    const circular = this.recentCirculars.find(c => c.id === circularId);
    if (circular && !circular.isRead) {
      circular.isRead = true;
      this.circularStats.seen++;
      this.circularStats.unseen--;
    }
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
      minute: '2-digit'
    }).format(date);
  }

}
