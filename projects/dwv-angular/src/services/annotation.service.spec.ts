import { beforeEach, describe, it, expect, vi } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnnotationGroup, DrawLayer } from 'dwv';

import { DwvAppService } from './dwv-app.service';
import { AnnotationService } from './annotation.service';
import { DWV_VIEWER_ID } from './viewer-id';

/**
 * Create a minimal annotation stub.
 *
 * @param id The annotation tracking UID.
 * @returns The annotation stub.
 */
function createAnnotation(id: string) {
  return {
    trackingUid: id,
    trackingId: 'label-' + id,
    colour: '#ffff80',
    quantification: undefined,
    getFactory: () => ({getName: () => 'RulerFactory'}),
    canView: () => true,
    getCentroid: () => ({})
  };
}

describe('AnnotationService', () => {
  let dwvAppService: DwvAppService;
  let service: AnnotationService;
  let drawLayer: {
    setCurrentPosition: ReturnType<typeof vi.fn>;
    highlightAnnotation: ReturnType<typeof vi.fn>;
  };

  /**
   * Dispatch a dwv service event.
   *
   * @param type The event type.
   * @param detail The event detail.
   */
  function fire(type: string, detail: object) {
    dwvAppService.dispatchEvent(new CustomEvent(type, {detail}));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {provide: DWV_VIEWER_ID, useValue: 'test'},
        DwvAppService,
        AnnotationService
      ]
    });
    dwvAppService = TestBed.inject(DwvAppService);
    service = TestBed.inject(AnnotationService);

    // one group '0' with annotations 'a' and 'b'
    const annotations = [createAnnotation('a'), createAnnotation('b')];
    const group = {
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      isEditable: () => true,
      getList: () => annotations,
      find: (id: string) => annotations.find((item) => item.trackingUid === id)
    };
    vi.spyOn(dwvAppService, 'getAnnotationGroup').mockReturnValue(
      group as unknown as AnnotationGroup);
    drawLayer = {
      setCurrentPosition: vi.fn(),
      highlightAnnotation: vi.fn()
    };
    vi.spyOn(dwvAppService, 'getDrawLayersByDataId').mockReturnValue(
      [drawLayer as unknown as DrawLayer]);
    fire('dataadd', {dataid: '0'});
  });

  it('selects the tapped annotation', () => {
    fire('tap', {annotations: [
      {dataid: '0', annotationid: 'b'},
      {dataid: '0', annotationid: 'a'}
    ]});
    expect(service.state().selected).toEqual({dataId: '0', annotationId: 'b'});
  });

  it('clears the selection on a tap outside annotations', () => {
    service.selectAnnotation('0', 'a');
    fire('tap', {annotations: []});
    expect(service.state().selected).toBeUndefined();
  });

  it('clears the selection on a tap on an unknown annotation', () => {
    service.selectAnnotation('0', 'a');
    fire('tap', {annotations: [{dataid: '0', annotationid: 'unknown'}]});
    expect(service.state().selected).toBeUndefined();
  });

  it('highlights the annotation when going to it', () => {
    service.gotoAnnotation('0', 'a');
    expect(drawLayer.setCurrentPosition).toHaveBeenCalledOnce();
    expect(drawLayer.highlightAnnotation).toHaveBeenCalledWith('a');
  });
});
