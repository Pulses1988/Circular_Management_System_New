import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReminderRule, ReminderRuleInput, RuleEngineService, RuleEvent } from '../../services/rule-engine.service';

@Component({
  selector: 'app-admin-rule-engine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rule-engine.html',
  styleUrl: './rule-engine.scss',
})
export class AdminRuleEngine implements OnInit {
  rules: ReminderRule[] = [];
  editingId: number | null = null;
  saving = false;
  error = '';
  form: ReminderRuleInput = this.emptyForm();

  constructor(private rulesApi: RuleEngineService) {}
  ngOnInit() { this.loadRules(); }

  emptyForm(): ReminderRuleInput {
    return { rule_name: '', event_name: 'CIRCULAR_PUBLISHED', status: 'INACTIVE', reminder_frequency_value: 1, reminder_frequency_unit: 'HOUR', notify_creator: true };
  }
  loadRules() { this.rulesApi.getAll().subscribe({ next: rules => this.rules = rules, error: () => this.error = 'Unable to load rules.' }); }
  createRule() { this.editingId = null; this.form = this.emptyForm(); this.error = ''; }
  edit(rule: ReminderRule) {
    this.editingId = rule.id;
    this.form = { rule_name: rule.rule_name, event_name: rule.event_name, status: rule.status, reminder_frequency_value: rule.reminder_frequency_value, reminder_frequency_unit: rule.reminder_frequency_unit, notify_creator: !!rule.notify_creator };
    this.error = '';
  }
  onEventChange() {
    if (this.form.event_name !== 'CIRCULAR_PUBLISHED') {
      this.form.reminder_frequency_value = 1;
      this.form.reminder_frequency_unit = 'ONCE';
      this.form.notify_creator = false;
    } else if (this.form.reminder_frequency_unit === 'ONCE') {
      this.form.reminder_frequency_unit = 'HOUR';
      this.form.notify_creator = true;
    } 


  //    if (
  //   this.form.event_name === 'CIRCULAR_PUBLISHED' ||
  //   this.form.event_name === 'CIRCULAR_CREATED'
  // ) {
  //   if (
  //     this.form.reminder_frequency_unit === 'ONCE' ||
  //     !this.form.reminder_frequency_unit
  //   ) {
  //     this.form.reminder_frequency_value = 1;
  //     this.form.reminder_frequency_unit = 'HOUR';
  //   }

  //   // Notify creator is useful for published/read-reminder rules.
  //   // For approver notification, don't automatically enable it.
  //   if (this.form.event_name === 'CIRCULAR_CREATED') {
  //     this.form.notify_creator = false;
  //   } else {
  //     this.form.notify_creator = true;
  //   }
  // } else {
  //   this.form.reminder_frequency_value = 1;
  //   this.form.reminder_frequency_unit = 'ONCE';
  //   this.form.notify_creator = false;
  // }




  }
  eventLabel(eventName: RuleEvent) {
    return ({ CIRCULAR_PUBLISHED: 'Circular Published', CIRCULAR_CREATED: 'Circular Created', CIRCULAR_REJECTED: 'Circular Rejected', EMPLOYEE_COMPLETED_CIRCULAR: 'Employee Completed Circular', ALL_EMPLOYEES_COMPLETED: 'All Employees Completed' })[eventName];
  }
  conditionLabel(eventName: RuleEvent) {
    return ({ CIRCULAR_PUBLISHED: 'Unread Assigned Employees', CIRCULAR_CREATED: 'Approver Assigned', CIRCULAR_REJECTED: 'Circular Rejected', EMPLOYEE_COMPLETED_CIRCULAR: 'Assigned Employees Exist', ALL_EMPLOYEES_COMPLETED: 'All Assigned Employees Completed' })[eventName];
  }
  actionLabel(eventName: RuleEvent) {
    return ({ CIRCULAR_PUBLISHED: 'Send Read Reminder', CIRCULAR_CREATED: 'Send Approver Notification', CIRCULAR_REJECTED: 'Send Rejection Notification', EMPLOYEE_COMPLETED_CIRCULAR: 'Send Completion Status Notification', ALL_EMPLOYEES_COMPLETED: 'Send All Employees Completed Notification' })[eventName];
  }
  targetLabel(eventName: RuleEvent) {
    return ({ CIRCULAR_PUBLISHED: 'Unread Assigned Employees', CIRCULAR_CREATED: 'Assigned Approvers', CIRCULAR_REJECTED: 'Circular Creator', EMPLOYEE_COMPLETED_CIRCULAR: 'Circular Creator', ALL_EMPLOYEES_COMPLETED: 'Circular Creator' })[eventName];
  }
  save() {
    this.saving = true; this.error = '';
    const request = this.editingId ? this.rulesApi.update(this.editingId, this.form) : this.rulesApi.create(this.form);
    request.subscribe({ next: () => { this.saving = false; this.createRule(); this.loadRules(); }, error: err => { this.saving = false; this.error = err.error?.message || 'Unable to save rule.'; } });
  }
  toggle(rule: ReminderRule) { this.rulesApi.setStatus(rule.id, rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE').subscribe({ next: () => this.loadRules(), error: () => this.error = 'Unable to change rule status.' }); }
  remove(rule: ReminderRule) { if (confirm(`Delete rule "${rule.rule_name}"?`)) this.rulesApi.delete(rule.id).subscribe({ next: () => this.loadRules(), error: () => this.error = 'Unable to delete rule.' }); }
}
