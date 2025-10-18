import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircularDetails } from './circular-details';

describe('CircularDetails', () => {
  let component: CircularDetails;
  let fixture: ComponentFixture<CircularDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircularDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircularDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
