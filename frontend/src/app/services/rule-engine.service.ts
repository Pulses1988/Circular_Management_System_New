import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type RuleEvent =
  | 'CIRCULAR_PUBLISHED'
  | 'CIRCULAR_CREATED'
  | 'CIRCULAR_REJECTED'
  | 'EMPLOYEE_COMPLETED_CIRCULAR'
  | 'ALL_EMPLOYEES_COMPLETED';

export interface ReminderRule {
  id: number;
  rule_name: string;
  event_name: RuleEvent;
  condition_field: string;
  action_name: string;
  target_type: string;
  status: 'ACTIVE' | 'INACTIVE';
  reminder_frequency_value: number;
  reminder_frequency_unit: 'MINUTE' | 'HOUR' | 'DAY' | 'ONCE';
  notify_creator: boolean | number;
}

export type ReminderRuleInput = Omit<ReminderRule, 'id' | 'condition_field' | 'action_name' | 'target_type'>;

@Injectable({ providedIn: 'root' })
export class RuleEngineService {
  private readonly url = `${environment.apiUrl}/api/rule-engine`;
  constructor(private http: HttpClient) {}

  getAll() { return this.http.get<ReminderRule[]>(this.url); }
  create(rule: ReminderRuleInput) { return this.http.post<{ rule_id: number }>(this.url, rule); }
  update(id: number, rule: ReminderRuleInput) { return this.http.put(this.url + '/' + id, rule); }
  setStatus(id: number, status: 'ACTIVE' | 'INACTIVE') { return this.http.patch(this.url + '/' + id + '/status', { status }); }
  delete(id: number) { return this.http.delete(this.url + '/' + id); }
}
