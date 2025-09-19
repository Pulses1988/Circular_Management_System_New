import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRolesManegement } from './admin-roles-manegement';

describe('AdminRolesManegement', () => {
  let component: AdminRolesManegement;
  let fixture: ComponentFixture<AdminRolesManegement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRolesManegement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminRolesManegement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
