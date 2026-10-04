import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllHoAssignments } from './all-ho-assignments';

describe('AllHoAssignments', () => {
  let component: AllHoAssignments;
  let fixture: ComponentFixture<AllHoAssignments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllHoAssignments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllHoAssignments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
