import { Component, OnInit, OnDestroy } from '@angular/core';
import { CircularService } from '../../services/circular-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EmployeeService } from '../../services/employee-service';
import { Subject, takeUntil, filter, switchMap, tap, take } from 'rxjs';
import { Toast } from '../../toast/toast';

interface Circular {
  circular_id: number;
  title: string;
  content: string;
  circular_code: string;
  source_type_id: number;
  source_type_name: string;
  effective_from: string;
  send_type: string;
  status: string;
  repeat_cycle: string;
  created_at: string;
  creator_employee_id: number;
  creator_name?: string;
  has_seen?: boolean;
  seen_at?: string;
  approval_status?: string;
  circular_status: string;
  comments: string;
  receiver_departments: string;
  receiver_branches: string;
  creator_first_name: string;
  creator_last_name: string;
  reference_circular_title: string;
  reference_circular_code: string;
  reference_circular_id: number;
  approved_by:string;
  rejected_by:string;
  approval_updated_at:string; 
  approved_count: number;
  total_approvers: number;
  priority:'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

}

interface ApprovalTable {
  id: number;
  circular_id: number;
  approver_id: number;
  has_seen: boolean;
  seen_at: string;
  status: string;
  comments: string;
  updated_at: string;
}

@Component({
  selector: 'app-circular-approval',
  imports: [CommonModule, FormsModule],
  templateUrl: './circular-approval.html',
  styleUrl: './circular-approval.scss',
})
export class CircularApproval implements OnInit, OnDestroy {
  circulars: Circular[] = [];
  filteredCirculars: Circular[] = [];
  loading: boolean = true;
  pdfUrl: SafeResourceUrl | null = null;
  showPdfViewer = false;
  selectedCircularTitle: string = '';
  currentPdfBlob: Blob | null = null;
  showRejectModal: boolean = false;
  selectedCircularForAction: Circular | null = null;
  rejectionComment: string = '';
  reviewerData: any = null;
  ApprovalDataByEmpId: any = [];
  showDetailsModal: boolean = false;
  selectedCircularForDetails: Circular | null = null;
  activeTab: 'pending' | 'approved' | 'rejected' | 'all' = 'pending';
  Math = Math;
  showCircularViewModal: boolean = false;
  selectedCircularForView: Circular | null = null;

  showApproveModal: boolean = false;
  selectedCircularForApproval: Circular | null = null;

  showReferenceModal: boolean = false;
  referenceCircularData: any = null;
  loadingReference: boolean = false;
  // Stats
  pendingCount: number = 0;
  approvedTodayCount: number = 0;
  rejectedTodayCount: number = 0;

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  recentActivities: any[] = [];

  // Filters
  selectedPriority: string = 'all';
  searchQuery: string = '';

  // For cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private circularService: CircularService,
    private sanitizer: DomSanitizer,
    private empService: EmployeeService,
    private toast: Toast
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.circularService.unsubscribeFromCircularUpdates();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.loading = true;

    // Wait for valid employee data, then load everything
    this.empService.currentEmployee$
      .pipe(
        takeUntil(this.destroy$),
        filter((data) => data != null && data.id != null), // Only proceed when we have valid data
        take(1),
        tap((data) => {
          this.reviewerData = data;
          console.log('reviewerData loaded:', this.reviewerData);
          this.setupWebSocketListeners(data.id);
        }),
        switchMap((data) => {
          // Now load circulars with the reviewer ID
          return this.circularService.getAssingedCircularForApproval(data.id);
        })
      )
      .subscribe({
        next: (res: any) => {
          this.circulars = res.data || [];
          this.calculateStats();
          this.filterCirculars();
          this.loading = false;
          console.log('Circulars loaded:', res);

          // Load approval data after circulars are loaded
          this.loadApprovalData();
        },
        error: (err) => {
          console.error('Error loading data:', err);
          this.loading = false;
        },
      });
  }
  setupWebSocketListeners(approver_id: number) {
    // Subscribe to WebSocket updates
    this.circularService.subscribeToCircularUpdates(approver_id);

    // Listen for new circulars - add shareReplay to prevent multiple subscriptions
    this.circularService.newCircular$.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      console.log('New circular notification received', data);
      this.refreshCirculars();
      this.toast.show('New circular has been assigned to you!', 'info');
    });

    // Listen for status updates
    this.circularService.statusUpdate$.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      console.log('Status update received', data);
      this.refreshCirculars();
    });
  }
  showNotification(message: string) {
    // You can use a toast library or simple alert
    alert(message);
    // Or use Angular Material Snackbar, ngx-toastr, etc.
  }

  loadApprovalData() {
    if (!this.reviewerData?.id) {
      console.error('No reviewer ID available');
      return;
    }

    this.circularService
      .getCircularApprovalDataById(this.reviewerData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.ApprovalDataByEmpId = res.data || res || [];
          console.log('Approval data loaded:', res);
          this.loadRecentActivities();
        },
        error: (err) => {
          console.error('Error fetching approval data:', err);
        },
      });
  }

  calculateStats() {
    this.pendingCount = this.circulars.filter(
      (c) => c.circular_status === 'PENDING_APPROVAL'
    ).length;

    const today = new Date().toDateString();
    this.approvedTodayCount = this.circulars.filter((c) => c.circular_status === 'APPROVED').length;

    this.rejectedTodayCount = this.circulars.filter((c) => c.circular_status === 'REJECTED').length;
  }
  refreshCirculars() {
    if (!this.reviewerData?.id) return;

    this.circularService
      .getAssingedCircularForApproval(this.reviewerData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.circulars = res.data || [];
          this.filterCirculars();
          this.calculateStats();
          this.loadRecentActivities();
        },
        error: (err) => console.error('Error refreshing:', err),
      });
  }

  filterCirculars() {
    let filtered = this.circulars;

    // Filter by active tab
    switch (this.activeTab) {
      case 'pending':
        filtered = filtered.filter((c) => c.circular_status === 'PENDING_APPROVAL');
        break;
      case 'approved':
        filtered = filtered.filter((c) => c.circular_status === 'APPROVED');
        break;
      case 'rejected':
        filtered = filtered.filter((c) => c.circular_status === 'REJECTED');
        break;
      case 'all':
        // Show all circulars
        break;
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      filtered = filtered.filter((circular) => {
        const matchesSearch =
          circular.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          circular.circular_code.toLowerCase().includes(this.searchQuery.toLowerCase());
        return matchesSearch;
      });
    }

    this.filteredCirculars = filtered;
    console.log(this.filterCirculars)
    this.currentPage = 1; // Reset to first page
    this.calculatePagination();
  }

  switchTab(tab: 'pending' | 'approved' | 'rejected' | 'all') {
    this.activeTab = tab;
    this.filterCirculars();
  }
  getDepartments(departments: string): string[] {
    return departments ? departments.split(',') : [];
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays <= 2) {
      return `${diffDays} days ago`;
    }
    
    // After 2 days, show date with 12-hour time
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return created.toLocaleString('en-US', options);
  }

 getPriorityClass(circular: Circular): string {
  const priorityMap: { [key: string]: string } = {
    'LOW': 'low',
    'MEDIUM': 'medium',
    'HIGH': 'high',
    'URGENT': 'urgent'
  };
  
  return priorityMap[circular.priority];
}

  approveCircular(circularId: number) {
    if (!this.reviewerData?.id) {
      this.toast.show('Reviewer information not available', 'error');
      return;
    }

    const circular = this.circulars.find((c) => c.circular_id === circularId);
    if (circular) {
      this.selectedCircularForApproval = circular;
      this.showApproveModal = true;
    }
  }
  confirmApproval() {
    if (!this.selectedCircularForApproval || !this.reviewerData?.id) {
      this.toast.show('Required information not available', 'error');
      return;
    }

    this.circularService
      .approveCircular(this.selectedCircularForApproval.circular_id, this.reviewerData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
        //   console.log('Circular approved successfully');
        //   const circular = this.circulars.find(
        //     (c) => c.circular_id === this.selectedCircularForApproval!.circular_id
        //   );
        //   if (circular) {
        //     circular.approval_status = 'APPROVED';
        //     circular.status = 'APPROVED';
        //   }
        //   this.filteredCirculars = [...this.circulars];
        //   this.calculateStats();
        //   this.closeApproveModal();
        //   this.toast.show('Circular approved successfully!', 'success');
        // },
console.log('Approval response:', res);

  this.closeApproveModal();

  // Reload fresh status from backend
  this.refreshCirculars();

  if (res.allApproved) {
    this.toast.show(
      'All approvers have approved. Circular is now published!',
      'success'
    );
  } else {
    this.toast.show(
      `Your approval was recorded. Waiting for ${res.pendingCount} more approval(s).`,
      'success'
    );
  }
},



        error: (err) => {
          console.error('Error approving circular:', err);
          this.toast.show('Error approving circular. Please try again.', 'error');
        },
      });
  }

  // Add closeApproveModal method
  closeApproveModal() {
    this.showApproveModal = false;
    this.selectedCircularForApproval = null;
  }

  rejectCircular(circularId: number) {
    const circular = this.circulars.find((c) => c.circular_id === circularId);
    if (circular) {
      this.selectedCircularForAction = circular;
      this.rejectionComment = '';
      this.showRejectModal = true;
    }
  }

  submitRejection() {
    if (!this.rejectionComment || this.rejectionComment.trim() === '') {
      this.toast.show('Please provide a reason for rejection', 'error');
      return;
    }

    if (!this.selectedCircularForAction || !this.reviewerData?.id) {
      this.toast.show('Required information not available', 'error');
      return;
    }

    this.circularService
      .rejectCircular(
        this.selectedCircularForAction.circular_id,
        this.reviewerData.id,
        this.rejectionComment
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          console.log('Circular rejected successfully');
          const circular = this.circulars.find(
            (c) => c.circular_id === this.selectedCircularForAction!.circular_id
          );
          if (circular) {
            circular.approval_status = 'REJECTED';
            circular.status = 'REJECTED';
          }
          this.filteredCirculars = [...this.circulars];
          this.calculateStats();
          this.closeRejectModal();
          this.toast.show('Circular rejected successfully!', 'success');
        },
        error: (err) => {
          console.error('Error rejecting circular:', err);
          this.toast.show('Error rejecting circular. Please try again.', 'error');
        },
      });
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.selectedCircularForAction = null;
    this.rejectionComment = '';
  }

  viewCircularDetails(circularId: number) {
    const circular = this.circulars.find((c) => c.circular_id === circularId);
    if (circular) {
      this.selectedCircularForDetails = circular;
      this.showDetailsModal = true;

      if (!circular.has_seen) {
        this.markCircularAsSeen(circularId);
        this.loadRecentActivities();
      }
    }
  }
  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedCircularForDetails = null;
  }

  downloadPDF(circular: any) {
    try {
      if (!circular.has_seen) {
        this.markCircularAsSeen(circular.circular_id);
        this.loadRecentActivities();
      }

      const byteArray = new Uint8Array(circular.circular_pdf.data);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      this.currentPdfBlob = blob;

      const url = URL.createObjectURL(blob);
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.selectedCircularTitle = circular.title;
      this.showPdfViewer = true;
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }

  markCircularAsSeen(circularId: number) {
    if (!this.reviewerData?.id) {
      console.error('Reviewer ID not available');
      return;
    }

    this.circularService
      .markCircularAsSeen(circularId, this.reviewerData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          console.log('Circular marked as seen');
          const circular = this.circulars.find((c) => c.circular_id === circularId);
          if (circular) {
            circular.has_seen = true;
            circular.seen_at = new Date().toISOString();
          }
          this.filteredCirculars = [...this.circulars];
        },
        error: (err) => {
          console.error('Error marking circular as seen:', err);
        },
      });
  }

  closePDF() {
    this.showPdfViewer = false;

    if (this.pdfUrl) {
      const url = (this.pdfUrl as any).changingThisBreaksApplicationSecurity;
      if (url) {
        URL.revokeObjectURL(url);
      }
    }

    this.pdfUrl = null;
    this.selectedCircularTitle = '';
    this.currentPdfBlob = null;
  }

  downloadPDFFile() {
    if (this.currentPdfBlob) {
      const url = URL.createObjectURL(this.currentPdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${this.selectedCircularTitle || 'circular'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  printPDF() {
    if (this.pdfUrl) {
      const url = (this.pdfUrl as any).changingThisBreaksApplicationSecurity;
      if (url) {
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            printWindow.print();
          });
        }
      }
    }
  }
  viewReferenceCircular(circularId: number) {
    console.log(circularId, 'idd of refernce');
    this.loadingReference = true;
    this.showReferenceModal = true;

    this.circularService
      .getCircularById(circularId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.referenceCircularData = res.data || res;
          this.loadingReference = false;
          console.log('Reference circular loaded:', this.referenceCircularData);
        },
        error: (err) => {
          console.error('Error loading reference circular:', err);
          this.loadingReference = false;
          this.toast.show('Error loading reference circular. Please try again.', 'error');
          this.showReferenceModal = false;
        },
      });
  }

  // Add closeReferenceModal method
  closeReferenceModal() {
    this.showReferenceModal = false;
    this.referenceCircularData = null;
    this.loadingReference = false;
  }

  // Add downloadReferencePDF method
  downloadReferencePDF() {
    if (!this.referenceCircularData?.circular_pdf) {
      this.toast.show('PDF not available', 'info');
      return;
    }

    try {
      const byteArray = new Uint8Array(this.referenceCircularData.circular_pdf.data);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      this.currentPdfBlob = blob;

      const url = URL.createObjectURL(blob);
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.selectedCircularTitle = this.referenceCircularData.title || 'Reference Circular';
      this.showPdfViewer = true;
    } catch (error) {
      console.error('Error loading reference PDF:', error);
      this.toast.show('Error loading PDF. Please try again.', 'error');
    }
  }
  // Add method to view circular from tabs
  viewCircularFromTab(circular: Circular) {
    this.selectedCircularForView = circular;
    this.showCircularViewModal = true;
  }

  // Add method to close view modal
  closeCircularViewModal() {
    this.showCircularViewModal = false;
    this.selectedCircularForView = null;
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredCirculars.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  // Add method to get paginated circulars
  getPaginatedCirculars(): Circular[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCirculars.slice(startIndex, endIndex);
  }

  // Add pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  loadRecentActivities() {
    if (!this.reviewerData?.id) return;

    // Get last 10 activities from ApprovalDataByEmpId
    const activities = this.circulars
      .map((approval: any) => {
        const circular = this.circulars.find((c) => c.circular_id === approval.circular_id);

        if (!circular) return null;

        let actionType = '';
        let actionIcon = '';
        let actionColor = '';

        if (approval.circular_status === 'APPROVED') {
          actionType = 'Approved Circular';
          actionIcon = 'check';
          actionColor = 'green';
        } else if (approval.circular_status === 'REJECTED') {
          actionType = 'Rejected Circular';
          actionIcon = 'close';
          actionColor = 'red';
        } else if (approval.has_seen) {
          actionType = 'Viewed Circular';
          actionIcon = 'visibility';
          actionColor = 'blue';
        } else {
          return null;
        }

        return {
          type: actionType,
          icon: actionIcon,
          color: actionColor,
          title: circular.title,
          code: circular.circular_code,
          timestamp: approval.updated_at || approval.seen_at,
          circular_id: circular.circular_id,
        };
      })
      .filter((activity: any) => activity !== null)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    this.recentActivities = activities;
  }
}
