import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilteredCirculars } from './filtered-circulars';

describe('FilteredCirculars', () => {
  let component: FilteredCirculars;
  let fixture: ComponentFixture<FilteredCirculars>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilteredCirculars]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilteredCirculars);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
