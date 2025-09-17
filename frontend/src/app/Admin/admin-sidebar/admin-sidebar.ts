import { CommonModule, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  imports: [CommonModule, NgIf, RouterModule, MatIconModule],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss',
})
export class AdminSidebar {
  isSidebarOpen = false; // desktop hover
  isMobileOpen = false; // mobile overlay toggle

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
