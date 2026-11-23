import { beforeEach, describe, it, expect, vi } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DwvAppService } from './dwv-app.service';
import { DWV_VIEWER_ID } from './viewer-id';

describe('DwvAppService', () => {
  let service: DwvAppService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {provide: DWV_VIEWER_ID, useValue: 'dwv-test'},
        DwvAppService
      ]
    });
    service = TestBed.inject(DwvAppService);
  });

  it('should load the input url of an uri', () => {
    const loadSpy = vi.spyOn(service, 'loadURLs')
      .mockImplementation(() => undefined);
    service.loadFromUri('https://demo.com/index.html?input=file.dcm');
    expect(loadSpy).toHaveBeenCalledWith(['file.dcm']);
  });

  it('should load the urls of a key-value uri', () => {
    const loadSpy = vi.spyOn(service, 'loadURLs')
      .mockImplementation(() => undefined);
    const input = encodeURIComponent('https://data.com/?id=a&id=b');
    service.loadFromUri('https://demo.com/index.html?input=' + input);
    expect(loadSpy).toHaveBeenCalledWith([
      'https://data.com/?id=a',
      'https://data.com/?id=b'
    ]);
  });

  it('should not load an uri without input', () => {
    const loadSpy = vi.spyOn(service, 'loadURLs');
    service.loadFromUri('https://demo.com/index.html');
    service.loadFromUri('https://demo.com/index.html?other=file.dcm');
    expect(loadSpy).not.toHaveBeenCalled();
  });
});
