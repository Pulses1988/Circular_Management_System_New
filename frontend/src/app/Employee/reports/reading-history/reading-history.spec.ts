import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadingHistory } from './reading-history';

describe('ReadingHistory', () => {
  let component: ReadingHistory;
  let fixture: ComponentFixture<ReadingHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadingHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReadingHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
