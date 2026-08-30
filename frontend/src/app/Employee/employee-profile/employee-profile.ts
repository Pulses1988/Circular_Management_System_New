import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// import { EmployeeService } from '../services/employee.service'; // Change path if needed
import { EmployeeService } from '../../services/employee-service';
@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './employee-profile.html',
  styleUrl: './employee-profile.scss'
})
export class EmployeeProfile implements OnInit {

  employee: any;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.employeeService.getMyProfile().subscribe({
      next: (response: any) => {
        this.employee = response.data;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
}