import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CircularService } from '../../services/circular-service';

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
  circular_code: string;
  send_type: 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'PUBLIC' | 'CUSTOM';
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'APPROVED' | 'PUBLISHED';
  effective_from: string; // ISO date string
  published_at: string | null; // ISO date string or null
  created_at: string; // ISO date string

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
  employee: any;

  constructor(private circularService: CircularService) {}

  private decryptData(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch (error) {
      return '';
    }
  }

  ngOnInit(): void {
    this.loadEmployeeData();

    if (this.employee?.id) {
      this.circularService
        .getCircularByCreaterId(this.employee.id)
        .subscribe((circularData: Circular[]) => {
          console.log('Fetched circulars:', circularData);
          this.circulars.set(circularData); // <- use .set(), do NOT assign
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
      }
    }
  }

  // circulars = signal<Circular[]>([
  //   {
  //     id: 1,
  //     title: 'Holiday Notice - Diwali 2025',
  //     content: 'Office will remain closed from Oct 20-24 for Diwali celebrations.',
  //     category: 'Holiday',
  //     priority: 'High',
  //     status: 'REJECTED',
  //     createdDate: new Date('2025-10-01'),
  //     approver: 'Mr. Sharma',
  //     remarks: 'Approved with schedule adjustments',
  //   },
  //   {
  //     id: 2,
  //     title: 'New Parking Policy',
  //     content: 'Updated parking guidelines for all employees effective immediately.',
  //     category: 'Policy',
  //     priority: 'Medium',
  //     status: 'PENDING_APPROVAL',
  //     createdDate: new Date('2025-10-03'),
  //     approver: 'Ms. Patel',
  //   },
  //   {
  //     id: 3,
  //     title: 'Team Meeting Schedule',
  //     content: 'Weekly team meetings scheduled every Monday at 10 AM.',
  //     category: 'Meeting',
  //     priority: 'Low',
  //     status: 'DRAFT',
  //     createdDate: new Date('2025-10-02'),
  //     approver: 'Mr. Kumar',
  //   },
  // ]);

  showCreateModal = signal(false);
  selectedCircular = signal<Circular | null>(null);

  // Form fields
  newCircular = {
    title: '',
    content: '',
    category: 'General',
    priority: 'Medium',
    approver: '',
  };

  // Statistics
  get stats() {
    const circs = this.circulars();
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
    const status = this.filterStatus();
    if (status === 'all') return this.circulars();
    return this.circulars().filter((c) => c.status === status);
  });

  openCreateModal() {
    this.showCreateModal.set(true);
    this.resetForm();
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.selectedCircular.set(null);
  }

  resetForm() {
    this.newCircular = {
      title: '',
      content: '',
      category: 'General',
      priority: 'Medium',
      approver: '',
    };
  }

  createCircular() {
    if (!this.newCircular.title || !this.newCircular.content || !this.newCircular.approver) {
      alert('Please fill all required fields');
      return;
    }

    // const circular: Circular = {
    //   id: Date.now(),
    //   title: this.newCircular.title,
    //   content: this.newCircular.content,
    //   category: this.newCircular.category,
    //   priority: this.newCircular.priority,
    //   status: 'DRAFT',
    //   createdDate: new Date(),
    //   approver: this.newCircular.approver,
    // };

    // this.circulars.update((circs) => [...circs, circular]);
    this.closeCreateModal();
  }

  sendForApproval(circular: Circular) {
    this.circulars.update((circs) =>
      circs.map((c) => (c.id === circular.id ? { ...c, status: 'PENDING_APPROVAL' as const } : c))
    );
  }

  viewDetails(circular: Circular) {
    this.selectedCircular.set(circular);
  }

  deleteCircular(id: number) {
    if (confirm('Are you sure you want to delete this circular?')) {
      this.circulars.update((circs) => circs.filter((c) => c.id !== id));
    }
  }

  getStatusColor(status: string): string {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.DRAFT;
  }

  getPriorityColor(priority: string): string {
    const colors = {
      High: 'text-red-600',
      Medium: 'text-yellow-600',
      Low: 'text-green-600',
    };
    return colors[priority as keyof typeof colors] || colors.Medium;
  }
}
