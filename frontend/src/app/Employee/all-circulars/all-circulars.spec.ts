import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllCirculars } from './all-circulars';

describe('AllCirculars', () => {
  let component: AllCirculars;
  let fixture: ComponentFixture<AllCirculars>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllCirculars]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllCirculars);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
