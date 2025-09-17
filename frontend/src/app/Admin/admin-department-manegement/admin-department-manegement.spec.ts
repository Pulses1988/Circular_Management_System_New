import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDepartmentManegement } from './admin-department-manegement';

describe('AdminDepartmentManegement', () => {
  let component: AdminDepartmentManegement;
  let fixture: ComponentFixture<AdminDepartmentManegement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDepartmentManegement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDepartmentManegement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
