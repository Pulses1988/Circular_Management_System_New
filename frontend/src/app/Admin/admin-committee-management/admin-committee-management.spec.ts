import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCommitteeManagement } from './admin-committee-management';

describe('AdminCommitteeManagement', () => {
  let component: AdminCommitteeManagement;
  let fixture: ComponentFixture<AdminCommitteeManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCommitteeManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCommitteeManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
