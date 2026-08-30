import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { CircularService } from '../../../services/circular-service';
import { EmployeeService } from '../../../services/employee-service';
import { ExportReport } from '../export-report/export-report';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';


@Component({
  selector: 'app-reading-history',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './reading-history.html',
  styleUrl: './reading-history.scss'
})
export class ReadingHistory implements OnInit {

  // ================================
  // Dashboard Statistics
  // ================================

  totalRead = 0;
  todayRead = 0;
  totalCirculars = 0;
  unreadCirculars = 0;
  compliance = 0;


  // ================================
  // Reading History
  // ================================

  readingHistory: any[] = []; 

allReadingHistory: any[] = [];








  // Store approval records
  approvalData: any[] = [];


  constructor(
    private circularService: CircularService,
    private employeeService: EmployeeService,
    private router: Router,
    private dialog: MatDialog
  ) {}


  // ================================
  // Initialization
  // ================================

  ngOnInit(): void {
    this.loadReadingHistory();

    
  }


  // ================================
  // Load Default Reading History
  // ================================

  loadReadingHistory(): void {

    const employee =
      this.employeeService.getCurrentEmployee();

    if (!employee) {
      console.error('Employee not found.');
      return;
    }


    // Load read circulars by default

    this.circularService
      .fetchSeenCircularsByEmpId(employee.id)
      .subscribe({

        next: (response: any) => {

          console.log(
            'Reading History Response:',
            response
          );
          
           this.allReadingHistory = response.data || [];
  this.readingHistory = [...this.allReadingHistory];


          // this.readingHistory =
          //   response.data || [];

          this.totalRead =
            this.readingHistory.length;


          // Today's read circulars

          const today =
            new Date().toDateString();

          this.todayRead =
            this.readingHistory.filter(
              (item: any) =>

                item.seen_at &&

                new Date(
                  item.seen_at
                ).toDateString() === today

            ).length;

        },

        error: (error) => {

          console.error(
            'Error loading reading history:',
            error
          );

        }

      });


    // Load statistics

    this.circularService
      .getStatistics(employee.id)
      .subscribe({

        next: (response: any) => {

          this.totalCirculars =
            response.totalCirculars;

          this.totalRead =
            response.readCirculars;

          this.unreadCirculars =
            response.unreadCirculars;

          this.compliance =
            response.compliance;

        },

        error: (error) => {

          console.error(
            'Error loading statistics:',
            error
          );

        }

      });

  }


  // ================================
  // Page Read Status Filter
  // ================================

  onReadStatusChange(event: any): void {

    const employee =
      this.employeeService.getCurrentEmployee();

    if (!employee) {
      return;
    }

    const status =
      event.target.value;


    // READ

    if (status === 'read') {

      this.circularService
        .fetchSeenCircularsByEmpId(
          employee.id
        )
        .subscribe({

          next: (response: any) => {

            this.readingHistory =
              response.data || [];

          },

          error: (err) => {

            console.error(err);

          }

        });

    }


    // UNREAD

    else if (status === 'unread') {

      this.circularService
        .fetchUnseenCircularsByEmpId(
          employee.id
        )
        .subscribe({

          next: (response: any) => {

            this.readingHistory =
              response.data || [];

          },

          error: (err) => {

            console.error(err);

          }

        });

    }


    // ALL

    else {

      this.circularService
        .fetchAllCircularsWithTrackingDetailsByEmpId(
          employee.id
        )
        .subscribe({

          next: (response: any) => {

            this.readingHistory =
              response.data || [];

          },

          error: (err) => {

            console.error(err);

          }

        });

    } 

  }

onPriorityChange(event: Event): void {
  const priority = (event.target as HTMLSelectElement).value;

  if (priority === 'All') {
    this.readingHistory = [...this.allReadingHistory];
    return;
  }

  this.readingHistory = this.allReadingHistory.filter(
    (item: any) =>
      item.priority?.toLowerCase() === priority.toLowerCase()
  );
}


onDepartmentChange(event: Event): void {
  const department = (event.target as HTMLSelectElement).value;

  if (department === 'All') {
    this.readingHistory = [...this.allReadingHistory];
    return;
  }

  this.readingHistory = this.allReadingHistory.filter(
    (item: any) =>
      item.department?.toLowerCase() === department.toLowerCase()
  );
}


onYearChange(year: number): void {
  this.readingHistory = this.allReadingHistory.filter(
    (item: any) => {
      const date =
        item.seen_at ||
        item.created_at ||
        item.createdAt ||
        item.published_at ||
        item.effective_from;

      return date && new Date(date).getFullYear() === year;
    }
  );
}




  // ================================
  // View Circular
  // ================================

  viewCircular(
    circularId: number
  ): void {

    this.router.navigate(
      ['/employee/circular-details'],
      {
        queryParams: {
          circularId: circularId
        }
      }
    );

  }


  // ================================
  // Open Export Dialog
  // ================================

  openExportDialog(): void {

    const dialogRef =
      this.dialog.open(
        ExportReport,
        {
          width: '650px',
          maxWidth: '95vw',
          disableClose: true
        }
      );


    dialogRef
      .afterClosed()
      .subscribe(
        (filters: any) => {


          // Cancel clicked

          if (!filters) {
            return;
          }


          console.log(
            'Selected Export Filters:',
            filters
          );


          const employee =
            this.employeeService
              .getCurrentEmployee();


          if (!employee) {

            console.error(
              'Employee not found.'
            );

            return;

          }


          // =========================================
          // STEP 1: GET ALL APPROVAL DATA FIRST
          // =========================================

          this.circularService
            .getCircularApprovalDataById(
              employee.id
            )
            .subscribe({

              next: (approvalResponse: any) => {


                // Store approval records

                this.approvalData =
                  Array.isArray(
                    approvalResponse
                  )
                    ? approvalResponse
                    : [];


                console.log(
                  'APPROVAL API RESPONSE:',
                  this.approvalData
                );


                // =================================
                // STEP 2: GET READ CIRCULARS
                // =================================

                if (
                  filters.readStatus === 'Read'
                ) {

                  this.circularService
                    .fetchSeenCircularsByEmpId(
                      employee.id
                    )
                    .subscribe({

                      next: (
                        response: any
                      ) => {

                        const data =
                          response.data || [];


                        console.log(
                          'READ CIRCULARS:',
                          data
                        );


                        this.generateExport(
                          data,
                          filters
                        );

                      },

                      error: (error) => {

                        console.error(
                          'Error fetching read circulars:',
                          error
                        );

                      }

                    });

                }


                // =================================
                // STEP 2: GET UNREAD CIRCULARS
                // =================================

                else if (
                  filters.readStatus === 'Unread'
                ) {

                  this.circularService
                    .fetchUnseenCircularsByEmpId(
                      employee.id
                    )
                    .subscribe({

                      next: (
                        response: any
                      ) => {

                        const data =
                          response.data || [];


                        console.log(
                          'UNREAD CIRCULARS:',
                          data
                        );


                        this.generateExport(
                          data,
                          filters
                        );

                      },

                      error: (error) => {

                        console.error(
                          'Error fetching unread circulars:',
                          error
                        );

                      }

                    });

                }


                // =================================
                // STEP 2: GET ALL CIRCULARS
                // READ + UNREAD
                // =================================

                else {

                  this.circularService
                    .fetchSeenCircularsByEmpId(
                      employee.id
                    )
                    .subscribe({

                      next: (
                        readResponse: any
                      ) => {

                        const readData =
                          readResponse.data || [];


                        this.circularService
                          .fetchUnseenCircularsByEmpId(
                            employee.id
                          )
                          .subscribe({

                            next: (
                              unreadResponse: any
                            ) => {

                              const unreadData =
                                unreadResponse.data ||
                                [];


                              // Combine read + unread

                              const allData = [

                                ...readData,

                                ...unreadData

                              ];


                              console.log(
                                'ALL EMPLOYEE CIRCULARS:',
                                allData
                              );


                              this.generateExport(
                                allData,
                                filters
                              );

                            },

                            error: (error) => {

                              console.error(
                                'Error fetching unread circulars:',
                                error
                              );

                            }

                          });

                      },

                      error: (error) => {

                        console.error(
                          'Error fetching read circulars:',
                          error
                        );

                      }

                    });

                }

              },


              error: (error) => {

                console.error(
                  'APPROVAL API ERROR:',
                  error
                );

              }

            });

        }
      );

  }


  // ================================
  // Generate Export
  // ================================

  generateExport(
    data: any[],
    filters: any
  ): void {


    let filteredData =
      [...data];


    console.log(
      'DATA BEFORE FILTERING:',
      filteredData
    );


    // =================================
    // MERGE APPROVAL STATUS
    // =================================

    filteredData =
      filteredData.map(
        (circular: any) => {


          // Find matching approval record
          // using circular_id

          const approval =
            this.approvalData.find(
              (approvalItem: any) =>

                Number(
                  approvalItem.circular_id
                ) ===

                Number(
                  circular.circular_id
                )

            );


          console.log(
            'CIRCULAR ID:',
            circular.circular_id,
            'MATCHED APPROVAL:',
            approval
          );


          return {

            ...circular,


            // If matching approval exists,
            // use its status

            approval_status:
              approval?.status || 'PENDING'

          };

        }
      );


    console.log(
      'DATA AFTER APPROVAL MERGE:',
      filteredData
    );


    // ============================
    // FROM DATE
    // ============================

    if (filters.fromDate) {


      const fromDate =
        new Date(
          filters.fromDate
        );


      fromDate.setHours(
        0,
        0,
        0,
        0
      );


      filteredData =
        filteredData.filter(
          (item: any) => {


            const itemDate =

              item.seen_at ||

              item.created_at ||

              item.createdAt ||

              item.published_at ||

              item.effective_from;


            if (!itemDate) {

              return false;

            }


            return (

              new Date(itemDate) >=

              fromDate

            );

          }
        );

    }


    // ============================
    // TO DATE
    // ============================

    if (filters.toDate) {


      const toDate =
        new Date(
          filters.toDate
        );


      toDate.setHours(
        23,
        59,
        59,
        999
      );


      filteredData =
        filteredData.filter(
          (item: any) => {


            const itemDate =

              item.seen_at ||

              item.created_at ||

              item.createdAt ||

              item.published_at ||

              item.effective_from;


            if (!itemDate) {

              return false;

            }


            return (

              new Date(itemDate) <=

              toDate

            );

          }
        );

    }


    // ============================
    // APPROVAL STATUS FILTER
    // ============================

    if (
      filters.approvalStatus !== 'All'
    ) {


      filteredData =
        filteredData.filter(
          (item: any) => {


            return (

              item.approval_status
                ?.toString()
                .toUpperCase() ===

              filters.approvalStatus
                .toString()
                .toUpperCase()

            );

          }
        );

    }


    console.log(
      'FINAL FILTERED EXPORT DATA:',
      filteredData
    );


    // ============================
    // PDF OR EXCEL
    // ============================

    if (
      filters.format === 'PDF'
    ) {

      this.exportPDF(
        filteredData
      );

    }


    else if (
      filters.format === 'Excel'
    ) {

      this.exportExcel(
        filteredData
      );

    }

  }


  // ================================
  // Export PDF
  // ================================

  exportPDF(
    data: any[]
  ): void {


    const doc =
      new jsPDF();


    doc.text(
      'Circular Report',
      14,
      15
    );


    const rows =
      data.map(
        (item: any) => [

          item.circular_code || '',

          item.title || '',

          item.priority || '',

          item.seen_at
            ? 'Read'
            : 'Unread',

          item.approval_status || '',

          item.seen_at ||
          item.created_at ||
          item.createdAt ||
          item.published_at ||
          item.effective_from ||
          ''

        ]
      );


    autoTable(
      doc,
      {

        head: [[

          'Circular Code',

          'Title',

          'Priority',

          'Read Status',

          'Approval Status',

          'Date'

        ]],

        body: rows,

        startY: 25

      }
    );


    doc.save(
      'circular-report.pdf'
    );

  }


  // ================================
  // Export Excel
  // ================================

  exportExcel(
    data: any[]
  ): void {


    const exportData =
      data.map(
        (item: any) => ({

          'Circular Code':
            item.circular_code || '',


          'Title':
            item.title || '',


          'Priority':
            item.priority || '',


          'Read Status':
            item.seen_at
              ? 'Read'
              : 'Unread',


          'Approval Status':
            item.approval_status || '',


          'Date':
            item.seen_at ||
            item.created_at ||
            item.createdAt ||
            item.published_at ||
            item.effective_from ||
            ''

        })
      );


    const worksheet =

      XLSX.utils.json_to_sheet(
        exportData
      );


    const workbook =

      XLSX.utils.book_new();


    XLSX.utils
      .book_append_sheet(

        workbook,

        worksheet,

        'Circular Report'

      );


    XLSX.writeFile(

      workbook,

      'circular-report.xlsx'

    );

  }

}