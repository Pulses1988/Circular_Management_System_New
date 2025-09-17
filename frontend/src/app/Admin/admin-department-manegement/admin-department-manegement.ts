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
  editingDeptId: number | null = null;
editingDeptName: string = '';

  constructor(private user: User, private toast:Toast) {}

  ngOnInit() {
    this.loadDepartments()
  }
  loadDepartments(){
    if (typeof window !== 'undefined') {
     const assignment = JSON.parse(localStorage.getItem('userAssignment') || '{}');
    const id = Number(assignment.id);

    this.loading = true;

    if (assignment.type === 'head_office') {
      this.head_office_id = id;
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
          this.toast.show('Failed to load departments','error');
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
          this.toast.show('Failed to load departments','error');
          this.loading = false;
        },
      });
    }
  }
  }
  startEditing(dept: any) {
  this.editingDeptId = dept.id;
  this.editingDeptName = dept.name;
}
submitEdit() {
  if (!this.editingDeptName.trim()) {
    alert('Please enter a valid department name');
    return;
  }

  this.user.updateDepartment(this.editingDeptId!, { name: this.editingDeptName.trim() }).subscribe({
    next: () => {
      alert('Department updated successfully!');
      this.loadDepartments(); // refresh the list
      this.cancelEdit();
    },
    error: (err) => {
      console.error('Error updating department:', err);
      alert('Failed to update department. Please try again.');
    }
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
  onSubmit(newDeptName: string) {
    if (!this.newDeptName.trim()) {
      // Optionally show an error message if name is empty
      this.toast.show('Please enter a department name','error');
      return;
    }
    const assignment = JSON.parse(localStorage.getItem('userAssignment') || '{}');
    const id = Number(assignment.id);
    const data = {
      name: this.newDeptName,
      head_office_id: assignment.type === 'head_office' ? id : null,
      branch_id: assignment.type === 'branch' ? id : null,
    };
    this.user.createDepartments(data).subscribe({
      next: (res) => {
        this.toast.show('Department added successfully!','success');
        //  reload the department list
       this.loadDepartments()
        this.cancel(); // Reset form and hide it
      },
      error: (err) => {
        console.error('Error adding department:', err);
        this.toast.show('Failed to add department. Please try again.','error');
      },
    });
  }
  cancel() {
    this.showForm = false;
    this.newDeptName = '';
  }
}
