import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterModule
} from '@angular/router';
import { MatIcon } from '@angular/material/icon';

import { HoAssignmentService } from '../../services/ho-assignment';
import { EmployeeService } from '../../services/employee-service';

@Component({
  selector: 'app-filtered-ho-assignments',
  imports: [
    CommonModule,
    RouterModule,
    MatIcon
  ],
  templateUrl: './filtered-ho-assignments.html',
  styleUrl: './filtered-ho-assignments.scss'
})
export class FilteredHoAssignments {

  isDarkMode = false;

  filterType = 'unread';

  assignments: any[] = [];

  isLoading = false;


  /* =========================================
     VIEW ASSIGNMENT POPUP
  ========================================= */

  isViewModalOpen = false;

  selectedAssignment: any = null;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hoAssignmentService: HoAssignmentService,
    private employeeService: EmployeeService
  ) {}


  ngOnInit(): void {

    this.loadTheme();

    this.route.queryParams.subscribe(params => {

      this.filterType =
        params['type'] || 'unread';

      console.log(
        'HO Assignment filter:',
        this.filterType
      );

      this.loadFilteredAssignments();

    });

  }


  /* =========================================
     THEME
  ========================================= */

  private loadTheme(): void {

    const savedTheme =
      localStorage.getItem('hoAssignmentTheme');

    this.isDarkMode =
      savedTheme === 'dark';

  }


  toggleTheme(): void {

    this.isDarkMode =
      !this.isDarkMode;

    localStorage.setItem(
      'hoAssignmentTheme',
      this.isDarkMode
        ? 'dark'
        : 'light'
    );

  }


  /* =========================================
     GET LOGGED-IN EMPLOYEE
  ========================================= */

  private getCurrentEmployeeId(): number | null {

    const employee =
      this.employeeService.getCurrentEmployee();

    console.log(
      'Logged-in employee:',
      employee
    );

    if (
      !employee ||
      employee.id === undefined ||
      employee.id === null
    ) {

      console.error(
        'Logged-in employee ID not found.'
      );

      return null;

    }

    return Number(employee.id);

  }


  /* =========================================
     LOAD FILTERED ASSIGNMENTS
  ========================================= */

  private loadFilteredAssignments(): void {

    const employeeId =
      this.getCurrentEmployeeId();

    console.log(
      'Loading filtered HO Assignments for employee:',
      employeeId
    );

    if (!employeeId) {

      this.assignments = [];

      return;

    }

    this.isLoading = true;

    this.hoAssignmentService
      .getHOAssignmentsByEmployeeId(employeeId)
      .subscribe({

        next: (response: any) => {

          console.log(
            'HO Assignment response:',
            response
          );

          let allAssignments: any[] = [];


          if (Array.isArray(response)) {

            allAssignments =
              response;

          }

          else if (
            Array.isArray(response?.assignments)
          ) {

            allAssignments =
              response.assignments;

          }

          else if (
            Array.isArray(response?.data)
          ) {

            allAssignments =
              response.data;

          }


          console.log(
            'All employee assignments:',
            allAssignments
          );


          /* =====================================
             UNREAD
          ===================================== */

          if (this.filterType === 'unread') {

            this.assignments =
              allAssignments.filter(
                (assignment: any) =>
                  assignment.is_seen === 0 ||
                  assignment.is_seen === false
              );

          }


          /* =====================================
             READ
          ===================================== */

          else if (this.filterType === 'read') {

            this.assignments =
              allAssignments.filter(
                (assignment: any) =>
                  assignment.is_seen === 1 ||
                  assignment.is_seen === true
              );

          }


          /* =====================================
             URGENT
          ===================================== */

          else if (this.filterType === 'urgent') {

            this.assignments =
              allAssignments.filter(
                (assignment: any) =>
                  String(
                    assignment.priority || ''
                  ).toUpperCase() === 'URGENT'
              );

          }


          /* =====================================
             DEFAULT
          ===================================== */

          else {

            this.assignments =
              allAssignments;

          }


          console.log(
            'Filtered HO Assignments:',
            this.assignments
          );

          console.log(
            'Filtered count:',
            this.assignments.length
          );

          this.isLoading = false;

        },

        error: (error) => {

          console.error(
            'Error loading filtered HO Assignments:',
            error
          );

          this.assignments = [];

          this.isLoading = false;

        }

      });

  }


  /* =========================================
     FILTER TITLE
  ========================================= */

  getPageTitle(): string {

    if (this.filterType === 'urgent') {

      return 'Urgent HO Assignments';

    }

    if (this.filterType === 'read') {

      return 'Read HO Assignments';

    }

    return 'Unread HO Assignments';

  }


  getPageDescription(): string {

    if (this.filterType === 'urgent') {

      return 'View urgent Head Office assignments';

    }

    if (this.filterType === 'read') {

      return 'View read Head Office assignments';

    }

    return 'View unread Head Office assignments';

  }


  getEmptyTitle(): string {

    if (this.filterType === 'urgent') {

      return 'No Urgent Assignments';

    }

    if (this.filterType === 'read') {

      return 'No Read Assignments';

    }

    return 'No Unread Assignments';

  }


  /* =========================================
     CREATE
  ========================================= */

  createAssignment(): void {

    this.router.navigate([
      '/employee/ho-assignment-creater'
    ]);

  }


  /* =========================================
     VIEW ASSIGNMENT
  ========================================= */

  viewAssignment(
    assignment: any
  ): void {

    console.log(
      'View HO Assignment:',
      assignment
    );

    console.log(
      'Current filterType:',
      this.filterType
    );


    /*
     * Store selected assignment.
     */

    this.selectedAssignment =
      assignment;


    /*
     * Open popup immediately.
     */

    this.isViewModalOpen =
      true;


    /*
     * If assignment is unread,
     * mark it as read.
     */

    if (
      assignment.is_seen === false ||
      assignment.is_seen === 0
    ) {

      this.markAsRead(assignment);

    }

  }


  /* =========================================
     CLOSE VIEW POPUP
  ========================================= */

  closeViewModal(): void {

    this.isViewModalOpen =
      false;

    this.selectedAssignment =
      null;

  }


  /* =========================================
     MARK AS READ
  ========================================= */

  markAsRead(
    assignment: any
  ): void {

    const employeeId =
      this.getCurrentEmployeeId();


    if (!employeeId) {

      console.error(
        'Cannot mark assignment as read because employee ID is missing.'
      );

      return;

    }


    if (!assignment?.assignment_id) {

      console.error(
        'Cannot mark assignment as read because assignment ID is missing.',
        assignment
      );

      return;

    }


    console.log(
      'Marking HO Assignment as read:',
      assignment.assignment_id,
      'Employee:',
      employeeId
    );


    this.hoAssignmentService
      .markAssignmentAsSeen(
        Number(assignment.assignment_id),
        employeeId
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'Assignment marked as read successfully:',
            response
          );


          /*
           * Update assignment object.
           */

          assignment.is_seen =
            true;


          /*
           * Keep popup assignment updated.
           */

          if (
            this.selectedAssignment &&
            Number(
              this.selectedAssignment.assignment_id
            ) ===
            Number(
              assignment.assignment_id
            )
          ) {

            this.selectedAssignment.is_seen =
              true;

          }


          /*
           * Remove assignment from
           * the current Unread list.
           *
           * IMPORTANT:
           * The popup is NOT closed here.
           */

          if (
            this.filterType === 'unread'
          ) {

            console.log(
              'Removing assignment from Unread list:',
              assignment.assignment_id
            );

            this.assignments =
              this.assignments.filter(
                (item: any) =>
                  Number(
                    item.assignment_id
                  ) !==
                  Number(
                    assignment.assignment_id
                  )
              );


            console.log(
              'Updated Unread assignments:',
              this.assignments
            );

          }

        },

        error: (error) => {

          console.error(
            'Error marking HO Assignment as read:',
            error
          );

        }

      });

  }


}