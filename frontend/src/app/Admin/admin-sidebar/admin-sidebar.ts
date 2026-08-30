import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AdminAuth } from '../../services/admin-auth';
import { LogoutConfirmation } from '../logout-confirmation/logout-confirmation';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-admin-sidebar',
  imports: [CommonModule, NgIf, RouterModule, MatIconModule],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss',
})
export class AdminSidebar implements OnInit {
  isSidebarOpen = false; // desktop hover
  isMobileOpen = false; // mobile overlay toggle

  role?: string | null;

  constructor( private dialog: MatDialog,
  private authService: AdminAuth){}

  ngOnInit(){
    if (typeof window !== 'undefined') {
      this.role= localStorage.getItem('role');
    }
  }

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'home', route: '/admin/admin-dashboard' },
    {
      label: 'Department Management',
      icon: 'calendar_view_week',
      route: '/admin/admin-department-management',
    }, 
    {
  label: 'Head Office Management',
  icon: 'business',
  route: '/admin/admin-head-office',
  roles: ['HO_ADMIN'],
},
{
  label: 'Region Management',
  icon: 'public',
  route: '/admin/admin-region',
  roles: ['HO_ADMIN'],
},

{
  label: 'Zone Management',
  icon: 'location_city',
  route: '/admin/admin-zone',
  roles: ['HO_ADMIN'],
},
{
  label: 'Circle Management',
  icon: 'hub',
  route: '/admin/admin-circle',
  roles: ['HO_ADMIN'],
},

    {
      label: 'Branch Management',
      icon: 'account_tree',
      route: '/admin/admin-branch',
      roles: ['HO_ADMIN'],
    },
    {
      label: 'Role Management',
      icon: 'assignment_ind',
      route: '/admin/admin-role-management',
      roles: ['HO_ADMIN','BRANCH_ADMIN'],
    },
    {
      label: 'Employee Management',
      icon: 'manage_accounts',
      route: '/admin/admin-employee-management',
      roles: ['HO_ADMIN','BRANCH_ADMIN'],
    },
    {
      label: 'Circular Settings',
      icon: 'edit_document',
      route: '/admin/admin-circular-settings',
      roles: ['HO_ADMIN','BRANCH_ADMIN'],
    },
    {
      label: 'Rule Engine', icon: 'settings_suggest', route: '/admin/rule-engine',
      roles: ['HO_ADMIN', 'BRANCH_ADMIN'],
    },
    {
  label: 'Committee Management',
  icon: 'groups',
  route: '/admin/admin-committee',
  roles: ['HO_ADMIN'],
},
  ];

  get filteredNavItems(): NavItem[] {
    return this.navItems.filter((item) => !item.roles || item.roles.includes(this.role || ''));
  }

  toggleMobileSidebar() {
    this.isMobileOpen = !this.isMobileOpen;
  }

  expandSidebar() {
    this.isSidebarOpen = true;
  }

  collapseSidebar() {
    this.isSidebarOpen = false;
  }
  openLogoutDialog(): void {
  const dialogRef = this.dialog.open(LogoutConfirmation, {
    width: '350px',
    disableClose: false,
    hasBackdrop: true,
    backdropClass: 'logout-dialog-backdrop',
    panelClass: 'logout-dialog-panel'
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result === true) {
      this.performLogout();
    }
  });
}
private performLogout(): void {
  this.authService.logout();
}
}
