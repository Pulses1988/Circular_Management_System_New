import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { CircularService } from '../../../services/circular-service';
import { EmployeeService } from '../../../services/employee-service';

@Component({
  selector: 'app-report-activity-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './report-activity-summary.html',
  styleUrl: './report-activity-summary.scss'
})
export class ReportActivitySummary  implements OnInit {

  // ==========================================
  // Current Logged-in Employee
  // ==========================================

  currentEmployee: any = null;


  // ==========================================
  // Summary Statistics
  // ==========================================

  totalCirculars = 0;
  readCirculars = 0;
  unreadCirculars = 0;
  compliance = 0;

  approvedCount = 0;
  rejectedCount = 0;
  pendingApprovalCount = 0;


  // ==========================================
  // Activity Data
  // ==========================================

  activityData: any[] = [];
  approvalData: any[] = [];


  // ==========================================
  // Loading State
  // ==========================================

  isLoading = false;


  constructor(
    private circularService: CircularService,
    private employeeService: EmployeeService,
    private router: Router
  ) {}


  // ==========================================
  // Initialization
  // ==========================================

  ngOnInit(): void {

    this.currentEmployee =
      this.employeeService.getCurrentEmployee();

    console.log(
      'CURRENT EMPLOYEE:',
      this.currentEmployee
    );


    if (!this.currentEmployee) {

      console.error(
        'Current employee not found.'
      );

      return;
    }


    this.loadActivitySummary();

    this.loadActivityDetails();

    this.loadApprovalData();

  }


  // ==========================================
  // Load Summary Statistics
  // ==========================================

  loadActivitySummary(): void {

    const employeeId =
      this.currentEmployee.id;


    this.circularService
      .getStatistics(employeeId)
      .subscribe({

        next: (response: any) => {

          console.log(
            'ACTIVITY STATISTICS:',
            response
          );


          this.totalCirculars =
            response.totalCirculars || 0;


          this.readCirculars =
            response.readCirculars || 0;


          this.unreadCirculars =
            response.unreadCirculars || 0;


          this.compliance =
            response.compliance || 0;

        },


        error: (error) => {

          console.error(
            'Error loading activity statistics:',
            error
          );

        }

      });

  }


  // ==========================================
  // Load Circular Activity Details
  // ==========================================

  loadActivityDetails(): void {

    const employeeId =
      this.currentEmployee.id;


    this.isLoading = true;


    this.circularService
      .fetchAllCircularsWithTrackingDetailsByEmpId(
        employeeId
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'ACTIVITY DETAILS:',
            response
          );


          const data =
            response.data || [];


          // Convert circular data into
          // activity-summary table format

          this.activityData =
            data.map(
              (item: any) => ({

                circular_id:
                  item.circular_id ||
                  item.id,


                circular_code:
                  item.circular_code || '-',


                title:
                  item.title || '-',


                priority:
                  item.priority || '-',


                activity:
                  item.seen_at
                    ? 'Read Circular'
                    : 'Circular Received',


                read_status:
                  item.seen_at
                    ? 'Read'
                    : 'Unread',


                status:
                  item.seen_at
                    ? 'Completed'
                    : 'Pending',


                activity_date:
                  item.seen_at ||
                  item.created_at ||
                  item.createdAt ||
                  item.published_at ||
                  item.effective_from ||
                  null

              })
            );


          console.log(
            'FORMATTED ACTIVITY DATA:',
            this.activityData
          );


          this.isLoading = false;

        },


        error: (error) => {

          console.error(
            'Error loading activity details:',
            error
          );

          this.isLoading = false;

        }

      });

  }


  // ==========================================
  // Load Approval Activity
  // ==========================================

  loadApprovalData(): void {

    const employeeId =
      this.currentEmployee.id;


    this.circularService
      .getCircularApprovalDataById(
        employeeId
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'APPROVAL DATA:',
            response
          );


          this.approvalData =
            Array.isArray(response)
              ? response
              : response.data || [];


          // Approved

          this.approvedCount =
            this.approvalData.filter(
              (item: any) =>

                item.status
                  ?.toString()
                  .toUpperCase() ===
                'APPROVED'

            ).length;


          // Rejected

          this.rejectedCount =
            this.approvalData.filter(
              (item: any) =>

                item.status
                  ?.toString()
                  .toUpperCase() ===
                'REJECTED'

            ).length;


          // Pending

          this.pendingApprovalCount =
            this.approvalData.filter(
              (item: any) => {

                const status =
                  item.status
                    ?.toString()
                    .toUpperCase();


                return (
                  status === 'PENDING' ||
                  status === 'PENDING_APPROVAL'
                );

              }

            ).length;


          console.log(
            'APPROVED:',
            this.approvedCount
          );

          console.log(
            'REJECTED:',
            this.rejectedCount
          );

          console.log(
            'PENDING:',
            this.pendingApprovalCount
          );

        },


        error: (error) => {

          console.error(
            'Error loading approval data:',
            error
          );

        }

      });

  }


  // ==========================================
  // Get Employee Full Name
  // ==========================================

  getEmployeeName(): string {

    if (!this.currentEmployee) {
      return '-';
    }


    return [

      this.currentEmployee.first_name,

      this.currentEmployee.middle_name,

      this.currentEmployee.last_name

    ]
      .filter(Boolean)
      .join(' ');

  }


  // ==========================================
  // Get Employee Location
  // ==========================================

  getEmployeeLocation(): string {

    if (!this.currentEmployee) {
      return '-';
    }


    return (

      this.currentEmployee.branch_name ||

      this.currentEmployee.head_office_name ||

      '-'

    );

  }


  // ==========================================
  // View Circular
  // ==========================================

  viewCircular(
    circularId: number
  ): void {

    this.router.navigate(
      ['/employee/circular-details'],
      {

        queryParams: {

          circularId:
            circularId

        }

      }
    );

  }

}