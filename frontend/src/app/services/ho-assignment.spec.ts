import { TestBed } from '@angular/core/testing';

import { HoAssignment } from './ho-assignment';

describe('HoAssignment', () => {
  let service: HoAssignment;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HoAssignment);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
