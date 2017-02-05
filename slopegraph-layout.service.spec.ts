/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SlopegraphLayoutService } from './slopegraph-layout.service';

describe('SlopegraphLayoutService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SlopegraphLayoutService]
    });
  });

  it('should ...', inject([SlopegraphLayoutService], (service: SlopegraphLayoutService) => {
    expect(service).toBeTruthy();
  }));
});
