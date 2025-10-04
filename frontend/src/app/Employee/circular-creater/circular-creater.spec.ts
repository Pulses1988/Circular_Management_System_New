import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircularCreater } from './circular-creater';

describe('CircularCreater', () => {
  let component: CircularCreater;
  let fixture: ComponentFixture<CircularCreater>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircularCreater]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircularCreater);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
