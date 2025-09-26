import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCircular } from './create-circular';

describe('CreateCircular', () => {
  let component: CreateCircular;
  let fixture: ComponentFixture<CreateCircular>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCircular]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCircular);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
