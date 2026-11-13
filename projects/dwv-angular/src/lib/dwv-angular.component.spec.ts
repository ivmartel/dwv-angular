import { beforeEach, describe, it, expect, vi } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DwvComponent } from './dwv-angular.component';
import { DwvAppService } from '../services/dwv-app.service';
import { AnnotationService } from '../services/annotation.service';
import { DWV_VIEWER_ID } from '../services/viewer-id';

describe('DwvComponent', () => {
  let component: DwvComponent;
  let fixture: ComponentFixture<DwvComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatProgressBarModule
      ],
      providers: [
        provideZonelessChangeDetection()
      ]
    });
    fixture = TestBed.createComponent(DwvComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('showLegend', true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should init', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('renders the beginning of the legend', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('dwv-footer');
    expect(footer?.textContent).toContain('Powered by');
  });

  it('shows a snack bar on load error and abort', () => {
    const snackBar = TestBed.inject(MatSnackBar);
    const openSpy = vi.spyOn(snackBar, 'open');
    const service = fixture.debugElement.injector.get(DwvAppService);

    service.dispatchEvent(new CustomEvent('loaderror'));
    expect(openSpy).toHaveBeenLastCalledWith(
      'Received errors during load. Check log for details.', 'Close');

    service.dispatchEvent(new CustomEvent('loadabort'));
    expect(openSpy).toHaveBeenLastCalledWith(
      'Load was aborted.', 'Close', {duration: 5000});
  });

  it('shows a snack bar on annotation error', () => {
    const snackBar = TestBed.inject(MatSnackBar);
    const openSpy = vi.spyOn(snackBar, 'open');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const annotService = fixture.debugElement.injector.get(AnnotationService);

    expect(annotService.getAnnotationGroupAsDicom('unknown')).toBeUndefined();
    expect(openSpy).toHaveBeenLastCalledWith(
      'Cannot find annotation group with id unknown', 'Close');
    errorSpy.mockRestore();
  });

  it('uses one service instance and unique ids per viewer', () => {
    const other = TestBed.createComponent(DwvComponent);
    fixture.detectChanges();
    other.detectChanges();

    const service = fixture.debugElement.injector.get(DwvAppService);
    const otherService = other.debugElement.injector.get(DwvAppService);
    expect(otherService).not.toBe(service);
    expect(otherService.getLayerGroupDivId())
      .not.toBe(service.getLayerGroupDivId());
    const viewerId = fixture.debugElement.injector.get(DWV_VIEWER_ID);
    expect(service.getLayerGroupDivId()).toBe(viewerId + '-layerGroup');

    const ids = [fixture, other].flatMap(f =>
      Array.from((f.nativeElement as HTMLElement).querySelectorAll('[id]'),
        el => el.id));
    expect(new Set(ids).size).toBe(ids.length);
    other.destroy();
  });

  it('loads from the window location if asked and with search args', () => {
    const service = fixture.debugElement.injector.get(DwvAppService);
    const loadSpy = vi.spyOn(service, 'loadFromUri')
      .mockImplementation(() => undefined);
    const href = 'http://localhost/index.html?input=file.dcm';
    vi.spyOn(window, 'location', 'get').mockReturnValue(
      new URL(href) as unknown as Location);

    fixture.componentRef.setInput('loadFromWindowLocation', true);
    fixture.detectChanges();
    expect(loadSpy).toHaveBeenCalledWith(href);
    vi.restoreAllMocks();
  });

  it('does not load from the window location without search args', () => {
    const service = fixture.debugElement.injector.get(DwvAppService);
    const loadSpy = vi.spyOn(service, 'loadFromUri');

    fixture.componentRef.setInput('loadFromWindowLocation', true);
    fixture.detectChanges();
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('gives priority to the uri input over the window location', () => {
    const service = fixture.debugElement.injector.get(DwvAppService);
    const loadSpy = vi.spyOn(service, 'loadFromUri')
      .mockImplementation(() => undefined);
    vi.spyOn(window, 'location', 'get').mockReturnValue(
      new URL('http://localhost/?input=other.dcm') as unknown as Location);

    fixture.componentRef.setInput('uri', 'http://localhost/?input=file.dcm');
    fixture.componentRef.setInput('loadFromWindowLocation', true);
    fixture.detectChanges();
    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(loadSpy).toHaveBeenCalledWith('http://localhost/?input=file.dcm');
    vi.restoreAllMocks();
  });

  it('stops listening to service events when destroyed', () => {
    const snackBar = TestBed.inject(MatSnackBar);
    const openSpy = vi.spyOn(snackBar, 'open');
    const service = fixture.debugElement.injector.get(DwvAppService);
    const annotService = fixture.debugElement.injector.get(AnnotationService);

    fixture.destroy();
    service.dispatchEvent(new CustomEvent('loaderror'));
    annotService.dispatchEvent(
      new CustomEvent('error', {detail: new Error('test')}));
    expect(openSpy).not.toHaveBeenCalled();
  });
});
