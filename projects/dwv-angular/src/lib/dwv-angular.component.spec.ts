import { beforeEach, describe, it, expect } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DwvComponent } from './dwv-angular.component';

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
    const legend = compiled.querySelector('.legend');
    expect(legend?.textContent).toContain('Powered by');
  });
});
