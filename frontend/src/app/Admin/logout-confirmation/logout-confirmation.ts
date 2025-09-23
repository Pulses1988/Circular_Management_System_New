import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
@Component({
  selector: 'app-logout-confirmation',
  imports: [MatIcon],
  templateUrl: './logout-confirmation.html',
  styleUrl: './logout-confirmation.scss'
})
export class LogoutConfirmation {

  constructor(
    public dialogRef: MatDialogRef<LogoutConfirmation>
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
