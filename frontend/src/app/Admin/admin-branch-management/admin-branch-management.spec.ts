import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBranchManagement } from './admin-branch-management';

describe('AdminBranchManagement', () => {
  let component: AdminBranchManagement;
  let fixture: ComponentFixture<AdminBranchManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBranchManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminBranchManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
