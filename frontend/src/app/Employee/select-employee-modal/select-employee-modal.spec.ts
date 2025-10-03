import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectEmployeeModal } from './select-employee-modal';

describe('SelectEmployeeModal', () => {
  let component: SelectEmployeeModal;
  let fixture: ComponentFixture<SelectEmployeeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectEmployeeModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectEmployeeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
