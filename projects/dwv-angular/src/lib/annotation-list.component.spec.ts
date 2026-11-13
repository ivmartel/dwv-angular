import { beforeEach, describe, it, expect } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { DwvAnnotationListComponent } from './annotation-list.component';
import { DwvAppService } from '../services/dwv-app.service';
import { AnnotationService } from '../services/annotation.service';
import { DWV_VIEWER_ID } from '../services/viewer-id';

describe('DwvAnnotationListComponent', () => {
  let fixture: ComponentFixture<DwvAnnotationListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {provide: DWV_VIEWER_ID, useValue: 'test'},
        DwvAppService,
        AnnotationService
      ]
    });
    fixture = TestBed.createComponent(DwvAnnotationListComponent);
    fixture.detectChanges();
  });

  it('prefixes the annotation div id with the viewer id', () => {
    expect(fixture.componentInstance.getAnnotationDivId('0', '1.2.3'))
      .toBe('test-annotationgroup0-annotation1.2.3');
  });
});
