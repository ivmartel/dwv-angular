import { beforeEach, describe, it, expect, vi } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { DwvContentComponent } from './content.component';
import { DwvAppService } from '../services/dwv-app.service';

/**
 * Create a drag event (jsdom does not provide DragEvent).
 * @param type The event type.
 * @param files Optional files.
 * @param relatedTarget Optional related target.
 * @returns The event.
 */
function createDragEvent(
  type: string,
  files: File[] = [],
  relatedTarget: EventTarget | null = null
) {
  const event = new Event(type, {bubbles: true, cancelable: true});
  Object.defineProperty(event, 'dataTransfer', {value: {files}});
  Object.defineProperty(event, 'relatedTarget', {value: relatedTarget});
  return event;
}

describe('DwvContentComponent', () => {
  let fixture: ComponentFixture<DwvContentComponent>;
  let service: DwvAppService;
  let layer: HTMLElement;
  let box: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection()
      ]
    });
    fixture = TestBed.createComponent(DwvContentComponent);
    service = TestBed.inject(DwvAppService);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    layer = compiled.querySelector(
      '#' + service.getLayerGroupDivId()) as HTMLElement;
    box = compiled.querySelector('#dropBox') as HTMLElement;
  });

  it('sets the layer group div id from the service', () => {
    expect(layer).not.toBeNull();
    expect(layer.id).toBe(service.getLayerGroupDivId());
  });

  it('shows the drop box with border when no data', () => {
    expect(box.style.display).toBe('initial');
    expect(box.classList).toContain('dropBox');
    expect(box.classList).toContain('dropBoxBorder');
    expect(box.classList).not.toContain('hover');
  });

  it('loads dropped files once', () => {
    const spy = vi.spyOn(service, 'loadFiles').mockReturnValue(undefined);
    const file = new File(['a'], 'a.dcm');
    const event = createDragEvent('drop', [file]);
    box.dispatchEvent(event);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith([file]);
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not load on empty drop', () => {
    const spy = vi.spyOn(service, 'loadFiles').mockReturnValue(undefined);
    layer.dispatchEvent(createDragEvent('drop'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('toggles hover on drag over and leave', () => {
    box.dispatchEvent(createDragEvent('dragover'));
    fixture.detectChanges();
    expect(box.classList).toContain('hover');

    // leaving towards a child of the box keeps the hover
    const child = box.querySelector('p');
    box.dispatchEvent(createDragEvent('dragleave', [], child));
    fixture.detectChanges();
    expect(box.classList).toContain('hover');

    // leaving towards the layer removes it
    box.dispatchEvent(createDragEvent('dragleave', [], layer));
    fixture.detectChanges();
    expect(box.classList).not.toContain('hover');
  });

  it('does not hover when dragging over the layer outside the box', () => {
    layer.dispatchEvent(createDragEvent('dragover'));
    fixture.detectChanges();
    expect(box.classList).not.toContain('hover');
  });
});
