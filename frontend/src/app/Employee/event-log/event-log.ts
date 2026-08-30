import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircularService } from '../../services/circular-service';

@Component({
  selector: 'app-event-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-log.html',
  styleUrl: './event-log.scss'
})
export class EventLog implements OnInit {

  eventLogs: any[] = [];
  loading = false;

  constructor(private circularService: CircularService) {}

  ngOnInit(): void {
    this.loadEventLogs();
  }

  loadEventLogs(): void {

    this.loading = true;

    this.circularService.getEventLogs().subscribe({

      next: (res: any) => {
        this.eventLogs = res;
        this.loading = false;
      },

      error: (err) => {
        console.error(err);
        this.loading = false;
      }

    });

  }

}