import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAuditTrail } from './admin-audit-trail';

describe('AdminAuditTrail', () => {
  let component: AdminAuditTrail;
  let fixture: ComponentFixture<AdminAuditTrail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAuditTrail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAuditTrail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
