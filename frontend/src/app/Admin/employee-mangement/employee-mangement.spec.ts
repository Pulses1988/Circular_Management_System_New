import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeMangement } from './employee-mangement';

describe('EmployeeMangement', () => {
  let component: EmployeeMangement;
  let fixture: ComponentFixture<EmployeeMangement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeMangement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeMangement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
