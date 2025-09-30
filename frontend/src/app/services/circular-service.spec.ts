import { TestBed } from '@angular/core/testing';

import { CircularService } from './circular-service';

describe('CircularService', () => {
  let service: CircularService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CircularService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
