import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CircularService } from '../../services/circular-service';
import { EmployeeService } from '../../services/employee-service';
import { SafePipePipe } from '../../safe-pipe-pipe';
import { error } from 'console';
import { Subject, takeUntil } from 'rxjs';
import { Toast } from '../../toast/toast';

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

creator_employee_id: number;

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
export interface CircularAttachment {
  attachment_id: number;
  circular_id: number;
  employee_id: number;
  chat_id?: number;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  first_name?: string;
  last_name?: string;
}
export interface CircularChat {
  chat_id: number;
  message: string;
  created_at: string;
  first_name: string;
  last_name: string;
  employee_id?: number;
  attachments?: CircularAttachment[];
  is_system_message?: boolean;
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
  standalone: true,
  imports: [CommonModule, FormsModule, SafePipePipe],
  templateUrl: './circular-details.html',
  styleUrl: './circular-details.scss',
})
export class CircularDetails implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  private destroy$ = new Subject<void>();

  circularId: number = 0;
  circular: CircularDetails | null = null;
  isLoading: boolean = false;
  isMarkingComplete: boolean = false;
  isCompleted: boolean = false;
  completedAt: string | null = null;
  isNotApproved:boolean =false;

  // Chat related
  messages: CircularChat[] = [];
  newMessage: string = '';
  selectedFile: File[] = [];
  attachments: any[] = [];
  isTyping: boolean = false;
  employeeData: EmployeeData | null = null;
  circularHistory: number[] = [];

  // UI States
  activeTab: 'details' | 'discussion' = 'details';
  showEmojiPicker: boolean = false;

  // pdf viewer
  showPDFPreview: boolean = false;
  pdfUrl: string = '';

  // attachment viewer
  showAttachmentPreview: boolean = false;
  previewUrl: string = '';
  previewType: 'image' | 'pdf' | 'other' = 'other';
  currentAttachment: CircularAttachment | null = null;

  // complition
  showCompletionModal: boolean = false;
isApprover: boolean = false;  

isCreator: boolean = false;
allEmployeesCompleted: boolean = false;
isCircularCompleted: boolean = false;   // <-- ADD THIS





completionForm = {
  reference_number: '',
  submission_mode: 'BY_HAND',
  completion_notes: ''
};

submissionModes = [
  { value: 'BY_HAND', label: 'By Hand' },
  { value: 'BY_COURIER', label: 'By Courier' },
  { value: 'BY_RPD', label: 'By RPD' }
];

  constructor(
    private route: ActivatedRoute,
    private circularService: CircularService,
    private employeeService: EmployeeService,
    private toast: Toast,
     private router: Router
  ) {}

  async ngOnInit() {
    await this.loadEmployeeData();
    // Get circular ID from route params
    this.route.queryParams.subscribe((params) => {
      this.circularId = +params['circularId']; // '+' converts string → number
      console.log('Received Circular ID:', this.circularId);
      // All entry points (including notification links) must record the read
      // against the existing circular_tracking row. The update is idempotent.
      if (this.circularId && this.employeeData?.id) {
        this.circularService.markCircularAsSeenForEmp({
          circularId: this.circularId,
          employeeId: this.employeeData.id,
        }).subscribe({ error: err => console.error('Error marking circular as seen:', err) });
      }
      this.loadCircularData(this.circularId);
      this.circularService.joinCircularChatRoom(this.circularId);
      this.setupChatListeners();
    });

    this.circularService.onNewAttachment().subscribe((data) => {
      if (data.circular_id === this.circularId) {
        this.attachments.push(data.attachment);
        console.log('New attachment uploaded:', data.attachment);
      }
    });

    this.loadAttachments();
    //   this.circularService.onNewMessage().subscribe((message) => {
    //   // Check if message is from another user (not yourself)
    //   if (message.employee_id !== this.employeeData?.id) {
    //     // Sound already plays in service
    //     console.log('New message received:', message);
    //   }
    //   this.messages.push(message);
    // });
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
        this.isCircularCompleted = res.status === 'COMPLETED';

console.log("Circular Status:", res.status);
console.log("Is Circular Completed:", this.isCircularCompleted);
        console.log("API Response:", res);
console.log("creator_employee_id =", res.creator_employee_id);

        // this.isNotApproved = res.status !== 'APPROVED';
        this.isNotApproved =
  res.status !== 'APPROVED'  &&
  res.status !== 'COMPLETED';

        console.log(this.circular, 'Circular Details');

        this.messages = res.chats || [];

        this.checkCompletionStatus();



        //check completion status
      



        this.scrollToBottom();
      }

      this.isLoading = false;
    },

    error: (error) => {
      console.error('Error fetching circular details:', error);
      this.isLoading = false;
    },
  });







  }
  checkCompletionStatus() {
    if (!this.circular || !this.employeeData) return;  

 console.log("========== CHECK ==========");
  console.log("creator_employee_id =", this.circular.creator_employee_id);
  console.log("employeeData.id     =", this.employeeData.id);



this.isApprover = this.circular.approvers?.some(
    approver => approver.approver_id === this.employeeData?.id
  ) || false; 

  this.isCreator =
  this.circular.creator_employee_id === this.employeeData?.id;



    this.circularService
      .getCircularCompletionStatus(this.circular.id, this.employeeData.id)
      .subscribe({
        next: (response: any) => {
          this.isCompleted = response.is_completed || false;
          this.completedAt = response.completed_at || null;
        },
        error: (error: any) => {
          console.error('Error checking completion status:', error);
        },
      });
  }
  loadCircularWithHistory(circular_id: number) {
    if (this.circular?.id) {
      this.circularHistory.push(this.circular.id);
    }
    this.loadCircularData(circular_id);
  }

  setupChatListeners() {
    this.circularService.newChatMessage$.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      console.log('Chat data received:', data);
      console.log('Is system message?', data.chat.is_system_message);

      if (data.circular_id === this.circularId) {
        console.log('✅ New chat message for current circular', data.chat);

        // Add message for ALL users (including sender)
        // Check for duplicates before adding
        const isDuplicate = this.messages.some((m) => m.chat_id === data.chat.chat_id);

        if (!isDuplicate) {
          this.messages.push(data.chat);
          this.scrollToBottom();

          // Play sound only for other users
          if (data.chat.employee_id !== this.employeeData?.id) {
            this.circularService.playNotificationSound();
          }
        }
      }
    });
    this.circularService
      .onNewAttachment()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        console.log('New attachment received:', data);

        if (data.circular_id === this.circularId && data.chat_id) {
          // Find the message and add attachment to it
          const message = this.messages.find((m) => m.chat_id === data.chat_id);
          if (message) {
            if (!message.attachments) {
              message.attachments = [];
            }
            message.attachments.push(data.attachment);
            console.log('Attachment added to message:', message);
          }
        }
      });
  }
  goBackToPreviousCircular() {
    if (this.circularHistory.length > 0) {
      const previousId = this.circularHistory.pop()!;
      this.loadCircularData(previousId);
    } else {
      // Navigate back to circulars list or previous page
      window.history.back();
    }
  }

  switchTab(tab: 'details' | 'discussion') {
    this.activeTab = tab;
    if (tab === 'discussion') {
      this.scrollToBottom();
    }
  }
  isCurrentUserMessage(message: CircularChat): boolean {
    // Add employee_id to CircularChat interface if not present
    return message.employee_id === this.employeeData?.id;
  }
  scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  // hasPDF(): boolean {
  //   return this.circular?.circular_pdf != null &&
  //          (typeof this.circular.circular_pdf === 'string' ||
  //           (typeof this.circular.circular_pdf === 'object' && this.circular.circular_pdf));
  // }
  sendMessage() {
    if (!this.newMessage.trim() && this.selectedFile == null) return;

    const newMsg: any = {
      circular_id: this.circular?.id,
      employee_id: this.employeeData?.id,
      message: this.newMessage || '📎 Sent attachment(s)',
    };
    this.circularService.sendChatForCircular(newMsg).subscribe(
      (res: any) => {
        console.log('massage is sent');
        const chatId = res.chat_id;
        if (this.selectedFile.length > 0 && chatId) {
          this.uploadFiles(chatId);
        } else {
          this.selectedFile = [];
        }
        this.scrollToBottom();
        this.newMessage = '';
        this.selectedFile = [];
      },
      (error) => {
        console.error('Error sending message:', error);
      }
    );
  }
  onFileSelect(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 10MB limit`);
          continue;
        }

        // Add to selected files
        this.selectedFile.push(file);
      }
    }
    // Reset input
    event.target.value = '';
  }
  uploadFiles(chatId: number) {
    this.selectedFile.forEach((file, index) => {
      this.circularService
        .uploadAttachment(this.circular!.id, this.employeeData!.id, file, chatId)
        .subscribe({
          next: (response) => {
            console.log(`File ${index + 1} uploaded:`, response);

            // Clear files after last upload
            if (index === this.selectedFile.length - 1) {
              this.selectedFile = [];
            }
          },
          error: (err) => {
            console.error(`File ${file.name} upload failed:`, err);
            alert(`Failed to upload ${file.name}`);
          },
        });
    });
  }

  markAsComplete() {
    if (!this.circular || !this.employeeData || this.isCompleted) return;
if (this.isApprover) {
    // Show completion modal for approver (final completion)
    this.showCompletionModal = true;
  } else {
    this.toast
      .confirm({
        message: 'Are you sure you want to mark as complete to  this circular?',
        confirmText: 'Complete',
        cancelText: 'Cancel',
        type: 'warning',
      })
      .subscribe((confirm) => {
        if (confirm) {
          this.isMarkingComplete = true;

          this.circularService
            .markCircularAsCompleted({
              circularId: this.circular!.id,
              employeeId: this.employeeData!.id,
            })
            .subscribe({
              next: (response) => {
                console.log('Circular marked as complete:', response); 


  // this.circularService
  //       .creatorMarkCompleted(this.circular!.id)
  //       .subscribe({
  //         next: (res: any) => {
  //           if (!res.success) {
  //             this.toast.show(res.message, 'error');
  //           } else {
  //             this.toast.show(res.message, 'success');
  //           }
  //         },
  //         error: (err) => console.error(err)
  //       });


  



                this.circularService
                  .sendSystemMessage({
                    circular_id: this.circular!.id,
                    employee_id: this.employeeData!.id,
                    action_type: 'completed',
                  })
                  .subscribe({
                    next: (msgResponse) => {
                      console.log('System message sent:', msgResponse);
                    },
                    error: (err) => console.error('Error sending system message:', err),
                  });
                this.toast.show('Circular marked as complete successfully!', 'success');
                this.isMarkingComplete = false;
                this.isCompleted = true;
                this.completedAt = new Date().toISOString();
              },
              error: (error) => {
                console.error('Error marking circular as complete:', error);
                alert('Failed to mark circular as complete');
                this.isMarkingComplete = false;
              },
            });
        }
      });
    }
  }

  downloadFile(attachment: any) {
    this.circularService.downloadAttachment(attachment.attachment_id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Download failed:', err);
        alert('Failed to download file');
      },
    });
  }

  removeFile(index: number) {
    this.selectedFile.splice(index, 1);
  }

  loadAttachments() {
    this.circularService.getAttachmentsByCircular(this.circularId).subscribe({
      next: (attachments) => {
        this.attachments = attachments;
      },
      error: (err) => console.error('Error loading attachments:', err),
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: { [key: string]: string } = {
      pdf: 'pdf',
      doc: 'document',
      docx: 'document',
      xls: 'spreadsheet',
      xlsx: 'spreadsheet',
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
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
    const colors: { [key: string]: string } = {
      URGENT: 'bg-red-500/20 text-red-400 border-red-500/30',
      HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      LOW: 'bg-green-500/20 text-green-400 border-green-500/30',
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
      minute: '2-digit',
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getInitials(firstName: string = '', lastName: string = ''): string {
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

  previewFile(attachment: CircularAttachment) {
    this.circularService.downloadAttachment(attachment.attachment_id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        this.previewUrl = url;
        this.currentAttachment = attachment;

        // Determine preview type
        if (attachment.file_type.startsWith('image/')) {
          this.previewType = 'image';
          this.showAttachmentPreview = true;
        } else if (attachment.file_type === 'application/pdf') {
          this.previewType = 'pdf';
          this.showAttachmentPreview = true;
        } else {
          // For non-previewable files, just download
          this.downloadFile(attachment);
          window.URL.revokeObjectURL(url);
        }
      },
      error: (err) => {
        console.error('Preview failed:', err);
        alert('Failed to preview file');
      },
    });
  }

  //  close preview method
  closeAttachmentPreview() {
    if (this.previewUrl) {
      window.URL.revokeObjectURL(this.previewUrl);
    }
    this.showAttachmentPreview = false;
    this.previewUrl = '';
    this.previewType = 'other';
    this.currentAttachment = null;
  }

  //  download from preview
  downloadFromPreview() {
    if (this.currentAttachment) {
      this.downloadFile(this.currentAttachment);
    }
  }

  viewActivitySummary() {
  this.router.navigate(['/employee/activity-summary'], {
    queryParams: { circularId: this.circular?.id }
  });
}

submitCompletion() {
  if (!this.completionForm.reference_number.trim() || !this.completionForm.submission_mode) {
    alert('Please fill all required fields');
    return;
  }

  this.isMarkingComplete = true;

  const completionData = {
    circular_id: this.circular!.id,
    completed_by_employee_id: this.employeeData!.id,
    reference_number: this.completionForm.reference_number,
    submission_mode: this.completionForm.submission_mode,
    completion_notes: this.completionForm.completion_notes
  };

  this.circularService.completeCircularWithDetails(completionData).subscribe({
    next: (response) => {
      console.log('Circular completed:', response); 
if (!response.success) {
  this.toast.show(response.message, 'error');
  this.isMarkingComplete = false;
  return;
}


     

this.circularService
  .markCircularAsCompleted({
    circularId: this.circular!.id,
    employeeId: this.employeeData!.id,
  })
  .subscribe({
    next: (res) => {

      console.log('Circular marked complete');

      // this.circularService
      //   .creatorMarkCompleted(this.circular!.id)
      //   .subscribe({
      //     next: (response: any) => {

      //       if (!response.success) {
      //         this.toast.show(response.message, 'error');
      //       } else {
      //         this.toast.show(response.message, 'success');
      //       }

      //     },
      //     error: (err) => {
      //       console.error(err);
      //     }
      //   });

    },
    error: (err) => {
      console.error(err);
    }
  });




      
      // Send system message
      this.circularService.sendSystemMessage({
        circular_id: this.circular!.id,
        employee_id: this.employeeData!.id,
        action_type: 'completed'
      }).subscribe({
        next: (msgResponse) => console.log('System message sent:', msgResponse),
        error: (err) => console.error('Error sending system message:', err)
      });

      this.toast.show('Circular marked as completed successfully!','success');
      this.isMarkingComplete = false;
      this.isCompleted = true;
      this.completedAt = new Date().toISOString();
      this.showCompletionModal = false;
      
      // Reset form
      this.completionForm = {
        reference_number: '',
        submission_mode: 'BY_HAND',
        completion_notes: ''
      };
      
      // Reload circular data to get updated status
      this.loadCircularData(this.circularId);
    },
    error: (error) => {
      console.error('Error completing circular:', error);
      alert('Failed to complete circular');
      this.isMarkingComplete = false;
    }
  });
}   

//Creator_mark_as_completed
creatorMarkComplete() {
 console.log("Creator button clicked");
  if (!this.circular) return;

  this.isMarkingComplete = true;

  this.circularService
    .creatorMarkCompleted(this.circular.id)
    .subscribe({

      next: (res: any) => {

        this.isMarkingComplete = false;

        this.toast.show(res.message, 'success');

        this.loadCircularData(this.circularId);

      },

      error: (err) => {

        this.isMarkingComplete = false;

        this.toast.show(err.error.message, 'error');

      }

    });

}





// Add closeCompletionModal method
closeCompletionModal() {
  this.showCompletionModal = false;
  this.completionForm = {
    reference_number: '',
    submission_mode: 'BY_HAND',
    completion_notes: ''
  };
}

  ngOnDestroy() {
    // Leave circular chat room when component is destroyed
    if (this.circularId) {
      this.circularService.leaveCircularChatRoom(this.circularId);
    }

    if (this.previewUrl) {
      window.URL.revokeObjectURL(this.previewUrl);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }
}




