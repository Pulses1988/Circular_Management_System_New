import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivitySummary } from './activity-summary';

describe('ActivitySummary', () => {
  let component: ActivitySummary;
  let fixture: ComponentFixture<ActivitySummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivitySummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivitySummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
