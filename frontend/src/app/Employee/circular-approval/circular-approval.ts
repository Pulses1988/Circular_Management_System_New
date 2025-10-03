import { Component, OnInit } from '@angular/core';
import { CircularService } from '../../services/circular-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EmployeeService } from '../../services/employee-service';

interface Circular {
  id: number;
  title: string;
  content: string;
  circular_code: string;
  source_type_id: number;
  effective_from: string;
  send_type: string;
  status: string;
  repeat_cycle: string;
  created_at: string;
  creator_employee_id: number;
  creator_name?: string; // if you join with employees table
  has_seen?: boolean;
  seen_at?: string;
  approval_status?: string; // from circular_approvals
}
interface ApprovalTable{
  id:number,
  circular_id:number,
  approver_id:number,
  has_seen:boolean,
  seen_at:string,
  status:string,
  comments:string,
  updated_at:string
}

@Component({
  selector: 'app-circular-approval',
  imports: [CommonModule, FormsModule],
  templateUrl: './circular-approval.html',
  styleUrl: './circular-approval.scss',
})
export class CircularApproval implements OnInit {
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
  reviewerData:any;
  ApprovalDataByEmpId:any=[]

  // Stats
  pendingCount: number = 0;
  approvedTodayCount: number = 0;
  rejectedTodayCount: number = 0;

  // Filters
  selectedPriority: string = 'all';
  searchQuery: string = '';

  constructor(private circularService: CircularService, private sanitizer: DomSanitizer, private empService:EmployeeService) {}

  ngOnInit() {
    this.getreviewer();
    this.getCircularApprovalByImpId();
    this.getAllCirculars();
  }

  getreviewer(){
    this.empService.currentEmployee$.subscribe({
    next: (data) => {
      this.reviewerData = data;
      console.log('reviewerData', this.reviewerData);
    },
    error: (err) => {
      console.error('Error getting reviewer:', err);
    }
  });
  }

  getAllCirculars() {
    this.loading = true;
    this.circularService.getAssingedCircularForApproval(this.reviewerData.id).subscribe({
      next: (res: any) => {
        this.circulars = res.data;
        this.filteredCirculars = res.data;
        this.calculateStats();
        this.loading = false;
        console.log(res,'sdfghjklkjhgfdcvkkj');
      },
      error: (err) => {
        console.error('Error fetching circulars:', err);
        this.loading = false;
      },
    });
  }
  getCircularApprovalByImpId(){
    this.circularService.getCircularApprovalDataById(this.reviewerData.id).subscribe((res:any)=>{
      this.ApprovalDataByEmpId=res;
      console.log(res,'approvalData')
    })
  }

  calculateStats() {
    this.pendingCount = this.circulars.filter((c) => c.status === 'PENDING_APPROVAL').length;

    const today = new Date().toDateString();
    this.approvedTodayCount = this.circulars.filter(
      (c) => c.status === 'APPROVED'
    ).length;

    this.rejectedTodayCount = this.circulars.filter(
      (c) => c.status === 'REJECTED'
    ).length;
  }

  filterCirculars() {
    this.filteredCirculars = this.circulars.filter((circular) => {
      const matchesSearch =
        circular.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        circular.circular_code.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesSearch;
    });
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  }

  getPriorityClass(circular: Circular): string {
    // You can define priority logic based on effective_from or other criteria
    const effectiveDate = new Date(circular.effective_from);
    const daysUntilEffective = Math.floor(
      (effectiveDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilEffective <= 7) return 'urgent';
    return 'normal';
  }

  approveCircular(circularId: number) {
  if (confirm('Are you sure you want to approve this circular?')) {
    this.circularService.approveCircular(circularId,this.reviewerData.id).subscribe({
      next: (res: any) => {
        console.log('Circular approved successfully');
        // Update local data
        const circular = this.circulars.find(c => c.id === circularId);
        if (circular) {
          circular.approval_status = 'APPROVED';
          circular.status = 'APPROVED';
        }
        this.filteredCirculars = [...this.circulars];
        this.calculateStats();
        
        // Show success message (you can use a toast notification)
        alert('Circular approved successfully!');
      },
      error: (err) => {
        console.error('Error approving circular:', err);
        alert('Error approving circular. Please try again.');
      }
    });
  }
}

  rejectCircular(circularId: number) {
  const circular = this.circulars.find(c => c.id === circularId);
  if (circular) {
    this.selectedCircularForAction = circular;
    this.rejectionComment = '';
    this.showRejectModal = true;
  }
}
submitRejection() {
  if (!this.rejectionComment || this.rejectionComment.trim() === '') {
    alert('Please provide a reason for rejection');
    return;
  }

  if (!this.selectedCircularForAction) return;

  this.circularService.rejectCircular(
    this.selectedCircularForAction.id, 
    this.reviewerData.id,
    this.rejectionComment
  ).subscribe({
    next: (res: any) => {
      console.log('Circular rejected successfully');
      // Update local data
      const circular = this.circulars.find(c => c.id === this.selectedCircularForAction!.id);
      if (circular) {
        circular.approval_status = 'REJECTED';
        circular.status = 'REJECTED';
        // circular.comments = this.rejectionComment;
      }
      this.filteredCirculars = [...this.circulars];
      this.calculateStats();
      
      // Close modal and reset
      this.closeRejectModal();
      
      // Show success message
      alert('Circular rejected successfully!');
    },
    error: (err) => {
      console.error('Error rejecting circular:', err);
      alert('Error rejecting circular. Please try again.');
    }
  });
}

// Close reject modal
closeRejectModal() {
  this.showRejectModal = false;
  this.selectedCircularForAction = null;
  this.rejectionComment = '';
}

 viewCircularDetails(circularId: number) {
  const circular = this.circulars.find(c => c.id === circularId);
  if (circular && !circular.has_seen) {
    this.markCircularAsSeen(circularId);
  }
  // Navigate to detail page or open modal
}

  downloadPDF(circular: any) {
  try {
    // Mark as seen if not already seen
    if (!circular.has_seen) {
      this.markCircularAsSeen(circular.id);
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
  this.circularService.markCircularAsSeen(circularId,this.reviewerData.id).subscribe({
    next: (res: any) => {
      console.log('Circular marked as seen');
      // Update the local circular object
      const circular = this.circulars.find(c => c.id === circularId);
      if (circular) {
        circular.has_seen = true;
        circular.seen_at = new Date().toISOString();
      }
      this.filteredCirculars = [...this.circulars];
    },
    error: (err) => {
      console.error('Error marking circular as seen:', err);
    }
  });
}

  closePDF() {
    this.showPdfViewer = false;

    // Clean up object URL to prevent memory leaks
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
}
