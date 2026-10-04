import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HoAssignmentService } from '../../services/ho-assignment';

@Component({
  selector: 'app-all-ho-assignments',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './all-ho-assignments.html',
  styleUrl: './all-ho-assignments.scss'
})
export class AllHoAssignments {

  // ================================
  // Theme
  // ================================

  isDarkMode = false;


  // ================================
  // Loading
  // ================================

  isLoading = false;


  // ================================
  // HO Assignments
  // ================================

  assignments: any[] = [];


  // ================================
  // View Assignment Popup
  // ================================

  isViewModalOpen = false;

  selectedAssignment: any = null;


  // ================================
  // Constructor
  // ================================

  constructor(
    private router: Router,
    private hoAssignmentService: HoAssignmentService
  ) {}


  // ================================
  // On Init
  // ================================

  ngOnInit(): void {

    this.loadTheme();

    this.loadMyHOAssignments();

  }


  // ================================
  // Theme
  // ================================

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


  // ================================
  // Get Logged-In Employee ID
  // ================================

  private decryptData(
    encryptedData: string
  ): string {

    try {

      return decodeURIComponent(
        atob(encryptedData)
      );

    } catch (error) {

      console.error(
        'Error decrypting employee data:',
        error
      );

      return '';

    }

  }


  private getCurrentEmployeeId():
    number | null {

    if (
      typeof window === 'undefined'
    ) {

      return null;

    }


    const encryptedUser =
      localStorage.getItem('emp_user');


    if (!encryptedUser) {

      console.error(
        'Logged-in employee data not found in emp_user.'
      );

      return null;

    }


    try {

      const decryptedUser =
        this.decryptData(
          encryptedUser
        );


      if (!decryptedUser) {

        console.error(
          'Unable to decrypt emp_user.'
        );

        return null;

      }


      const employee =
        JSON.parse(
          decryptedUser
        );


      console.log(
        'Logged-in employee:',
        employee
      );


      if (
        employee?.id === undefined ||
        employee?.id === null
      ) {

        console.error(
          'Employee ID not found in emp_user.'
        );

        return null;

      }


      return Number(
        employee.id
      );

    } catch (error) {

      console.error(
        'Unable to read logged-in employee:',
        error
      );

      return null;

    }

  }


  // ================================
  // Load HO Assignments
  // Assigned To Logged-In Employee
  // ================================

  private loadMyHOAssignments(): void {

    const employeeId =
      this.getCurrentEmployeeId();


    console.log(
      'Loading HO Assignments for employee ID:',
      employeeId
    );


    if (!employeeId) {

      console.error(
        'Cannot load HO Assignments because employee ID is missing.'
      );

      return;

    }


    this.isLoading = true;


    this.hoAssignmentService
      .getHOAssignmentsByEmployeeId(
        employeeId
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'HO Assignment response:',
            response
          );


          /*
           * Backend response currently is:
           *
           * {
           *   success: true,
           *   assignments: [...]
           * }
           *
           * Therefore use response.assignments.
           */

          if (Array.isArray(response)) {

            this.assignments =
              response;

          }

          else if (
            Array.isArray(
              response?.assignments
            )
          ) {

            this.assignments =
              response.assignments;

          }

          else if (
            Array.isArray(
              response?.data
            )
          ) {

            this.assignments =
              response.data;

          }

          else {

            this.assignments = [];

          }


          console.log(
            'HO Assignments loaded:',
            this.assignments
          );


          console.log(
            'HO Assignment count:',
            this.assignments.length
          );


          this.isLoading = false;

        },


        error: (error) => {

          console.error(
            'Error loading HO Assignments:',
            error
          );


          this.assignments = [];

          this.isLoading = false;

        }

      });

  }


  // ================================
  // Create Assignment
  // ================================

  createAssignment(): void {

    this.router.navigate([
      '/employee/ho-assignment-creater'
    ]);

  }


  // ================================
  // View Assignment
  // ================================

  viewAssignment(
    assignment: any
  ): void {

    console.log(
      'View HO Assignment:',
      assignment
    );


    /*
     * Store selected assignment
     * for popup.
     */

    this.selectedAssignment =
      assignment;


    /*
     * Open popup.
     */

    this.isViewModalOpen =
      true;


    /*
     * If assignment is unread,
     * mark it as read.
     *
     * IMPORTANT:
     * We DO NOT remove it from
     * the All Assignment list.
     */

    if (
      assignment.is_seen === false ||
      assignment.is_seen === 0
    ) {

      this.markAsRead(assignment);

    }

  }


  // ================================
  // Mark Assignment as Read
  // ================================

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
      'Marking HO Assignment as read from All Assignment page:',
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
            'Assignment marked as read from All Assignment page:',
            response
          );


          /*
           * Change status locally.
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
           * IMPORTANT:
           *
           * Do NOT filter this.assignments.
           *
           * The assignment must remain on
           * the All Assignment page.
           */

          console.log(
            'Assignment remains in All Assignment list:',
            assignment.assignment_id
          );

        },

        error: (error) => {

          console.error(
            'Error marking HO Assignment as read:',
            error
          );

        }

      });

  }


  // ================================
  // Close View Popup
  // ================================

  closeViewModal(): void {

    this.isViewModalOpen =
      false;

    this.selectedAssignment =
      null;

  }


  // ================================
  // Edit Assignment
  // ================================

  editAssignment(
    assignment: any
  ): void {

    console.log(
      'Edit HO Assignment:',
      assignment
    );

  }

}