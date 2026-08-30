import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCircleManagement } from './admin-circle-management';

describe('AdminCircleManagement', () => {
  let component: AdminCircleManagement;
  let fixture: ComponentFixture<AdminCircleManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCircleManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCircleManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
