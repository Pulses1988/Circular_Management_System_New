import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBranchAdminForm } from './create-branch-admin-form';

describe('CreateBranchAdminForm', () => {
  let component: CreateBranchAdminForm;
  let fixture: ComponentFixture<CreateBranchAdminForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBranchAdminForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateBranchAdminForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
