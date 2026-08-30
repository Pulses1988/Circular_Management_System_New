import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EmployeeService } from '../../services/employee-service';
import { CircularService } from '../../services/circular-service';


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
  queryParams?: any;
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
  // chnage 
  encapsulation: ViewEncapsulation.None ,
})
export class EmployeeSidebar implements OnInit, OnDestroy {
  isSidebarOpen = false;
  isMobileOpen = false;
  private subscriptions: Subscription[] = [];
  employeeData!: EmployeeData;
  isDarkMode: boolean | undefined;

  constructor(private router: Router, private dialog: MatDialog, private employeeService: EmployeeService, private circular:CircularService  ) {

  }

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
      route: '/employee/all-circulars',
      badge: this.circularStats.unseen,
      badgeType: 'urgent',
      subItems: [
        {
          label: 'All Circulars',
          icon: 'list_alt',
          route: '/employee/all-circulars',
        },
        {
          label: 'Unread',
          icon: 'visibility_off',
          route: '/employee/filtered-circulars',
          // badge: this.circularStats.unseen,
          queryParams: { type: 'unread' }
        },
        {
          label: 'Urgent',
          icon: 'priority_high',
          route: '/employee/filtered-circulars',
          // badge: this.circularStats.urgent,
          queryParams: { type: 'urgent' }
        },
         {
          label: 'Create Circulars',
          icon: 'assignment',
          route: '/employee/circular-creater',
        },
        {
         label: 'Circular-Approve',
         icon: 'fact_check',
         route: '/employee/circular-approval',
        },
      ],
    },
    {
      label: 'My Profile',
      icon: 'account_circle',
      route: '/employee/profile',
      subItems: [
        // {
        //   label: 'Personal Info',
        //   icon: 'person',
        //   route: '/employee/profile/personal',
        // },
        // {
        //   label: 'Security Settings',
        //   icon: 'security',
        //   route: '/employee/profile/security',
        // },
        // {
        //   label: 'Preferences',
        //   icon: 'settings',
        //   route: '/employee/profile/preferences',
        // }, 

          {
      label: 'Personal Info',
      icon: 'person',
      route: '/employee/profile',
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
  route: '/employee/reading-history',
},
      {
      label: 'Activity Summary',
      icon: 'summarize',
      route: '/employee/report-activity-summary',
    }, 
         {
      label: 'Event Log',
      icon: 'history',
      route: '/employee/event-log',
    },
   {
  label: 'Rule Execution History',
  icon: 'history',
  route: '/employee/rule-execution-history',
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
    this.detectSystemDarkMode();
    this.loadEmployeeData();
    this.loadCircularStats();
  }
  detectSystemDarkMode(): void {
    if (!this.circular.isBrowser()) return 
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  this.isDarkMode = prefersDark;

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    this.isDarkMode = e.matches;
  });
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
      this.employeeService.logout();
    }
  }

  // logout(): void {
  //   // Implement your logout logic here
  //   // Clear localStorage/sessionStorage
  //   localStorage.removeItem('token');
  //   localStorage.removeItem('user');
  //   localStorage.clear();
  //   // Navigate to login page
  //   this.router.navigate(['/employee-login']);
  // }

   

 async loadEmployeeData() {
    this.employeeData = await this.employeeService.getCurrentEmployee();
    console.log(this.employeeData,'from side bar')

    this.updateCircularPermission();
  }

  updateCircularPermission() {
  const circularMenu = this.employeeNavItems.find(item => item.label === 'Circulars');

  if (circularMenu && circularMenu.subItems) {
    circularMenu.subItems = circularMenu.subItems.filter(sub => {

      if (sub.label === 'Circular-create' && this.employeeData.can_create_circular !== 1) {
        return false;
      }

      if (sub.label === 'Circular-approve' && this.employeeData.can_approve_circular !== 1) {
        return false;
      }

      return true;
    });
  }
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
