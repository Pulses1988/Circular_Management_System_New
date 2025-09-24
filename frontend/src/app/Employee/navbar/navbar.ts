import { Component } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
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
  bank_name:string
}
@Component({
  selector: 'app-navbar',
  imports: [MatIconModule,MatBadgeModule,MatCardModule,MatButtonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  circularStats: CircularStats = {
    total: 45,
    seen: 32,
    unseen: 13,
    urgent: 3
  };

  employeeData: EmployeeData = {
  id: 0,
  first_name: '',
  last_name: '',
  role_name: '',
  department_name: null,
  branch_name: null,
  head_office_name: null,
  employee_id: '',
  can_approve_circular: 0,
  can_create_circular: 0,
  bank_name: ''
};

  constructor(private employeService:EmployeeService){}

  ngOnInit(){
    this.loadEmployee();
  }
  loadEmployee(){
    this.employeeData=this.employeService.getCurrentEmployee();
  }
}
