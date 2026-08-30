import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminZoneManagement } from './admin-zone-management';

describe('AdminZoneManagement', () => {
  let component: AdminZoneManagement;
  let fixture: ComponentFixture<AdminZoneManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminZoneManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminZoneManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
