import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilteredHoAssignments } from './filtered-ho-assignments';

describe('FilteredHoAssignments', () => {
  let component: FilteredHoAssignments;
  let fixture: ComponentFixture<FilteredHoAssignments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilteredHoAssignments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilteredHoAssignments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
