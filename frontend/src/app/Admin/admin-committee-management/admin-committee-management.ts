import { Component, OnInit } from '@angular/core';

// import {
//   FormBuilder,
//   FormGroup,
//   ReactiveFormsModule,
//   Validators,
// } from '@angular/forms';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';




import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { User } from '../../services/user';
import { Toast } from '../../toast/toast';

@Component({
  selector: 'app-admin-committee-management',
  standalone: true,
  imports: [
    // CommonModule,
    // NgFor,
    // NgIf,
    // ReactiveFormsModule,
    // DatePipe,
    // MatIconModule,
     CommonModule,
  NgFor,
  NgIf,
  ReactiveFormsModule,
  FormsModule,
  DatePipe,
  MatIconModule,
  ],
  templateUrl: './admin-committee-management.html',
  styleUrl: './admin-committee-management.scss',
})
export class AdminCommitteeManagement implements OnInit {

  committees: any[] = [];
  memberTypes: any[] = [];

  //VAriables for assigning employee to commitee 
  employees: any[] = [];

committeeMembers: any[] = [];

selectedCommittee: any = null;

selectedEmployeeIds: number[] = [];
employeeSearch = '';

showAssignEmployee = false;

//Variables for excel upload functinality 
// Excel upload
showExcelUpload = false;
excelFile: File | null = null;
excelUploading = false;




  committeeForm: FormGroup;

  showForm = false;

  isEditMode = false;

  editCommitteeId: number | null = null;

  loading = false;

  isButtonLoading = false;

  constructor(
    private userService: User,
    private fb: FormBuilder,
    private toast: Toast
  ) {

    this.committeeForm = this.fb.group({

      committee_name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
        ],
      ],

      description: [''],

      status: [
        'ACTIVE',
        Validators.required,
      ],

      member_type_ids: [[]],

    });

  }

  ngOnInit(): void {

    this.loadCommittees();
    this.loadActiveMemberTypes();

  }  


  // Load all committees
loadCommittees() {
  this.loading = true;

  this.userService.fetchAllCommittees().subscribe({
    next: (data: any) => {
      this.committees = data;
      this.loading = false;
    },
    error: (err) => {
      console.error(err);
      this.toast.show('Failed to load committees!', 'error');
      this.loading = false;
    },
  });
}

// Load only active types through the existing Member Type module.
loadActiveMemberTypes() {
  this.userService.getActiveMemberTypes().subscribe({
    next: (response: any) => {
      this.memberTypes = response.data || [];
    },
    error: (err) => {
      console.error(err);
      this.toast.show('Failed to load member types!', 'error');
    },
  });
}

isMemberTypeSelected(memberTypeId: number): boolean {
  return (this.committeeForm.get('member_type_ids')?.value || [])
    .includes(memberTypeId);
}

toggleMemberType(memberTypeId: number, isSelected: boolean) {
  const selectedIds = this.committeeForm.get('member_type_ids')?.value || [];
  const updatedIds = isSelected
    ? [...new Set([...selectedIds, memberTypeId])]
    : selectedIds.filter((id: number) => id !== memberTypeId);

  this.committeeForm.patchValue({ member_type_ids: updatedIds });
}

// Show / Hide Form
toggleForm() {
  this.showForm = !this.showForm;

  if (!this.showForm) {
    this.resetForm();
  }
}

// Create / Update Committee
submitForm() {

  if (this.committeeForm.invalid) {
    this.committeeForm.markAllAsTouched();
    return;
  }

  const committee = {
    ...this.committeeForm.value,
  };

  this.isButtonLoading = true;

  // UPDATE
  if (this.isEditMode && this.editCommitteeId) {

    this.userService
      .updateCommittee(this.editCommitteeId, committee)
      .subscribe({

        next: () => {

          this.toast.show(
            'Committee updated successfully!',
            'success'
          );

          this.loadCommittees();

          this.resetForm();

          this.isButtonLoading = false;

        },

        error: (err) => {

          console.error(err);

          this.toast.show(
            'Failed to update committee!',
            'error'
          );

          this.isButtonLoading = false;

        },

      });

  }

  // CREATE
  else {

    this.userService
      .createCommittee(committee)
      .subscribe({

        next: () => {

          this.toast.show(
            'Committee created successfully!',
            'success'
          );

          this.loadCommittees();

          this.resetForm();

          this.isButtonLoading = false;

        },

        error: (err) => {

          console.error(err);

          this.toast.show(
            'Failed to create committee!',
            'error'
          );

          this.isButtonLoading = false;

        },

      });

  }

} 


// Edit Committee
editCommittee(committee: any) {

  this.isEditMode = true;

  this.editCommitteeId = committee.id;

  this.userService.getCommitteeById(committee.id).subscribe({
    next: (committeeDetails: any) => {
      this.committeeForm.patchValue({
        committee_name: committeeDetails.committee_name,
        description: committeeDetails.description,
        status: committeeDetails.status,
        member_type_ids: committeeDetails.member_type_ids || [],
      });

      this.showForm = true;
    },
    error: (err) => {
      console.error(err);
      this.toast.show('Failed to load committee details!', 'error');
    },
  });

}

// Delete Committee
deleteCommittee(id: number) {

  const confirmDelete = confirm(
    'Are you sure you want to delete this committee?'
  );

  if (!confirmDelete) {
    return;
  }

  this.userService.deleteCommittee(id).subscribe({

    next: () => {

      this.toast.show(
        'Committee deleted successfully!',
        'success'
      );

      this.loadCommittees();

    },

    error: (err) => {

      console.error(err);

      this.toast.show(
        'Failed to delete committee!',
        'error'
      );

    },

  });

} 

//Assign Employee Method 
assignEmployees(committee: any) {

  this.selectedCommittee = committee;

  this.showAssignEmployee = true;

  this.selectedEmployeeIds = [];
  this.employeeSearch = '';
  this.employees = [];

  this.loadEmployees(committee.id);

    this.loadCommitteeMembers(committee.id);




}   


//Close assign employee modal 

closeAssignEmployee() {
  this.showAssignEmployee = false;
  
  this.selectedCommittee = null;
  this.selectedEmployeeIds = [];
  this.employeeSearch = '';
}






//These is for openexcel upload button 

openExcelUpload(committee: any) {
  this.selectedCommittee = committee;

  this.excelFile = null;
  this.showExcelUpload = true;
}

//onexcelfile selcted
onExcelFileSelected(event: Event) {

  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) {
    this.excelFile = null;
    return;
  }

  const file = input.files[0];

  const allowedExtensions = ['.xlsx', '.xls'];

  const fileName = file.name.toLowerCase();

  const isExcelFile = allowedExtensions.some(
    extension => fileName.endsWith(extension)
  );

  if (!isExcelFile) {

    this.toast.show(
      'Please select an Excel file (.xlsx or .xls)',
      'error'
    );

    input.value = '';
    this.excelFile = null;

    return;
  }

  this.excelFile = file;

  console.log('Selected Excel:', file);
} 

//upload method 
uploadCommitteeExcel() {

  if (!this.selectedCommittee) {
    this.toast.show(
      'Please select a committee!',
      'error'
    );
    return;
  }

  if (!this.excelFile) {
    this.toast.show(
      'Please select an Excel file!',
      'error'
    );
    return;
  }

  const formData = new FormData();

  formData.append(
    'committee_id',
    this.selectedCommittee.id.toString()
  );

  formData.append(
    'file',
    this.excelFile
  );

  this.excelUploading = true;

  this.userService
    .uploadCommitteeMembersExcel(formData)
    .subscribe({

      next: (res: any) => {

        console.log('Excel upload response:', res);

        this.toast.show(
          res.message || 'Employees assigned successfully!',
          'success'
        );

        this.excelFile = null;
        this.excelUploading = false;
        this.showExcelUpload = false;

        // Refresh existing committee members
        if (this.selectedCommittee) {
          this.loadCommitteeMembers(
            this.selectedCommittee.id
          );
        }

      },

      error: (err) => {

        console.error(
          'Excel upload error:',
          err
        );

        this.toast.show(
          err.error?.message ||
          'Failed to upload Excel!',
          'error'
        );

        this.excelUploading = false;
      }

    });
}





//Load Employees for assigning to commitee 
loadEmployees(committeeId: number) {

  this.userService.getEligibleCommitteeEmployees(committeeId).subscribe({

    next: (data: any) => {

      this.employees = data;

      console.log("Employees:", this.employees);

    },

    error: (err) => {

      console.error(err);

      this.toast.show(
        'Failed to load employees!',
        'error'
      );

    }

  });

}


get filteredEmployees(): any[] {
  const search = this.employeeSearch.trim().toLowerCase();

  if (!search) {
    return this.employees;
  }

  return this.employees.filter((employee) =>
    `${employee.employee_id} ${employee.first_name} ${employee.middle_name || ''} ${employee.last_name} ${employee.role_name || ''}`
      .toLowerCase()
      .includes(search)
  );
}

isEmployeeSelected(employeeId: number): boolean {
  return this.selectedEmployeeIds.includes(employeeId);
}

toggleEmployee(employeeId: number, isSelected: boolean) {
  this.selectedEmployeeIds = isSelected
    ? [...new Set([...this.selectedEmployeeIds, employeeId])]
    : this.selectedEmployeeIds.filter((id) => id !== employeeId);
}

areAllVisibleEmployeesSelected(): boolean {
  return this.filteredEmployees.length > 0 &&
    this.filteredEmployees.every((employee) => this.isEmployeeSelected(employee.id));
}

toggleAllVisibleEmployees(isSelected: boolean) {
  const visibleIds = this.filteredEmployees.map((employee) => employee.id);
  this.selectedEmployeeIds = isSelected
    ? [...new Set([...this.selectedEmployeeIds, ...visibleIds])]
    : this.selectedEmployeeIds.filter((id) => !visibleIds.includes(id));
}

// Save every selected employee through the existing committee member API.
saveCommitteeMember() {

  // if (!this.selectedCommittee) {
  //   this.toast.show('Please select a committee!', 'error');
  //   return;
  // }

  // if (this.selectedEmployeeIds.length === 0) {
  //   this.toast.show('Please select at least one employee!', 'error');
  //   return;
  // }

  // const payload = {
  //   committee_id: this.selectedCommittee.id,
  //   employee_ids: this.selectedEmployeeIds
  // };

  // console.log(payload);

  // this.userService.addCommitteeMember(payload).subscribe({

  //   next: (res: any) => {

  //     console.log(res);

  //     this.toast.show(
  //       'Employees assigned successfully!',
  //       'success'
  //     );

  //     this.selectedEmployeeIds = [];

  //     // Reload members
  //     this.loadCommitteeMembers(this.selectedCommittee.id);

  //   },

  //   error: (err) => {

  //     console.error(err);

  //     this.toast.show(
  //       'Failed to assign employee!',
  //       'error'
  //     );

  //   }

  // });
if (!this.selectedCommittee) {
    this.toast.show('Please select a committee!', 'error');
    return;
  }

  if (this.selectedEmployeeIds.length === 0) {
    this.toast.show('Please select at least one employee!', 'error');
    return;
  }

  const payload = {
    committee_id: this.selectedCommittee.id,
    employee_ids: this.selectedEmployeeIds
  };

  console.log('Saving committee members:', payload);

  this.userService.addCommitteeMember(payload).subscribe({

    next: (res: any) => {
      console.log(res);

  this.toast.show(
    'Employees assigned successfully!',
    'success'
  );

  const committeeId = this.selectedCommittee.id;

  this.selectedEmployeeIds = [];

  // Close popup
  this.showAssignEmployee = false;

  // Reload assigned employees
  this.loadCommitteeMembers(committeeId);




     
    },

    error: (err) => {

      console.error('Assign employee error:', err);

      this.toast.show(
        'Failed to assign employee!',
        'error'
      );

    }

  });

}


//LoadCommitee Members
loadCommitteeMembers(committeeId: number) {
  console.log('Loading committee members for:', committeeId);
  this.userService.getCommitteeMembers(committeeId).subscribe({

    next: (data: any) => {

      this.committeeMembers = data;

      console.log("Committee Members", data);

    },

    error: (err) => {

      console.error(err);

    }

  });

}

//remove functinality 
removeMember(memberId: number) {

  if (!confirm('Remove this employee from committee?')) {
    return;
  }

  this.userService.removeCommitteeMember(memberId).subscribe({

    next: () => {

      this.toast.show(
        'Employee removed successfully!',
        'success'
      );

      this.loadCommitteeMembers(this.selectedCommittee.id);

    },

    error: (err) => {

      console.error(err);

      this.toast.show(
        'Failed to remove employee!',
        'error'
      );

    }

  });

}

// Reset Form
resetForm() {

  this.committeeForm.reset({

    status: 'ACTIVE'

  });

  this.showForm = false;

  this.isEditMode = false;

  this.editCommitteeId = null;

} 

clearForm(): void {
  this.committeeForm.reset({
    committee_name: '',
    description: '',
    status: 'ACTIVE',
    member_type_ids: []
  });

  // Keep the form open
  this.showForm = true;

  // Switch back to Add mode
  this.isEditMode = false;

  // Clear edit ID
  this.editCommitteeId = null;

  // Remove validation messages
  this.committeeForm.markAsPristine();
  this.committeeForm.markAsUntouched();
}
}



