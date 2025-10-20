import { TestBed } from '@angular/core/testing';

import { SpinOverlayServiceService } from './spin-overlay-service.service';

describe('SpinOverlayServiceService', () => {
  let service: SpinOverlayServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpinOverlayServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
