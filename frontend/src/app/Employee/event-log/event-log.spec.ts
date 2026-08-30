import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventLog } from './event-log';

describe('EventLog', () => {
  let component: EventLog;
  let fixture: ComponentFixture<EventLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventLog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventLog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
