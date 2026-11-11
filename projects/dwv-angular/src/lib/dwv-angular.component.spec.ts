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
    const service = TestBed.inject(DwvAppService);

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
    const annotService = TestBed.inject(AnnotationService);

    expect(annotService.getAnnotationGroupAsDicom('unknown')).toBeUndefined();
    expect(openSpy).toHaveBeenLastCalledWith(
      'Cannot find annotation group with id unknown', 'Close');
    errorSpy.mockRestore();
  });

  it('stops listening to service events when destroyed', () => {
    const snackBar = TestBed.inject(MatSnackBar);
    const openSpy = vi.spyOn(snackBar, 'open');
    const service = TestBed.inject(DwvAppService);

    fixture.destroy();
    service.dispatchEvent(new CustomEvent('loaderror'));
    TestBed.inject(AnnotationService).dispatchEvent(
      new CustomEvent('error', {detail: new Error('test')}));
    expect(openSpy).not.toHaveBeenCalled();
  });
});
