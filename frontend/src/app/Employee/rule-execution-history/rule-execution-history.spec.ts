import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleExecutionHistory } from './rule-execution-history';

describe('RuleExecutionHistory', () => {
  let component: RuleExecutionHistory;
  let fixture: ComponentFixture<RuleExecutionHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleExecutionHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RuleExecutionHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
