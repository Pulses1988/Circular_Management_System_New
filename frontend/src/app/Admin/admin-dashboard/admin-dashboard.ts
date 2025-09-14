import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  imports: [MatIconModule,CommonModule,NgIf],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard {
    isHoAdmin = false; // Dynamically set based on login or user data
  totalDepartments = 12;
  totalBranches = 5;
  totalEmployees = 150;

}
