import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { EmployeeService } from '../../services/employee-service';
import { Subject, takeUntil } from 'rxjs';
import { CircularService } from '../../services/circular-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';

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
  bank_name: string;
}

interface Notification {
  notification_id: number;
  circular_id: number;
  notification_type: string;
  message_preview: string;
  circular_title: string;
  circular_code: string;
  sender_first_name: string;
  sender_last_name: string;
  created_at: string;
}
@Component({
  selector: 'app-navbar',
   standalone: true,
  imports: [MatIconModule, MatBadgeModule, MatCardModule, MatButtonModule, MatMenuModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit, OnDestroy {

employeeData!: EmployeeData;
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;
  hasNewNotification: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private employeeService: EmployeeService,
    private circularService: CircularService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEmployee();
  }

  async loadEmployee() {
    this.employeeData = await this.employeeService.getCurrentEmployee();
    
    if (this.employeeData) {
      this.loadNotifications();
      this.subscribeToNotifications();
    }
  }

  loadNotifications() {
    this.circularService.getUnreadNotifications(this.employeeData.id).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.unreadCount = notifications.length;
      },
      error: (err) => console.error('Error loading notifications:', err)
    });
  }

  subscribeToNotifications() {
    this.circularService.subscribeToNotifications(this.employeeData.id);
    
    this.circularService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        this.unreadCount++;
        this.hasNewNotification = true;
        this.loadNotifications();
        
        // Remove animation after 3 seconds
        setTimeout(() => {
          this.hasNewNotification = false;
        }, 3000);
      });
  }

  @HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const clickedInside = target.closest('.notification-container');
  
  if (!clickedInside && this.showNotifications) {
    this.showNotifications = false;
  }
}

toggleNotifications(event: MouseEvent) {
  event.stopPropagation(); // Prevent immediate closing
  this.showNotifications = !this.showNotifications;
}

  openCircular(notification: Notification) {
    // Mark as read
    this.circularService.markNotificationAsRead(notification.notification_id).subscribe({
      next: () => {
        this.unreadCount--;
        this.router.navigate(['/employee/circular-details'], {
          queryParams: { circularId: notification.circular_id }
        });
        this.showNotifications = false;
        this.loadNotifications();
      },
      error: (err) => console.error('Error marking notification as read:', err)
    });
  }

  markAllAsRead() {
    this.circularService.markAllNotificationsAsRead(this.employeeData.id).subscribe({
      next: () => {
        this.unreadCount = 0;
        this.loadNotifications();
      },
      error: (err) => console.error('Error marking all as read:', err)
    });
  }

  getNotificationIcon(type: string): string {
    return type === 'message' ? 'message' : 'attachment';
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
