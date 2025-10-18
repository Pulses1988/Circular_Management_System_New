import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCircular } from './edit-circular';

describe('EditCircular', () => {
  let component: EditCircular;
  let fixture: ComponentFixture<EditCircular>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCircular]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCircular);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
