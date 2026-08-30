import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRegionManagement } from './admin-region-management';

describe('AdminRegionManagement', () => {
  let component: AdminRegionManagement;
  let fixture: ComponentFixture<AdminRegionManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRegionManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminRegionManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
