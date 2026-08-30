import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { Toast } from '../../toast/toast';
import { User } from '../../services/user';

@Component({
  selector: 'app-admin-dashboard',
  imports: [MatIconModule, CommonModule, NgIf, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard {
  isHoAdmin: boolean = false; // Dynamically set based on login or user data 

  //for making 4 th cards

  totalHeadOfficeDepartments = 0;
totalBranchDepartments = 0;

  totalDepartments = 0;
  totalBranches = 0;
  totalEmployees = 0;
  showHeadOfficeForm = false;
  isheadOffice = [];
  hasHeadOffice: boolean = false;
  isLoading: boolean = false;

  headOffice = {
    name: 'Head Office',
    bank_name: '',
    address: '',
  };
  constructor(private toast: Toast, private user: User) {}
  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.isHoAdmin = 'HO_ADMIN' === localStorage!.getItem('role');
    }
    this.fetchCounts();
    this.fetchHedOffice();
  }
  toggleHeadOfficeForm() {
    this.showHeadOfficeForm = !this.showHeadOfficeForm;
  }
  fetchCounts() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const assignment = JSON.parse(localStorage.getItem('userAssignment') || '{}');
      const id = Number(assignment.id);

      this.isLoading = true;
      this.totalDepartments = 0;
      this.totalBranches = 0;
      this.totalEmployees = 0;
      this.totalHeadOfficeDepartments = 0;
      this.totalBranchDepartments = 0;

      if (assignment.type === 'head_office') {
        forkJoin({
          headOfficeDepartments: this.user.getDepartmentCountByHeadOffice(id).pipe(
            catchError(() => {
              this.toast.show('Failed to fetch head office department count', 'error');
              return of({ count: 0 });
            })
          ),
          branches: this.user.getBranchesByHeadOffice(id).pipe(
            catchError(() => {
              this.toast.show('Failed to fetch branches', 'error');
              return of([] as any[]);
            })
          ),
          employees: this.user.getByHeadOfficeEmployeeCount(id).pipe(
            catchError(() => {
              this.toast.show('Failed to fetch employee count', 'error');
              return of({ count: 0 });
            })
          ),
        })
          .pipe(
            switchMap(({ headOfficeDepartments, branches, employees }) => { 
                 console.log('HEAD OFFICE ID:', id);
  console.log('BRANCH API RESPONSE:', branches);
  console.log('IS ARRAY:', Array.isArray(branches));



              // const branchIds = [
              //   ...new Set(
              //     (Array.isArray(branches) ? branches : [])
              //       .filter((branch: any) => branch?.id !== null && branch?.id !== undefined)
              //       .map((branch: any) => branch.id)
              //   ),
              // ];

const branchList = Array.isArray(branches)
  ? branches
  : Array.isArray(branches?.data)
    ? branches.data
    : [];

// const branchIds = [
//   ...new Set(
//     branchList
//       .filter(
//         (branch: any) =>
//           branch?.id !== null &&
//           branch?.id !== undefined
//       )
//       .map((branch: any) => Number(branch.id))
//   ),
// ];
const branchIds: number[] = [
  ...new Set<number>(
    branchList
      .filter(
        (branch: any) =>
          branch?.id !== null &&
          branch?.id !== undefined
      )
      .map((branch: any) => Number(branch.id))
  ),
];
console.log('BRANCH LIST:', branchList);
console.log('BRANCH IDS:', branchIds);



              return (branchIds.length
                ? forkJoin(
                    branchIds.map((branchId) =>
                      this.user.getDepartmentCountByBranch(branchId).pipe(
                        catchError(() => {
                          this.toast.show('Failed to fetch a branch department count', 'error');
                          return of({ count: 0 });
                        })
                      )
                    )
                  )
                : of([])
              ).pipe(
                map((branchDepartmentCounts) => ({
                  headOfficeDepartments,
                  employees,
                  totalBranches: branchIds.length,
                  branchDepartmentCounts,
                }))
              );
            }),
            finalize(() => (this.isLoading = false))
          )
          .subscribe(({ headOfficeDepartments, employees, totalBranches, branchDepartmentCounts }: any) => {
            this.totalHeadOfficeDepartments = Number(headOfficeDepartments?.count) || 0;
            this.totalBranchDepartments = branchDepartmentCounts.reduce(
              (total: number, result: any) => total + (Number(result?.count) || 0),
              0
            );
            this.totalBranches = totalBranches;
            this.totalEmployees = Number(employees?.count) || 0;
            this.calculateTotalDepartments();
          });
      } else {
        forkJoin({
          departments: this.user.getDepartmentCountByBranch(id).pipe(
            catchError(() => {
              this.toast.show('Failed to fetch department count', 'error');
              return of({ count: 0 });
            })
          ),
          employees: this.user.getByBranchEmployeeCount(id).pipe(
            catchError(() => {
              this.toast.show('Failed to fetch employee count', 'error');
              return of({ count: 0 });
            })
          ),
        })
          .pipe(finalize(() => (this.isLoading = false)))
          .subscribe(({ departments, employees }: any) => {
            this.totalDepartments = Number(departments?.count) || 0;
            this.totalEmployees = Number(employees?.count) || 0;
          });
      }
    }
  }

  fetchHedOffice() {
    this.isLoading = true;
    this.user.fetchAllAdmin().subscribe({
      next: (res: any) => {
        console.log('Head Office List:', res);

        this.isheadOffice = res;
        this.hasHeadOffice = res && res.length > 0; // true if at least one record exists
      },
      error: () => {
        this.toast.show('Failed to load head office', 'error');
      },
    });
  }
calculateTotalDepartments() {

  this.totalDepartments =
    this.totalHeadOfficeDepartments +
    this.totalBranchDepartments;

  console.log('--------------------------------');
  console.log('HEAD OFFICE DEPARTMENTS:', this.totalHeadOfficeDepartments);
  console.log('BRANCH DEPARTMENTS:', this.totalBranchDepartments);
  console.log('TOTAL DEPARTMENTS:', this.totalDepartments);
  console.log('--------------------------------');
}
  addHeadOffice() {
    if (
      !this.headOffice.name.trim() ||
      !this.headOffice.bank_name.trim() ||
      !this.headOffice.address.trim()
    ) {
      this.toast.show('Please fill in all fields', 'error');
      return;
    }

    this.user.addHeadOffice(this.headOffice).subscribe({
      next: () => {
        this.toast.show('Head office added successfully!', 'success');
        this.headOffice = { name: '', bank_name: '', address: '' };
        this.showHeadOfficeForm = false;
        this.fetchCounts(); // Refresh counts
      },
      error: () => {
        this.toast.show('Failed to add head office', 'error');
      },
    });
  }
}
