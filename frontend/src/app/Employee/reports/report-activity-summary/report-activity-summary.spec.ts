import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportActivitySummary } from './report-activity-summary';

describe('ReportActivitySummary', () => {
  let component: ReportActivitySummary;
  let fixture: ComponentFixture<ReportActivitySummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportActivitySummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportActivitySummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
