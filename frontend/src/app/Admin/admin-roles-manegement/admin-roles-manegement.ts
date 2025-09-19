// Updated component with proper type handling

import { Component } from '@angular/core';
import { User,Role as ServiceRole, CreateRoleRequest  } from '../../services/user';
import { Toast } from '../../toast/toast';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate } from '@angular/animations';
// import { user, CreateRoleRequest, Role as ServiceRole } from '../../services/role.service';

// Local interface for role with hierarchy - compatible with both services
interface Role {
  name: string;
  position: number;
  id: number; // Make this required to avoid undefined issues
  department_id?: number | null;
  branch_id?: number | null;
  head_office_id: number;
  timestamp?: string;
  department_name?: string;
  branch_name?: string;
}

// Interface for assignment
interface UserAssignment {
  id: number;
  type: 'head_office' | 'branch';
}

@Component({
  selector: 'app-admin-roles-manegement',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './admin-roles-manegement.html',
  styleUrl: './admin-roles-manegement.scss',
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0', opacity: '0', overflow: 'hidden' }),
        animate('300ms ease-out', style({ height: '*', opacity: '1' }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: '1', overflow: 'hidden' }),
        animate('300ms ease-in', style({ height: '0', opacity: '0' }))
      ])
    ])
  ]
})
export class AdminRolesManegement {
  departments: any[] = [];
  selectedDepartment: any = null;
  allowDirectRole = false;
  showDirectRoleForm = false;
  roleName = '';
  selectedDepartmentIndex: number = -1;
  currentRoleName: string = '';
  departmentRoles: { [key: number]: Role[] } = {};
  editingRole: string | null = null;
  editRoleName: string = '';
  branchRoles: Role[] = [];
  editingBranchRole: number | null = null;
  editBranchRoleName: string = '';
  
  // Loading states
  isCreatingRole = false;
  isDeletingRole = false;
  isUpdatingRole = false;
  
  // Current user assignment and branch info
  currentAssignment: UserAssignment | null = null;
  branchInfo: any = null; // Add this property for branch info
  
  constructor(
    private user: User, 
    private toast: Toast,
  ) {}

  ngOnInit() {
    this.loadCurrentAssignment();
    this.loadBranchInfo();
    this.loadDepartments();
    this.loadExistingRoles();
  }

  // Load current user assignment
  loadCurrentAssignment() {
    if (typeof window !== 'undefined') {
      const assignment = JSON.parse(localStorage.getItem('userAssignment') || '{}');
      this.currentAssignment = {
        id: Number(assignment.id),
        type: assignment.type
      };
    }
  }

  // Load branch info
  loadBranchInfo() {
    if(this.currentAssignment?.type==='branch'){
      this.user.getBranchById(this.currentAssignment.id).subscribe((res)=>{
        this.branchInfo=res;
      })
    }
  }

  // Convert ServiceRole to local Role interface
  private convertServiceRoleToLocal(serviceRole: ServiceRole): Role {
    return {
      id: serviceRole.id,
      name: serviceRole.name,
      position: serviceRole.position,
      head_office_id: serviceRole.head_office_id,
      branch_id: serviceRole.branch_id ?? null,
      department_id: serviceRole.department_id ?? null,
      timestamp: serviceRole.timestamp,
      department_name: serviceRole.department_name,
      branch_name: serviceRole.branch_name
    };
  }

  // Load existing roles
  loadExistingRoles() {
    if (!this.branchInfo?.id) return;

    this.user.getRolesByBranch(this.branchInfo.id).subscribe({
      next: (serviceRoles: ServiceRole[]) => {
        // Convert service roles to local roles
        const roles = serviceRoles.map(role => this.convertServiceRoleToLocal(role));
        
        // Separate branch roles from department roles
        roles.forEach(role => {
          if (role.department_id) {
            const deptIndex = this.departments.findIndex(dept => dept.id === role.department_id);
            if (deptIndex !== -1) {
              if (!this.departmentRoles[deptIndex]) {
                this.departmentRoles[deptIndex] = [];
              }
              this.departmentRoles[deptIndex].push(role);
            }
          } else {
            // This is a direct branch role
            this.branchRoles.push(role);
          }
        });

        // Sort all roles by position
        Object.keys(this.departmentRoles).forEach(key => {
          this.departmentRoles[+key].sort((a, b) => a.position - b.position);
        });
        this.branchRoles.sort((a, b) => a.position - b.position);
      },
      error: (err) => {
        console.error('Error loading existing roles:', err);
      }
    });
  }

  // Helper method to get roles for a department (handles undefined)
  getDepartmentRoles(index: number): Role[] {
    return this.departmentRoles[index] || [];
  }

  // Helper method to check if department has roles
  hasDepartmentRoles(index: number): boolean {
    return this.getDepartmentRoles(index).length > 0;
  }

  // Get next position for department roles
  getNextDepartmentPosition(deptIndex: number): number {
    const roles = this.getDepartmentRoles(deptIndex);
    return roles.length > 0 ? Math.max(...roles.map(r => r.position)) + 1 : 1;
  }

  // Get next position for branch roles
  getNextBranchPosition(): number {
    return this.branchRoles.length > 0 ? Math.max(...this.branchRoles.map(r => r.position)) + 1 : 1;
  }

  loadDepartments() {
    if (!this.currentAssignment) return;

    if (this.currentAssignment.type === 'head_office') {
      this.user.getDepartmentsByHeadOffice(this.currentAssignment.id).subscribe({
        next: (res: any) => {
          this.departments = res;
          this.departments.forEach((_, index) => {
            if (!this.departmentRoles[index]) {
              this.departmentRoles[index] = [];
            }
          });
        },
        error: () => {
          this.toast.show('Failed to load departments', 'error');
        }
      });
    } else {
      this.user.getDepartmentsByBranch(this.currentAssignment.id).subscribe({
        next: (res: any) => {
          this.user.getBranchById(this.currentAssignment!.id).subscribe((res)=>{
            this.branchInfo=res;
          })
          this.departments = res;
          this.departments.forEach((_, index) => {
            if (!this.departmentRoles[index]) {
              this.departmentRoles[index] = [];
            }
          });
          if (this.departments.length === 0) {
            this.allowDirectRole = true;
            this.showDirectRoleForm = false;
          }
        },
        error: () => {
          this.toast.show('Failed to load departments', 'error');
        }
      });
    }
  }

  toggleDepartment(index: number) {
    this.selectedDepartmentIndex = this.selectedDepartmentIndex === index ? -1 : index;
    this.selectedDepartment = this.selectedDepartmentIndex >= 0 ? this.departments[index] : null;
    this.currentRoleName = '';
  }

  startEditRole(deptIndex: number, roleIndex: number, currentRole: Role) {
    this.editingRole = deptIndex + '-' + roleIndex;
    this.editRoleName = currentRole.name;
  }

  saveEditRole(deptIndex: number, roleIndex: number) {
    if (this.editRoleName.trim() && !this.isUpdatingRole) {
      const role = this.departmentRoles[deptIndex][roleIndex];
      
      this.isUpdatingRole = true;
      const updatedData = {
        name: this.editRoleName.trim(),
        position: role.position
      };

      this.user.updateRole(role.id, updatedData).subscribe({
        next: (response) => {
          this.departmentRoles[deptIndex][roleIndex].name = this.editRoleName.trim();
          this.cancelEdit();
          this.toast.show('Role updated successfully', 'success');
          this.isUpdatingRole = false;
        },
        error: (err) => {
          console.error('Error updating role:', err);
          this.toast.show('Failed to update role', 'error');
          this.isUpdatingRole = false;
        }
      });
    }
  }

  cancelEdit() {
    this.editingRole = null;
    this.editRoleName = '';
  }

  addBranchRole() {
    if (this.roleName.trim() && !this.isCreatingRole) {
      this.isCreatingRole = true;

      const roleData: CreateRoleRequest = {
        name: this.roleName.trim(),
        position: this.getNextBranchPosition(),
        head_office_id: this.branchInfo.head_office_id,
        branch_id: this.branchInfo.id,
        department_id: null
      };

      this.user.createRole(roleData).subscribe({
        next: (response) => {
          const newRole: Role = {
            id: response.roleId,
            name: roleData.name,
            position: roleData.position,
            head_office_id: roleData.head_office_id,
            branch_id: roleData.branch_id,
            department_id: roleData.department_id
          };
          
          this.branchRoles.push(newRole);
          this.roleName = '';
          this.toast.show('Role created successfully', 'success');
          this.isCreatingRole = false;
          
          console.log('Added branch role with hierarchy:', newRole);
        },
        error: (err) => {
          console.error('Error creating branch role:', err);
          
          if (err.status === 400) {
            this.toast.show(err.error?.error || 'Invalid data provided', 'error');
          } else if (err.status === 500) {
            this.toast.show('Server error occurred. Please try again.', 'error');
          } else {
            this.toast.show('Failed to create role', 'error');
          }
          
          this.isCreatingRole = false;
        }
      });
    }
  }

  startEditBranchRole(roleIndex: number, currentRole: Role) {
    this.editingBranchRole = roleIndex;
    this.editBranchRoleName = currentRole.name;
  }

  saveEditBranchRole(roleIndex: number) {
    if (this.editBranchRoleName.trim() && !this.isUpdatingRole) {
      const role = this.branchRoles[roleIndex];

      this.isUpdatingRole = true;
      const updatedData = {
        name: this.editBranchRoleName.trim(),
        position: role.position
      };

      this.user.updateRole(role.id, updatedData).subscribe({
        next: (response) => {
          this.branchRoles[roleIndex].name = this.editBranchRoleName.trim();
          this.cancelBranchEdit();
          this.toast.show('Role updated successfully', 'success');
          this.isUpdatingRole = false;
        },
        error: (err) => {
          console.error('Error updating role:', err);
          this.toast.show('Failed to update role', 'error');
          this.isUpdatingRole = false;
        }
      });
    }
  }

  cancelBranchEdit() {
    this.editingBranchRole = null;
    this.editBranchRoleName = '';
  }

  removeBranchRole(roleIndex: number) {
    const role = this.branchRoles[roleIndex];

    if (confirm('Are you sure you want to delete this role?')) {
      this.isDeletingRole = true;
      
      this.user.deleteRole(role.id).subscribe({
        next: (response) => {
          this.branchRoles.splice(roleIndex, 1);
          this.reorderBranchRoles();
          this.toast.show('Role deleted successfully', 'success');
          this.isDeletingRole = false;
        },
        error: (err) => {
          console.error('Error deleting role:', err);
          this.toast.show('Failed to delete role', 'error');
          this.isDeletingRole = false;
        }
      });
    }
  }

  // Reorder branch roles positions after removal
  reorderBranchRoles() {
    this.branchRoles.forEach((role, index) => {
      role.position = index + 1;
    });
  }

  // Reorder department roles positions after removal
  reorderDepartmentRoles(deptIndex: number) {
    if (this.departmentRoles[deptIndex]) {
      this.departmentRoles[deptIndex].forEach((role, index) => {
        role.position = index + 1;
      });
    }
  }

  addRoleToDepartment(deptIndex: number) {
    if (this.currentRoleName.trim() && !this.isCreatingRole) {
      this.isCreatingRole = true;
      
      if (!this.departmentRoles[deptIndex]) {
        this.departmentRoles[deptIndex] = [];
      }

      const department = this.departments[deptIndex];
      console.log(department,'from addRoleto department')
      const roleData: CreateRoleRequest = {
        name: this.currentRoleName.trim(),
        position: this.getNextDepartmentPosition(deptIndex),
        head_office_id: this.branchInfo.head_office_id,
        branch_id: department.branch_id,
        department_id: department.id
      };

      this.user.createRole(roleData).subscribe({
        next: (response) => {
          const newRole: Role = {
            id: response.roleId,
            name: roleData.name,
            position: roleData.position,
            head_office_id: roleData.head_office_id,
            branch_id: roleData.branch_id,
            department_id: roleData.department_id
          };
          
          this.departmentRoles[deptIndex].push(newRole);
          this.currentRoleName = '';
          this.toast.show('Role created successfully', 'success');
          this.isCreatingRole = false;
          
          console.log('Added department role with hierarchy:', newRole);
        },
        error: (err) => {
          console.error('Error creating department role:', err);
          
          if (err.status === 400) {
            this.toast.show(err.error?.error || 'Invalid data provided', 'error');
          } else if (err.status === 500) {
            this.toast.show('Server error occurred. Please try again.', 'error');
          } else {
            this.toast.show('Failed to create role', 'error');
          }
          
          this.isCreatingRole = false;
        }
      });
    }
  }

  removeRole(deptIndex: number, roleIndex: number) {
    if (this.departmentRoles[deptIndex]) {
      const role = this.departmentRoles[deptIndex][roleIndex];

      if (confirm('Are you sure you want to delete this role?')) {
        this.isDeletingRole = true;
        
        this.user.deleteRole(role.id).subscribe({
          next: (response) => {
            this.departmentRoles[deptIndex].splice(roleIndex, 1);
            this.reorderDepartmentRoles(deptIndex);
            this.toast.show('Role deleted successfully', 'success');
            this.isDeletingRole = false;
          },
          error: (err) => {
            console.error('Error deleting role:', err);
            this.toast.show('Failed to delete role', 'error');
            this.isDeletingRole = false;
          }
        });
      }
    }
  }

  // Fixed move methods with proper type checking
  moveRoleUp(deptIndex: number, roleIndex: number) {
    if (roleIndex > 0 && this.departmentRoles[deptIndex]) {
      const roles = this.departmentRoles[deptIndex];
      const role1 = roles[roleIndex];
      const role2 = roles[roleIndex - 1];

      // Swap positions locally first
      [roles[roleIndex], roles[roleIndex - 1]] = [roles[roleIndex - 1], roles[roleIndex]];
      
      // Update positions
      const newPos1 = roleIndex;
      const newPos2 = roleIndex + 1;
      
      roles[roleIndex - 1].position = newPos1;
      roles[roleIndex].position = newPos2;

      // Update positions in backend - with proper type checking
      const updates: { id: number; position: number }[] = [
        { id: role1.id, position: newPos1 },
        { id: role2.id, position: newPos2 }
      ];

      this.user.updateRolePositions(updates).subscribe({
        next: () => {
          console.log('Positions updated successfully');
        },
        error: (err) => {
          console.error('Error updating positions:', err);
          // Revert local changes on error
          [roles[roleIndex], roles[roleIndex - 1]] = [roles[roleIndex - 1], roles[roleIndex]];
          roles[roleIndex - 1].position = newPos2;
          roles[roleIndex].position = newPos1;
          this.toast.show('Failed to update role positions', 'error');
        }
      });
    }
  }

  moveRoleDown(deptIndex: number, roleIndex: number) {
    const roles = this.departmentRoles[deptIndex];
    if (roleIndex < roles.length - 1 && roles) {
      const role1 = roles[roleIndex];
      const role2 = roles[roleIndex + 1];

      // Swap positions locally first
      [roles[roleIndex], roles[roleIndex + 1]] = [roles[roleIndex + 1], roles[roleIndex]];
      
      // Update positions
      const newPos1 = roleIndex + 1;
      const newPos2 = roleIndex + 2;
      
      roles[roleIndex].position = newPos1;
      roles[roleIndex + 1].position = newPos2;

      // Update positions in backend - with proper type checking
      const updates: { id: number; position: number }[] = [
        { id: role1.id, position: newPos1 },
        { id: role2.id, position: newPos2 }
      ];

      this.user.updateRolePositions(updates).subscribe({
        next: () => {
          console.log('Positions updated successfully');
        },
        error: (err) => {
          console.error('Error updating positions:', err);
          // Revert local changes on error
          [roles[roleIndex], roles[roleIndex + 1]] = [roles[roleIndex + 1], roles[roleIndex]];
          roles[roleIndex].position = newPos2;
          roles[roleIndex + 1].position = newPos1;
          this.toast.show('Failed to update role positions', 'error');
        }
      });
    }
  }

  moveBranchRoleUp(roleIndex: number) {
    if (roleIndex > 0) {
      const role1 = this.branchRoles[roleIndex];
      const role2 = this.branchRoles[roleIndex - 1];

      // Swap positions locally first
      [this.branchRoles[roleIndex], this.branchRoles[roleIndex - 1]] = 
      [this.branchRoles[roleIndex - 1], this.branchRoles[roleIndex]];
      
      // Update positions
      const newPos1 = roleIndex;
      const newPos2 = roleIndex + 1;
      
      this.branchRoles[roleIndex - 1].position = newPos1;
      this.branchRoles[roleIndex].position = newPos2;

      // Update positions in backend - with proper type checking
      const updates: { id: number; position: number }[] = [
        { id: role1.id, position: newPos1 },
        { id: role2.id, position: newPos2 }
      ];

      this.user.updateRolePositions(updates).subscribe({
        next: () => {
          console.log('Positions updated successfully');
        },
        error: (err) => {
          console.error('Error updating positions:', err);
          // Revert local changes on error
          [this.branchRoles[roleIndex], this.branchRoles[roleIndex - 1]] = 
          [this.branchRoles[roleIndex - 1], this.branchRoles[roleIndex]];
          this.branchRoles[roleIndex - 1].position = newPos2;
          this.branchRoles[roleIndex].position = newPos1;
          this.toast.show('Failed to update role positions', 'error');
        }
      });
    }
  }

  moveBranchRoleDown(roleIndex: number) {
    if (roleIndex < this.branchRoles.length - 1) {
      const role1 = this.branchRoles[roleIndex];
      const role2 = this.branchRoles[roleIndex + 1];

      // Swap positions locally first
      [this.branchRoles[roleIndex], this.branchRoles[roleIndex + 1]] = 
      [this.branchRoles[roleIndex + 1], this.branchRoles[roleIndex]];
      
      // Update positions
      const newPos1 = roleIndex + 1;
      const newPos2 = roleIndex + 2;
      
      this.branchRoles[roleIndex].position = newPos1;
      this.branchRoles[roleIndex + 1].position = newPos2;

      // Update positions in backend - with proper type checking
      const updates: { id: number; position: number }[] = [
        { id: role1.id, position: newPos1 },
        { id: role2.id, position: newPos2 }
      ];

      this.user.updateRolePositions(updates).subscribe({
        next: () => {
          console.log('Positions updated successfully');
        },
        error: (err) => {
          console.error('Error updating positions:', err);
          // Revert local changes on error
          [this.branchRoles[roleIndex], this.branchRoles[roleIndex + 1]] = 
          [this.branchRoles[roleIndex + 1], this.branchRoles[roleIndex]];
          this.branchRoles[roleIndex].position = newPos2;
          this.branchRoles[roleIndex + 1].position = newPos1;
          this.toast.show('Failed to update role positions', 'error');
        }
      });
    }
  }

  finalizeDepartmentRoles(deptIndex: number) {
    const department = this.departments[deptIndex];
    const roles = this.departmentRoles[deptIndex] || [];
    console.log('Finalizing roles for department:', department, roles);
  }

  focusRoleInput(deptIndex: number) {
    setTimeout(() => {
      const input = document.querySelector(`input[name="currentRoleName"]`) as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  }

  selectDepartment(dept: any) {
    this.selectedDepartment = dept;
  }

  proceedWithoutDepartment() {
    this.showDirectRoleForm = true;
  }

  cancelDirectRole() {
    this.showDirectRoleForm = false;
  }
  
  submitRole() {
    this.addBranchRole();
  }

  goBack() {
    // Handle navigation back to previous page
  }
}