import { Component } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/user';
import { Toast } from '../../toast/toast';

@Component({
  selector: 'app-admin-department-manegement',
  imports: [MatIconModule, CommonModule, NgIf, FormsModule],
  templateUrl: './admin-department-manegement.html',
  styleUrl: './admin-department-manegement.scss',
})
export class AdminDepartmentManegement {
  showForm = false;
  currentPage = 1;
  itemsPerPage = 10;
  head_office_id!: number;
  branch_id!: number;
  loading = false;
  departments: any[] = [];

branches: any[] = [];
selectedBranchId: number | null = null;
selectedLocationType: 'head_office' | 'branch' = 'head_office';

  editingDeptId: number | null = null;
  editingDeptName: string = '';
  officeInfo!: any;
  submitLoader: boolean = false;

  constructor(private user: User, private toast: Toast) {}

  ngOnInit() {
    this.loadDepartments();
  } 


  loadDepartments()
  
  
  {
    if (typeof window !== 'undefined') {
      const assignment = JSON.parse(localStorage.getItem('userAssignment') || '{}');
      const id = Number(assignment.id);

      this.loading = true;

      if (assignment.type === 'head_office') {
        this.head_office_id = id;
        
        this.loadBranches(id);


        this.user.getDepartmentsByHeadOffice(id).subscribe({
          next: (res: any[]) => {
            this.departments = res.map((dept) => ({
              id: dept.id,
              name: dept.name,
              location: dept.head_office_name || 'Head Office',
            }));
            this.loading = false;
          },
          error: (err: any) => {
            console.error('Error fetching head office departments:', err);
            this.toast.show('Failed to load departments', 'error');
            this.loading = false;
          },
        });
        this.user.fetchHeadOfficeById(id).subscribe({
          next: (res: any) => {
            this.officeInfo = res;
            console.log(this.officeInfo, '.....office');
          },
          error: (err: any) => {
            console.error('Error fetching head office Info:', err);
            this.toast.show('Failed to load head office Info', 'error');
            this.loading = false;
          },
        });
      } else if (assignment.type === 'branch') {
        this.branch_id = id;
        this.user.getDepartmentsByBranch(id).subscribe({
          next: (res: any[]) => {
            this.departments = res.map((dept) => ({
              id: dept.id,
              name: dept.name,
              location: dept.branch_name || 'Branch',
            }));
            this.loading = false;
          },
          error: (err: any) => {
            console.error('Error fetching branch departments:', err);
            this.toast.show('Failed to load departments', 'error');
            this.loading = false;
          },
        });
        this.user.getBranchById(id).subscribe({
          next: (res: any) => {
            this.officeInfo = res;
            console.log(res, 'oficeIno');
          },
          error: (err: any) => {
            console.error('Error fetching Branch Info:', err);
            this.toast.show('Failed to load Branch Info', 'error');
            this.loading = false;
          },
        });
      }
    }
  } 

//LoadBranches
loadBranches(headOfficeId: number) {
  // this.user.getBranchesByHeadOffice(headOfficeId).subscribe({
  //   next: (res: any[]) => {
  //     this.branches = res;
  //   },
  //   error: (err) => {
  //     console.error('Error loading branches:', err);
  //     this.toast.show('Failed to load branches', 'error');
  //   },
  // }); 
 console.log("Head Office ID:", headOfficeId);

  this.user.getBranchesByHeadOffice(headOfficeId).subscribe({
    // next: (res: any[]) => {
    //   console.log("Branches Response:", res);
    //   this.branches = res;
    // },
    next: (res: any) => {
  console.log("Branches Response:", res);

  this.branches = res.data;

  console.log("Branches Array:", this.branches);
},
    error: (err) => {
      console.error("Error loading branches:", err);
      this.toast.show("Failed to load branches", "error");
    },
  });



}





  startEditing(dept: any) {
    this.editingDeptId = dept.id;
    this.editingDeptName = dept.name;
  }
  submitEdit() {
    if (!this.editingDeptName.trim()) {
      this.toast.show('Please enter a valid department name', 'error');
      return;
    }

    this.submitLoader = true;

    this.user
      .updateDepartment(this.editingDeptId!, { name: this.editingDeptName.trim() })
      .subscribe({
        next: () => {
          this.toast.show('Department updated successfully!', 'success');

          this.loadDepartments(); // refresh the list
          this.cancelEdit();
          this.submitLoader = false;
        },
        error: (err) => {
          // console.error('Error updating department:', err);

          const message = err.error?.error || 'Failed to update department. Please try again.';

          this.toast.show(message, 'error');
          this.submitLoader = false;
        },
      });
  }
  cancelEdit() {
    this.editingDeptId = null;
    this.editingDeptName = '';
  }
  get paginatedDepartments() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.departments.slice(start, start + this.itemsPerPage);
  }
  totalPages() {
    return Math.ceil(this.departments.length / this.itemsPerPage);
  }
  newDeptName = '';
  toggleForm() {
    this.showForm = !this.showForm;
  }
  goToPage(page: number) {
    this.currentPage = page;
  }



//   onSubmit(newDeptName: string)
//    {
//     if (!this.newDeptName.trim()) {
//       // Optionally show an error message if name is empty
//       this.toast.show('Please enter a department name', 'error');
//       return;
//     }
//     this.submitLoader = true;
//     const assignment = JSON.parse(localStorage.getItem('userAssignment') || '{}');
//     const id = Number(assignment.id);

//     if (assignment.type === 'head_office' && !this.selectedBranchId) {
//   this.toast.show('Please select a branch', 'error');
//    this.submitLoader = false;
//   return;
//      }
    
//      const data = {     
//  name: this.newDeptName,
//   head_office_id: assignment.type === 'head_office' ? id : null,
//   branch_id:
//     assignment.type === 'head_office'
//       ? this.selectedBranchId
//       : id,
//     };


//     this.user.createDepartments(data).subscribe({
//       next: (res) => {
//         this.toast.show('Department added successfully!', 'success');
//         //  reload the department list
//         this.loadDepartments();
//         this.cancel(); // Reset form and hide it
//         this.submitLoader = false;
//       },
//       error: (err) => {
//         console.error('Error adding department:', err);
//         const message = err.error?.error || 'Failed to update department. Please try again.';

//         this.toast.show(message, 'error');
//         this.submitLoader = false;
//       },
//     });
//   }
  


onSubmit(newDeptName: string) {
  if (!this.newDeptName.trim()) {
    this.toast.show('Please enter a department name', 'error');
    return;
  }

  this.submitLoader = true;

  const assignment = JSON.parse(
    localStorage.getItem('userAssignment') || '{}'
  );

  const id = Number(assignment.id);

  let data: any;

  if (assignment.type === 'head_office') {

    // Department directly under Head Office
    if (this.selectedLocationType === 'head_office') {

      data = {
        name: this.newDeptName.trim(),
        head_office_id: id,
        branch_id: null
      };

    }

    // Department under Branch
    else if (this.selectedLocationType === 'branch') {

      if (!this.selectedBranchId) {
        this.toast.show('Please select a branch', 'error');
        this.submitLoader = false;
        return;
      }

      data = {
        name: this.newDeptName.trim(),
        head_office_id: null,
        branch_id: this.selectedBranchId
      };
    }

  } else if (assignment.type === 'branch') {

    // Branch admin can only create department under his branch
    data = {
      name: this.newDeptName.trim(),
      head_office_id: null,
      branch_id: id
    };

  } else {
    this.toast.show('Invalid assignment type', 'error');
    this.submitLoader = false;
    return;
  }

  console.log('Department data being sent:', data);

  this.user.createDepartments(data).subscribe({
    next: (res) => {
      this.toast.show('Department added successfully!', 'success');

      this.loadDepartments();

      this.cancel();

      this.submitLoader = false;
    },

    error: (err) => {
      console.error('Error adding department:', err);

      const message =
        err.error?.error ||
        'Failed to create department. Please try again.';

      this.toast.show(message, 'error');

      this.submitLoader = false;
    },
  });
}




  
  
  cancel() {
    this.showForm = false;
    this.newDeptName = '';
  } 

onLocationChange(value: string): void {
  if (value === 'head_office') {
    this.selectedBranchId = null;
    this.selectedLocationType = 'head_office';
    return;
  }

  if (value.startsWith('branch:')) {
    const branchId = Number(value.split(':')[1]);

    this.selectedBranchId = branchId;
    this.selectedLocationType = 'branch';
  }
}




}
