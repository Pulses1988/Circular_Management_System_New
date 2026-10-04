import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoAssignmentCreater } from './ho-assignment-creater';

describe('HoAssignmentCreater', () => {
  let component: HoAssignmentCreater;
  let fixture: ComponentFixture<HoAssignmentCreater>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoAssignmentCreater]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HoAssignmentCreater);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
