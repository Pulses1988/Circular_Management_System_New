import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number | string;
  badgeType?: 'urgent' | 'info' | 'success';
  exact?: boolean;
  isActive?: boolean;
  subItems?: SubNavItem[];
}

interface SubNavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number | string;
}

interface CircularStats {
  total: number;
  seen: number;
  unseen: number;
  urgent: number;
}

interface CurrentEmployee {
  name: string;
  department: string;
  employeeId: string;
  role: string;
  branch: string;
}

@Component({
  selector: 'app-employee-sidebar',
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './employee-sidebar.html',
  styleUrl: './employee-sidebar.scss',
})
export class EmployeeSidebar implements OnInit, OnDestroy {
  isSidebarOpen = false;
  isMobileOpen = false;
  private subscriptions: Subscription[] = [];

  constructor(private router: Router, private dialog: MatDialog) {}

  currentEmployee: CurrentEmployee = {
    name: 'John Doe',
    department: 'Finance Department',
    employeeId: 'EMP001',
    role: 'Senior Analyst',
    branch: 'Main Branch',
  };

  circularStats: CircularStats = {
    total: 25,
    seen: 18,
    unseen: 7,
    urgent: 3,
  };

  employeeNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/employee/employee-dashboard',
      exact: true,
      badgeType: 'info',
    },
    {
      label: 'Circulars',
      icon: 'article',
      route: '/employee/circulars',
      badge: this.circularStats.unseen,
      badgeType: 'urgent',
      subItems: [
        {
          label: 'All Circulars',
          icon: 'list_alt',
          route: '/employee/circulars/all',
        },
        {
          label: 'Unread',
          icon: 'visibility_off',
          route: '/employee/circulars/unread',
          badge: this.circularStats.unseen,
        },
        {
          label: 'Urgent',
          icon: 'priority_high',
          route: '/employee/circulars/urgent',
          badge: this.circularStats.urgent,
        },
        {
          label: 'Archived',
          icon: 'archive',
          route: '/employee/circulars/archived',
        },
      ],
    },
    {
      label: 'Notifications',
      icon: 'notifications',
      route: '/employee/notifications',
      badge: 5,
      badgeType: 'info',
    },
    {
      label: 'My Profile',
      icon: 'account_circle',
      route: '/employee/profile',
      subItems: [
        {
          label: 'Personal Info',
          icon: 'person',
          route: '/employee/profile/personal',
        },
        {
          label: 'Security Settings',
          icon: 'security',
          route: '/employee/profile/security',
        },
        {
          label: 'Preferences',
          icon: 'settings',
          route: '/employee/profile/preferences',
        },
      ],
    },
    {
      label: 'Reports',
      icon: 'assessment',
      route: '/employee/reports',
      subItems: [
        {
          label: 'Reading History',
          icon: 'history',
          route: '/employee/reports/reading-history',
        },
        {
          label: 'Activity Summary',
          icon: 'summarize',
          route: '/employee/reports/activity',
        },
      ],
    },
    {
      label: 'Help & Support',
      icon: 'help_center',
      route: '/employee/support',
      subItems: [
        {
          label: 'FAQ',
          icon: 'quiz',
          route: '/employee/support/faq',
        },
        {
          label: 'Contact Support',
          icon: 'contact_support',
          route: '/employee/support/contact',
        },
        {
          label: 'User Guide',
          icon: 'menu_book',
          route: '/employee/support/guide',
        },
      ],
    },
    {
      label: 'Settings',
      icon: 'settings',
      route: '/employee/settings',
    },
  ];

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  ngOnInit(): void {
    this.loadEmployeeData();
    this.loadCircularStats();
  }

  expandSidebar(): void {
    this.isSidebarOpen = true;
  }

  collapseSidebar(): void {
    this.isSidebarOpen = false;
  }
  toggleMobileSidebar(): void {
    this.isMobileOpen = !this.isMobileOpen;

    // Prevent body scroll when mobile sidebar is open
    if (this.isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  handleMobileNavClick(item: NavItem): void {
    if (!item.subItems) {
      this.toggleMobileSidebar();
    }
  }

  openLogoutDialog(): void {
    // Replace this with your logout dialog component
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      this.logout();
    }
  }

  logout(): void {
    // Implement your logout logic here
    // Clear localStorage/sessionStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Navigate to login page
    this.router.navigate(['/login']);
  }

  private loadEmployeeData(): void {
    // Replace with actual service call
    // const sub = this.employeeService.getCurrentEmployee().subscribe(
    //   (employee) => {
    //     this.currentEmployee = employee;
    //   }
    // );
    // this.subscriptions.push(sub);
  }

  private loadCircularStats(): void {
    // Replace with actual service call
    // const sub = this.circularService.getStats().subscribe(
    //   (stats) => {
    //     this.circularStats = stats;
    //     this.updateBadgeCounts();
    //   }
    // );
    // this.subscriptions.push(sub);
  }

  // private updateBadgeCounts(): void {
  //   // Update navigation item badges based on current stats
  //   const circularItem = this.employeeNavItems.find((item) => item.label === 'Circulars');
  //   if (circularItem) {
  //     circularItem.badge = this.circularStats.unseen;

  //     if (circularItem.subItems) {
  //       const unreadItem = circularItem.subItems.find((sub) => sub.label === 'Unread');
  //       const urgentItem = circularItem.subItems.find((sub) => sub.label === 'Urgent');

  //       if (unreadItem) unreadItem.badge = this.circularStats.unseen;
  //       if (urgentItem) urgentItem.badge = this.circularStats.urgent;
  //     }
  //   }
  // }

  // Utility method to check if current route matches nav item
  // isRouteActive(route: string): boolean {
  //   return this.router.url.includes(route);
  // }

  // Method to handle navigation with analytics
  navigateTo(route: string): void {
    // Add analytics tracking if needed
    // this.analyticsService.track('navigation', { route });

    // this.router.navigate([route]);

    // Close mobile sidebar after navigation
    if (this.isMobileOpen) {
      this.toggleMobileSidebar();
    }
  }
}
