import { CommonModule, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

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
export class AdminSidebar {
  isSidebarOpen = false; // desktop hover
  isMobileOpen = false; // mobile overlay toggle

  role: string | null = localStorage.getItem('role');

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'home', route: '/admin-dashboard' },
    {
      label: 'Department Management',
      icon: 'calendar_view_week',
      route: '/admin-department-manegement',
    },
    {
      label: 'Branch Management',
      icon: 'account_tree',
      route: '/admin-branch',
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
}
