import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CircularService } from '../../services/circular-service';
import {ActivatedRoute, Router } from '@angular/router';
import { Toast } from '../../toast/toast';

import { response } from 'express';

// interface Circular {
//   id: number;
//   title: string;
//   content: string;
//   category: string;
//   priority: string;
//   status: 'DRAFT' | 'pending' | 'approved' | 'rejected';
//   createdDate: Date;
//   approver: string;
//   remarks?: string;
// }

export interface Circular {
  id: number;
  title: string;
  content: string;
    item_type?: 'CIRCULAR' | 'HO_ASSIGNMENT';
  circular_code: string;
  send_type: 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'PUBLIC' | 'CUSTOM';
  // status: 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'APPROVED' | 'PUBLISHED'; 

  status: 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'APPROVED' | 'PUBLISHED' | 'COMPLETED';
  effective_from: string; // ISO date string
  published_at: string | null; // ISO date string or null
  created_at: string; // ISO date string
  priority: string;
  pdf: string;

  source_type_name: string | null;
  repeat_cycle_name: string | null;
  repeat_cycle_duration: number | null;

  creator: {
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email: string;
  };

  approvals: Approval[];
}

export interface Approval {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments: string | null;
  updated_at: string; // ISO date string
  approver: {
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email: string;
  };
}

@Component({
  selector: 'app-circular-creater',
  imports: [CommonModule, FormsModule],
  templateUrl: './circular-creater.html',
  styleUrl: './circular-creater.scss',
})
export class CircularCreater implements OnInit {
  circulars = signal<Circular[]>([]); 


    currentType: 'CIRCULAR' | 'HO_ASSIGNMENT' = 'CIRCULAR';
  employee: any;
  // Add these signals to your component
  pdfViewUrl = signal<string | null>(null);
  showPdfModal = signal(false);
  // PAGE SIZE
  pageSize = 10;
  currentPage = signal(1);

//VAriable to store the Assigned circular

// assignedCirculars: any[] = [];
assignedCirculars = signal<any[]>([]);

  constructor(
    private circularService: CircularService,
    private router: Router,
    private toast: Toast,
    private route: ActivatedRoute
   
  ) {}

  private decryptData(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch (error) {
      return '';
    }
  }
  isDarkMode = false;

toggleDarkMode() {
  this.isDarkMode = !this.isDarkMode;
}


  ngOnInit(): void {
    
      // this.loadEmployeeData(); 
 this.route.queryParams.subscribe(params => {

    const type = params['type'];

    if (type === 'HO_ASSIGNMENT') {
      this.currentType = 'HO_ASSIGNMENT';
    } else {
      this.currentType = 'CIRCULAR';
    }

    console.log('Circular Creator Type:', this.currentType);

    this.loadEmployeeData();
  });






  }
  // private loadCircular() {
  //   if (this.employee?.id) {
  //     this.circularService
  //       .getCircularByCreaterId(this.employee.id)
  //       .subscribe((circularData: Circular[]) => {
  //         console.log('Fetched circulars:', circularData);
  //         this.circulars.set(circularData); // <- use .set(), do NOT assign
  //       });
  //   }
  // }

private loadCircular() {
  if (this.employee?.id) {
    this.circularService
      .getCircularByCreaterId(this.employee.id)
      .subscribe((circularData: Circular[]) => {

        console.log('Fetched circulars:', circularData);
        console.log('Current Type:', this.currentType);

        const filteredData = circularData.filter(
          item => item.item_type === this.currentType
        );

        console.log('Filtered data:', filteredData);

        this.circulars.set(filteredData);
      });
  }
}


  private loadEmployeeData(): void {
    if (typeof window !== 'undefined') {
      const encryptedUser = localStorage.getItem('emp_user');
      if (encryptedUser) {
        const decryptedUser = this.decryptData(encryptedUser);
        this.employee = JSON.parse(decryptedUser);
        console.log('Logged in employee:', this.employee);
        // CALL HERE
      this.loadCircular();
      }
    }
  }

  showCreateModal = signal(false);
  // selectedCircular = signal<Circular | null>(null);

  // Form fields
  newCircular = {
    title: '',
    content: '',
    category: 'General',
    priority: 'Medium',
    approver: '',
  };

  // Statistics
  // get stats() {
  //   const circs = this.circulars();
  //   return {
  //     total: circs.length,
  //     pending: circs.filter((c) => c.status === 'PENDING_APPROVAL').length,
  //     approved: circs.filter((c) => c.status === 'APPROVED').length,
  //     rejected: circs.filter((c) => c.status === 'REJECTED').length,
  //   };
  // } 
  get stats() {
  const circs = this.circulars();

  if (this.currentType === 'HO_ASSIGNMENT') {
    return {
      total: circs.length,
      pending: circs.filter((c) => c.status === 'DRAFT').length,
      approved: circs.filter((c) => c.status === 'PUBLISHED').length,
      rejected: circs.filter((c) => c.status === 'COMPLETED').length,
    };
  }

  return {
    total: circs.length,
    pending: circs.filter((c) => c.status === 'PENDING_APPROVAL').length,
    approved: circs.filter((c) => c.status === 'APPROVED').length,
    rejected: circs.filter((c) => c.status === 'REJECTED').length,
  };
}

  // Filter state
  filterStatus = signal<string>('all');

  // Computed signal for filtered circulars
  filteredCirculars = computed(() => {
  //   const status = this.filterStatus();
  //   if (status === 'all') return this.circulars();
    
  //   //Assigned Circulars
  //    if (status === 'ASSIGNED') {
  //   return this.assignedCirculars;
  // }

  //   this.currentPage = signal(1);
  //   return this.circulars().filter((c) => c.status === status);
   const status = this.filterStatus();

  if (status === 'all') {
    return this.circulars();
  }

  if (status === 'ASSIGNED') {
    return this.assignedCirculars();
  }

  return this.circulars().filter(c => c.status === status);
  });



  createNewCircular() {
    this.router.navigate(['/employee/create-circular']);
  } 

  createNewHOAssignment() {
  this.router.navigate(['/employee/create-circular'], {
    queryParams: { mode: 'HO_ASSIGNMENT' }
  });
}

  // closeModal() {
  //   this.selectedCircular.set(null);
  // }

  resetForm() {
    this.newCircular = {
      title: '',
      content: '',
      category: 'General',
      priority: 'Medium',
      approver: '',
    };
  }

  sendForApproval(circular: Circular) {
    this.circulars.update((circs) =>
      circs.map((c) => (c.id === circular.id ? { ...c, status: 'PENDING_APPROVAL' as const } : c))
    );
  }

  viewDetails(circular: Circular) {
    // this.selectedCircular.set(circular);
 this.router.navigate(['/employee/circular-details'], {
    queryParams: {
      circularId: circular.id
    }
  });

  }

  deleteCircular(id: number) {
    this.toast
      .confirm({
        message: 'Are you sure you want to delete this circular?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger',
      })
      .subscribe((confirm) => {
        if (confirm) {
          this.circularService.deleteCircular(id).subscribe({
            next: (response) => {
              this.toast.show('Circular deleted successfully', 'success');
              this.loadCircular();
            },
            error: (error) => {
              this.toast.show(error.error?.message || 'Failed to delete circular', 'error');
            },
          });
        }
      });
  }

  editCircular(circular: Circular) {
    this.router.navigate(['/employee/edit-circular'], {
      queryParams: { id: circular.id, status: 'edit' },
    });
  }

  getRejectionApproval(circular: Circular): Approval | null {
    return circular.approvals?.find((approval) => approval.status === 'REJECTED') || null;
  }

  showPdf(circular: Circular) {
    if (!circular.pdf) {
      this.toast.show('No PDF available for this circular', 'error');
      return;
    }

    try {
      // Decode the base64 PDF data
      const pdfData = atob(circular.pdf);

      // Convert to Uint8Array
      const bytes = new Uint8Array(pdfData.length);
      for (let i = 0; i < pdfData.length; i++) {
        bytes[i] = pdfData.charCodeAt(i);
      }

      // Create blob from the PDF data
      const blob = new Blob([bytes], { type: 'application/pdf' });

      // Create object URL
      const pdfUrl = URL.createObjectURL(blob);

      // Open in new tab
      const pdfWindow = window.open(pdfUrl, '_blank');

      if (!pdfWindow) {
        this.toast.show('Please allow popups to view PDF', 'error');
        return;
      }

      // Focus the new window
      pdfWindow.focus();

      // Clean up the URL after some time
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    } catch (error) {
      console.error('Error displaying PDF:', error);
      this.toast.show('Error displaying PDF', 'error');
    }
  }

  getFilteredApprovals(circular: Circular): Approval[] {
    if (!circular.approvals || circular.approvals.length === 0) {
      return [];
    }

    // If circular is approved, show only the most recent APPROVED approver
    if (circular.status === 'APPROVED') {
      const approvedApprovals = circular.approvals
        .filter((approval) => approval.status === 'APPROVED')
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      return approvedApprovals.length > 0 ? [approvedApprovals[0]] : [];
    }

    // If circular is rejected, show only the most recent REJECTED approver
    if (circular.status === 'REJECTED') {
      const rejectedApprovals = circular.approvals
        .filter((approval) => approval.status === 'REJECTED')
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      return rejectedApprovals.length > 0 ? [rejectedApprovals[0]] : [];
    }

    // For other statuses (DRAFT, PENDING_APPROVAL), show all approvers
    return circular.approvals;
  }

  //------------------------------------pagination code-----------------------------------------------

  // compute total pages dynamically
  totalPages = computed(() => Math.ceil(this.filteredCirculars().length / this.pageSize));

  // paginated circulars
  paginatedCirculars = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredCirculars().slice(start, start + this.pageSize);
  });

  // Go to page
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  // Generate limited page numbers (prev 2, current, next 2)
  paginationPages = computed(() => {
    const pages = [];
    const total = this.totalPages();
    const current = this.currentPage();

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  });

  getApprovalStatusColor(status: string): string {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  }

  // getStatusColor(status: string): string {
  //   const colors = {
  //     DRAFT: 'bg-gray-100 text-gray-800',
  //     PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  //     APPROVED: 'bg-green-100 text-green-800',
  //     REJECTED: 'bg-red-100 text-red-800',
  //   };
  //   return colors[status as keyof typeof colors] || colors.DRAFT;
  // }



getStatusColor(status: string): string {
  const colors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PUBLISHED: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
  };

  return colors[status as keyof typeof colors] || colors.DRAFT;
}




  getPriorityColor(priority: string): string {
    const colors = {
      URGENT: 'text-red-600',
      HIGH: 'text-orange-500',
      MEDIUM: 'text-yellow-500',
      LOW: 'text-green-600',
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  }

//LoadAssignCirculars
loadAssignedCirculars() {
 
     this.filterStatus.set('ASSIGNED');

 const employee = this.employee;

if (!employee) {
  return;
}

  this.circularService
    .getAssignedCirculars(employee.id)
    .subscribe({

      next: (response) => {

        console.log(response);

        // this.assignedCirculars = response.data;
        // this.assignedCirculars.set(response.data);
this.assignedCirculars.set(response.data);
      },

      error: (err) => {

        console.error(err);

      }

    });

}

}
