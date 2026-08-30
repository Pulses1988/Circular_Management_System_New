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

// All departments received for Head Office Admin
allDepartments: any[] = [];

// Departments currently displayed in UI
headOfficeDepartments: any[] = [];
branchDepartments: any[] = [];

// Selected department type for Head Office Admin
selectedDepartmentType: 'head_office' | 'branch' = 'head_office';







  showDirectRoleForm = false;
  roleName = '';
  selectedDepartmentIndex: number = -1;
  currentRoleName: string = '';
  departmentRoles: { [key: number]: Role[] } = {};
  editingRole: string | null = null;
  editRoleName: string = '';
  branchRoles: any[] = [];
  editingBranchRole: number | null = null;
  editBranchRoleName: string = '';
  hasBranchRoles = false;
  private positionUpdateTimeout: any;
  
  // Loading states
  isCreatingRole = false;
  isDeletingRole = false;
  isUpdatingRole = false; 

  // Department deletion
deletingDepartmentId: number | null = null;
  
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
    // this.loadExistingRoles();

this.currentAssignment?.type === 'branch'

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
    if (this.currentAssignment?.type === 'branch') {
      this.user.getBranchById(this.currentAssignment.id).subscribe((res) => {
        this.branchInfo = res;
        // Load existing roles after branch info is loaded
        this.loadExistingRoles();
      });
    }
  }

  // Convert ServiceRole to local Role interface
 private convertServiceRoleToLocal(serviceRole: ServiceRole): Role {
    return {
      id: serviceRole.id || 0,
      name: serviceRole.name || 'Unnamed Role',
      position: serviceRole.position || 1,
      head_office_id: serviceRole.head_office_id || 0,
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

        // Set flag for branch roles existence
        this.hasBranchRoles = this.branchRoles.length > 0;
        
        // Update UI logic after loading roles
        this.updateUILogic();
      },
      error: (err) => {
        console.error('Error loading existing roles:', err);
      }
    });
  }
  loadDepartmentRoles() {
    this.departments.forEach((dept, index) => {
      this.user.getRolesByDepartment(dept.id).subscribe({
        next: (res: any[]) => {
          console.log(res,'dfghjk')
          // const roles = serviceRoles.map(role => this.convertServiceRoleToLocal(role));
          this.departmentRoles[index] = res.sort((a, b) => a.position - b.position);
        },
        error: (err) => {
          console.error(`Error loading roles for department ${dept.id}:`, err);
        }
      });
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

  canDeleteDepartment(index: number): boolean {
  return !this.hasDepartmentRoles(index);
}



  // Get next position for department roles
 getNextDepartmentPosition(deptIndex: number): number {
  const roles = this.getDepartmentRoles(deptIndex);
  return roles.length > 0 ? Math.max(...roles.map(r => r.position || 0)) + 1 : 1;
}

getNextBranchPosition(): number {
  return this.branchRoles.length > 0 ? Math.max(...this.branchRoles.map(r => r.position || 0)) + 1 : 1;
}



// ADD THESE TWO METHODS

isHeadOfficeDepartment(dept: any): boolean {
  return dept.branch_id == null;
}

isBranchDepartment(dept: any): boolean {
  return dept.branch_id != null;
}









  // loadDepartments() {
  //   if (!this.currentAssignment) return;

  //   if (this.currentAssignment.type === 'head_office') {
    
     

  //     // NEW:
  //   // Get both Head Office + Branch departments
  //   this.user.getDepartmentsForHeadOfficeAdmin(this.currentAssignment.id).subscribe({
  //     next: (res: any[]) => {

  //       this.departments = res;

  //       this.departments.forEach((_, index) => {
  //         if (!this.departmentRoles[index]) {
  //           this.departmentRoles[index] = [];
  //         }
  //       });

  //       // Load roles for ALL departments
  //       this.loadDepartmentRoles();
  //     },

  //     error: (err) => {
  //       console.error('Failed to load HO departments:', err);
  //       this.toast.show('Failed to load departments', 'error');
  //     }
  //   });

  // }
    
    
    
    
    
  //   else {
  //     this.user.getDepartmentsByBranch(this.currentAssignment.id).subscribe({
  //       next: (res: any) => {
  //         this.user.getBranchById(this.currentAssignment!.id).subscribe((branchRes) => {
  //           this.branchInfo = branchRes;
  //         });
  //         this.departments = res;
  //         this.departments.forEach((_, index) => {
  //           if (!this.departmentRoles[index]) {
  //             this.departmentRoles[index] = [];
  //           }
  //         });
          
  //         // Load department roles after departments are loaded
  //         if (this.departments.length > 0) {
  //           this.loadDepartmentRoles();
  //         }
          
  //         // Update UI logic after loading departments
  //         this.updateUILogic();
  //       },
  //       error: () => {
  //         this.toast.show('Failed to load departments', 'error');
  //       }
  //     });
  //   }
  // }

  // Add new method to handle UI logic
  
  loadDepartments() {
  if (!this.currentAssignment) return;

  // ==============================
  // HEAD OFFICE ADMIN
  // ==============================
  if (this.currentAssignment.type === 'head_office') {

    this.user.getDepartmentsForHeadOfficeAdmin(this.currentAssignment.id).subscribe({
      next: (res: any[]) => {

        console.log('All departments for HO Admin:', res);

        // Keep complete API response
        this.allDepartments = res || [];

        // Separate departments
        this.headOfficeDepartments = this.allDepartments.filter(
          dept => dept.branch_id == null
        );

        this.branchDepartments = this.allDepartments.filter(
          dept => dept.branch_id != null
        );

        console.log('Head Office Departments:', this.headOfficeDepartments);
        console.log('Branch Departments:', this.branchDepartments);

        // Initially show Head Office departments
        this.selectedDepartmentType = 'head_office';
        this.departments = [...this.headOfficeDepartments];

        // Reset role data
        this.departmentRoles = {};
        this.selectedDepartmentIndex = -1;
        this.selectedDepartment = null;

        // Initialize department role arrays
        this.departments.forEach((_, index) => {
          this.departmentRoles[index] = [];
        });

        // Load roles for displayed departments
        this.loadDepartmentRoles();

        this.updateUILogic();
      },

      error: (err) => {
        console.error('Failed to load HO departments:', err);
        this.toast.show('Failed to load departments', 'error');
      }
    });

  }

  // ==============================
  // BRANCH ADMIN
  // ==============================
  else {

    this.user.getDepartmentsByBranch(this.currentAssignment.id).subscribe({
      next: (res: any) => {

        this.user.getBranchById(this.currentAssignment!.id).subscribe((branchRes) => {
          this.branchInfo = branchRes;
        });

        this.departments = res;

        this.departments.forEach((_, index) => {
          if (!this.departmentRoles[index]) {
            this.departmentRoles[index] = [];
          }
        });

        // Load department roles after departments are loaded
        if (this.departments.length > 0) {
          this.loadDepartmentRoles();
        }

        this.updateUILogic();
      },

      error: () => {
        this.toast.show('Failed to load departments', 'error');
      }
    });
  }
}
  

//Loaddepartment for head_office admin and branch admin
 onDepartmentTypeChange() {

  if (this.currentAssignment?.type !== 'head_office') {
    return;
  }

  // Reset selected department
  this.selectedDepartmentIndex = -1;
  this.selectedDepartment = null;
  this.currentRoleName = '';

  // Clear old role mapping because indexes are changing
  this.departmentRoles = {};

  if (this.selectedDepartmentType === 'head_office') {

    // Show Head Office departments
    this.departments = [...this.headOfficeDepartments];

  } else {

    // Show Branch departments
    this.departments = [...this.branchDepartments];
  }

  // Initialize role arrays
  this.departments.forEach((_, index) => {
    this.departmentRoles[index] = [];
  });

  // Load roles for currently displayed departments
  if (this.departments.length > 0) {
    this.loadDepartmentRoles();
  }

  this.updateUILogic();

  console.log(
    'Selected department type:',
    this.selectedDepartmentType
  );

  console.log(
    'Displayed departments:',
    this.departments
  );
}
  
  
  
  
  
  
  
  
  
  
  updateUILogic() {
    const noDepartments = this.departments.length === 0;
    const noBranchRoles = this.branchRoles.length === 0;

    if (noDepartments) {
      if (noBranchRoles) {
        // Show dialog when both departments and branch roles are absent
        this.allowDirectRole = true;
        this.showDirectRoleForm = false;
      } else {
        // Show direct form when no departments but has branch roles
        this.allowDirectRole = true;
        this.showDirectRoleForm = true;
      }
    } else {
      // Has departments, don't show direct role options
      this.allowDirectRole = false;
      this.showDirectRoleForm = false;
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
     setTimeout(() => {
    const input = document.querySelector(`input[data-edit="${this.editingRole}"]`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select(); // This will highlight/select all text
    }
  }, 100);
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
     setTimeout(() => {
    const input = document.querySelector(`input[data-edit="${this.editingRole}"]`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select(); // This will highlight/select all text
    }
  }, 100);
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
        head_office_id: this.currentAssignment?.type==='branch'? this.branchInfo?.head_office_id : department.head_office_id,
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
    
    // Swap immediately in UI
    [roles[roleIndex], roles[roleIndex - 1]] = [roles[roleIndex - 1], roles[roleIndex]];
    
    // Clear any existing timeout
    if (this.positionUpdateTimeout) {
      clearTimeout(this.positionUpdateTimeout);
    }
    
    // Debounce the API call
    this.positionUpdateTimeout = setTimeout(() => {
      this.syncPositionsWithBackend(deptIndex);
    }, 500); // Wait 500ms after last move
  }
}

moveRoleDown(deptIndex: number, roleIndex: number) {
  const roles = this.departmentRoles[deptIndex];
  if (roleIndex < roles.length - 1 && roles) {
    
    // Swap immediately in UI
    [roles[roleIndex], roles[roleIndex + 1]] = [roles[roleIndex + 1], roles[roleIndex]];
    
    // Clear any existing timeout
    if (this.positionUpdateTimeout) {
      clearTimeout(this.positionUpdateTimeout);
    }
    
    // Debounce the API call
    this.positionUpdateTimeout = setTimeout(() => {
      this.syncPositionsWithBackend(deptIndex);
    }, 500); // Wait 500ms after last move
  }
}

// New method to sync positions
private syncPositionsWithBackend(deptIndex: number) {
  const roles = this.departmentRoles[deptIndex];
  const updates: { id: number; position: number }[] = [];
  
  roles.forEach((role, index) => {
    const newPosition = index + 1;
    role.position = newPosition;
    updates.push({ id: role.id, position: newPosition });
  });

  this.user.updateRolePositions(updates).subscribe({
    next: () => {
      console.log('Positions synced successfully');
    },
    error: (err) => {
      console.error('Error syncing positions:', err);
      // Reload data to get correct state
      this.loadDepartmentRoles();
      this.toast.show('Failed to update positions. Reloaded data.', 'error');
    }
  });
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


//Delet method for department 
deleteDepartment(dept: any, index: number): void {

  // Extra frontend protection
  if (this.hasDepartmentRoles(index)) {
    this.toast.show(
      'This department cannot be deleted because roles are assigned to it.',
      'error'
    );
    return;
  }

  const confirmed = confirm(
    `Are you sure you want to delete the department "${dept.name}"?`
  );

  if (!confirmed) {
    return;
  }

  this.deletingDepartmentId = dept.id;

  this.user.deleteDepartment(dept.id).subscribe({
    next: (response) => {

      console.log('Department deleted successfully:', response);

      // Remove from currently displayed departments
      this.departments.splice(index, 1);

      // Remove from role mapping
      delete this.departmentRoles[index];

      // Rebuild role mapping because array indexes changed
      const oldRoles = this.departmentRoles;
      this.departmentRoles = {};

      this.departments.forEach((department, newIndex) => {
        const oldIndex = this.departments.findIndex(
          d => d.id === department.id
        );

        this.departmentRoles[newIndex] = oldRoles[oldIndex] || [];
      });

      // Also remove from master arrays
      this.allDepartments = this.allDepartments.filter(
        d => d.id !== dept.id
      );

      this.headOfficeDepartments = this.headOfficeDepartments.filter(
        d => d.id !== dept.id
      );

      this.branchDepartments = this.branchDepartments.filter(
        d => d.id !== dept.id
      );

      // Close expanded department if deleted department was open
      this.selectedDepartmentIndex = -1;
      this.selectedDepartment = null;

      this.toast.show(
        'Department deleted successfully',
        'success'
      );

      this.deletingDepartmentId = null;

      // Recalculate UI
      this.updateUILogic();
    },

    error: (err) => {

      console.error('Error deleting department:', err);

      this.toast.show(
        err.error?.error ||
        'Failed to delete department',
        'error'
      );

      this.deletingDepartmentId = null;
    }
  });
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