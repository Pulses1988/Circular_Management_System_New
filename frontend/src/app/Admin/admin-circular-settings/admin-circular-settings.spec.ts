import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCircularSettings } from './admin-circular-settings';

describe('AdminCircularSettings', () => {
  let component: AdminCircularSettings;
  let fixture: ComponentFixture<AdminCircularSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCircularSettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCircularSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
