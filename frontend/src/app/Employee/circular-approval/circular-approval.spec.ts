import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircularApproval } from './circular-approval';

describe('CircularApproval', () => {
  let component: CircularApproval;
  let fixture: ComponentFixture<CircularApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircularApproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircularApproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
