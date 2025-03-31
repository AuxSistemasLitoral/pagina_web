import { TestBed } from '@angular/core/testing';

import { DiasGuard } from './dias.guard';

describe('DiasGuard', () => {
  let guard: DiasGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(DiasGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
