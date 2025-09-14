import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSignup } from './admin-signup';

describe('AdminSignup', () => {
  let component: AdminSignup;
  let fixture: ComponentFixture<AdminSignup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSignup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSignup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
