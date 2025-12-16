import { Component, OnInit } from '@angular/core';
import { CircularService } from '../../services/circular-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Toast } from '../../toast/toast';

interface sourceType {
  id: number;
  name: string;
}

interface RepeatCycle {
  id: number;
  name: string;
  duration_days: number;
}

@Component({
  selector: 'app-admin-circular-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './admin-circular-settings.html',
  styleUrl: './admin-circular-settings.scss',
})
export class AdminCircularSettings implements OnInit {
  constructor(private circularService: CircularService, private toast: Toast) {}

  sourceType!: sourceType[];
  newSourceTypeName: string = '';
  editingSourceTypeId: number | null = null;
  editingSourceTypeName: string = '';
  searchQuery: string = '';

  // Repeat Cycle properties
  repeatCycles!: RepeatCycle[];
  newRepeatCycleName: string = '';
  newRepeatCycleDuration: number | null = null;
  editingRepeatCycleId: number | null = null;
  editingRepeatCycleName: string = '';
  editingRepeatCycleDuration: number | null = null;
  searchCycleQuery: string = '';
  activeTab: string = 'sourceTypes'; // 'sourceTypes' or 'repeatCycles'

  ngOnInit() {
    this.getSourceTypes();
    this.getRepeatCycles();
  }

  // -------------------------------------------SourceType Start-------------------------------------------------------------

  getSourceTypes() {
    this.circularService.getSourceTypesForAdmin().subscribe((res: any) => {
      this.sourceType = res;
      console.log(res, 'source types');
    });
  }

  addSourceType() {
    if (this.newSourceTypeName.trim()) {
      this.circularService.addSourceType({ name: this.newSourceTypeName.trim() }).subscribe({
        next: (res: any) => {
          this.getSourceTypes();
          this.newSourceTypeName = '';
          // Show success toast
          this.toast.show('Source Type saved successfully.', 'success');
        },
        error: (err) => {
          // Show error toast
          const message = err.error?.error || 'Failed to update department. Please try again.';
          this.toast.show(message, 'error');
        },
      });
    }
  }

  startEdit(sourceType: sourceType) {
    this.editingSourceTypeId = sourceType.id;
    this.editingSourceTypeName = sourceType.name;
  }

  saveEdit() {
    if (this.editingSourceTypeId && this.editingSourceTypeName.trim()) {
      this.circularService
        .updateSourceType(this.editingSourceTypeId, {
          name: this.editingSourceTypeName.trim(),
        })
        .subscribe({
          next: () => {
            this.getSourceTypes();
            this.cancelEdit();
          },
          error: (err) => {
            const message = err.error?.error;
            this.toast.show(message, 'error');
          },
        });
    }
  }

  cancelEdit() {
    this.editingSourceTypeId = null;
    this.editingSourceTypeName = '';
  }

  get filteredSourceTypes() {
    if (!this.searchQuery) return this.sourceType;
    return this.sourceType.filter((st) =>
      st.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // -------------------------------------------SourceType End-------------------------------------------------------------

  // -------------------------------------------Repeat Cycle Start-------------------------------------------------------------

  getRepeatCycles() {
    this.circularService.getRepeatCycles().subscribe((res: any) => {
      this.repeatCycles = res.sort(
        (a: RepeatCycle, b: RepeatCycle) => a.duration_days - b.duration_days
      );
      console.log(res, 'repeat cycles');
    });
  }

  addRepeatCycle() {
    if (
      this.newRepeatCycleName.trim() &&
      this.newRepeatCycleDuration &&
      this.newRepeatCycleDuration > 0
    ) {
      this.circularService
        .addRepeatCycle({
          name: this.newRepeatCycleName.trim(),
          duration_days: this.newRepeatCycleDuration,
        })
        .subscribe({
          next: (res: any) => {
            this.getRepeatCycles();
            this.newRepeatCycleName = '';
            this.newRepeatCycleDuration = null;
            // Show success toast
            this.toast.show('Repeat cycle created successfully', 'success');
          },
          error: (err) => {
            // Show error toast
            const message = err.error?.error;
            this.toast.show(message, 'error');
          },
        });
    }
  }

  startEditCycle(cycle: RepeatCycle) {
    this.editingRepeatCycleId = cycle.id;
    this.editingRepeatCycleName = cycle.name;
    this.editingRepeatCycleDuration = cycle.duration_days;
  }

  saveEditCycle() {
    if (
      this.editingRepeatCycleId &&
      this.editingRepeatCycleName.trim() &&
      this.editingRepeatCycleDuration &&
      this.editingRepeatCycleDuration > 0
    ) {
      this.circularService
        .updateRepeatCycle(this.editingRepeatCycleId, {
          name: this.editingRepeatCycleName.trim(),
          duration_days: this.editingRepeatCycleDuration,
        })
        .subscribe({
          next: () => {
            this.getRepeatCycles();
            this.cancelEditCycle();
            this.toast.show('Repeat cycle updated successfully', 'success');
          },
          error: (err) => {
            // Show error toast
            const message = err.error?.error;
            this.toast.show(message, 'error');
          },
        });
    }
  }

  cancelEditCycle() {
    this.editingRepeatCycleId = null;
    this.editingRepeatCycleName = '';
    this.editingRepeatCycleDuration = null;
  }

  resetCycleForm() {
    this.newRepeatCycleName = '';
    this.newRepeatCycleDuration = null;
  }

  get filteredRepeatCycles() {
    if (!this.searchCycleQuery) return this.repeatCycles;
    return this.repeatCycles.filter((cycle) =>
      cycle.name.toLowerCase().includes(this.searchCycleQuery.toLowerCase())
    );
  }

  // -------------------------------------------Repeat Cycle End-------------------------------------------------------------
}
