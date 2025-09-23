import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuth } from '../../services/admin-auth';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-unauthorized-page',
  imports: [CommonModule],
  templateUrl: './unauthorized-page.html',
  styleUrl: './unauthorized-page.scss'
})
export class UnauthorizedPage {
 currentUser: any;

  constructor(
    private location: Location,
    private router: Router,
    private authService: AdminAuth
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  goBack(): void {
    // Use Location service to go back in history
    this.location.back();
  }

  goToDashboard(): void {
    this.router.navigate(['/admin/admin-dashboard']);
  }

  getCurrentRole(): string {
    const role = this.authService.getRole();
    if (!role) return 'Unknown';
    
    // Format role for display
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}
