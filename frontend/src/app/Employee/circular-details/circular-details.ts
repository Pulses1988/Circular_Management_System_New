import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CircularService } from '../../services/circular-service';
import { EmployeeService } from '../../services/employee-service';
import { SafePipePipe } from '../../safe-pipe-pipe';
import { error } from 'console';

export interface CircularDetails {
  id: number;
  title: string;
  content: string;
  circular_pdf: { type: string; data: number[] } | null;
  circular_code: string;
  effective_from: string | null;
  send_type: string | null;
  status: string;
  published_at: string | null;
  reference_circular_id: number | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  creator_first_name: string;
  creator_last_name: string;
  department_name: string | null;
  branch_name: string | null;

  approvers: CircularApprover[];
  reference_circular: ReferenceCircular | null;
  tracking: CircularTrackingStats;
  chats: CircularChat[];
}

export interface CircularApprover {
  approver_id: number;
  first_name: string;
  last_name: string;
}

export interface ReferenceCircular {
  id: number;
  title: string;
  circular_code: string;
}

export interface CircularTrackingStats {
  seen_count: number;
  completed_count: number;
  total_count: number;
}

export interface CircularChat {
  chat_id: number;
  message: string;
  created_at: string;
  first_name: string;
  last_name: string;
  employee_id?: number; 
}
interface EmployeeData {
  id: number;
  first_name: string;
  last_name: string;
  role_name: string;
  department_name: string | null;
  branch_name: string | null;
  head_office_name: string | null;
  employee_id: string;
  can_approve_circular: number;
  can_create_circular: number;
}
// ....................................................................



@Component({
  selector: 'app-circular-details',
  standalone:true,
  imports: [CommonModule, FormsModule,SafePipePipe],
  templateUrl: './circular-details.html',
  styleUrl: './circular-details.scss'
})
export class CircularDetails implements OnInit {
  circularId: number = 0;
  circular: CircularDetails | null = null;
  isLoading: boolean = false;
  
  // Chat related
  messages: CircularChat[] = [];
  newMessage: string = '';
  selectedFiles: File[] = [];
  isTyping: boolean = false;
  employeeData: EmployeeData | null = null;
  
  // UI States
  activeTab: 'details' | 'discussion' = 'details';
  showEmojiPicker: boolean = false;

  // pdf viewer
  showPDFPreview: boolean = false;
  pdfUrl: string = '';
  

  constructor(private route: ActivatedRoute, private circularService:CircularService, private employeeService:EmployeeService) {}

 async ngOnInit() {
    await this.loadEmployeeData(); 
    // Get circular ID from route params
    this.route.queryParams.subscribe(params => {
      this.circularId = +params['circularId']; // '+' converts string → number
      console.log('Received Circular ID:', this.circularId);
      this.loadCircularData(this.circularId);
    });
  }
  async loadEmployeeData() {
    this.employeeData = await this.employeeService.getCurrentEmployee();
    }

  loadCircularData(circular_id: number) {
  this.isLoading = true;
  this.circularService.fetchCircularDetailsById(circular_id).subscribe({
    next: (res: any) => {
      console.log(res, 'details');
      if (res) {
        this.circular = res;
        console.log(this.circular,'sdajfkjasdfjksdh')
        this.messages = res.chats || [];
        this.calculatePriority(); // Add this method to calculate priority
        this.isLoading = false;
      }
    },
    error: (error) => {
      console.error('Error fetching circular details:', error);
      this.isLoading = false;
    }
  });
}

calculatePriority(): void {
  if (!this.circular?.published_at) return;
  
  const publishedDate = new Date(this.circular.published_at);
  const now = new Date();
  const diffHours = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  
  if (diffHours <= 24) {
    this.circular.priority = 'urgent';
  } else if (diffDays <= 3) {
    this.circular.priority = 'high';
  } else if (diffDays <= 7) {
    this.circular.priority = 'medium';
  } else {
    this.circular.priority = 'low';
  }
}

  switchTab(tab: 'details' | 'discussion') {
    this.activeTab = tab;
  }
isCurrentUserMessage(message: CircularChat): boolean {
  // Add employee_id to CircularChat interface if not present
  return message.employee_id === this.employeeData?.id;
}

// hasPDF(): boolean {
//   return this.circular?.circular_pdf != null && 
//          (typeof this.circular.circular_pdf === 'string' || 
//           (typeof this.circular.circular_pdf === 'object' && this.circular.circular_pdf));
// }
  sendMessage() {
    if (!this.newMessage.trim() && this.selectedFiles.length === 0) return;

   const newMsg: any = {
    circular_id: this.circular?.id,
    employee_id: this.employeeData?.id,
    message: this.newMessage,
  };
  this.circularService.sendChatForCircular(newMsg).subscribe(
    (res:any)=>{
      console.log('massage is sent')
    }
  )
    this.messages.push(newMsg);
    this.newMessage = '';
    this.selectedFiles = [];
  }

  onFileSelect(event: any) {
    const files = event.target.files;
    this.selectedFiles = Array.from(files);
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: {[key: string]: string} = {
      'pdf': 'pdf',
      'doc': 'document',
      'docx': 'document',
      'xls': 'spreadsheet',
      'xlsx': 'spreadsheet',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image'
    };
    return types[ext || ''] || 'file';
  }
  openPDFPreview() {
  if (!this.circular?.circular_pdf?.data) return;
  
  const uint8Array = new Uint8Array(this.circular.circular_pdf.data);
  const blob = new Blob([uint8Array], { type: 'application/pdf' });
  this.pdfUrl = window.URL.createObjectURL(blob);
  this.showPDFPreview = true;
}

closePDFPreview() {
  if (this.pdfUrl) {
    window.URL.revokeObjectURL(this.pdfUrl);
  }
  this.showPDFPreview = false;
  this.pdfUrl = '';
}

 downloadPDF() {
  if (!this.circular?.circular_pdf) return;
  
  const pdfData = this.circular.circular_pdf;
  
  // Convert Buffer to Uint8Array
  const uint8Array = new Uint8Array(pdfData.data);
  
  // Create Blob from Uint8Array
  const blob = new Blob([uint8Array], { type: 'application/pdf' });
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${this.circular.title}_circular.pdf`;
  link.click();
  
  // Cleanup
  window.URL.revokeObjectURL(url);
}

  downloadAttachment(attachment: any) {
    console.log('Download attachment:', attachment);
  }

  getPriorityColor(priority: string): string {
    const colors: {[key: string]: string} = {
      'urgent': 'bg-red-500/20 text-red-400 border-red-500/30',
      'high': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'low': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[priority] || colors['low'];
  }

  formatDate(dateString: string | null | undefined): string {
     if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

 getInitials(firstName: string='', lastName: string = ''): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last;
}
  handleEnterKey(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    this.sendMessage();
  }
}


}
