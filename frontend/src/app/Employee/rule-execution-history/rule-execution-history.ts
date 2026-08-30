import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CircularService } from '../../services/circular-service';

@Component({
  selector: 'app-rule-execution-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rule-execution-history.html',
  styleUrls: ['./rule-execution-history.scss']
})
export class RuleExecutionHistoryComponent implements OnInit {

  // Stores API response
  executions: any[] = [];

  // Loading flag
  loading = false;

  // Error message
  errorMessage = '';

  constructor(
    private circularService: CircularService
  ) { }

  ngOnInit(): void {
    this.loadRuleExecutions();
  }

  loadRuleExecutions(): void {

    this.loading = true;

    this.circularService.getRuleExecutions().subscribe({

      next: (response: any) => {

        console.log("Rule Executions :", response);

        this.executions = response;

        this.loading = false;

      },

      error: (err) => {

        console.error("Error loading rule executions", err);

        this.errorMessage = "Failed to load rule execution history.";

        this.loading = false;

      }

    });

  }

}