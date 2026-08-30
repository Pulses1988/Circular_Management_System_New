import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportReport } from './export-report';

describe('ExportReport', () => {
  let component: ExportReport;
  let fixture: ComponentFixture<ExportReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
