import { beforeEach, describe, it, expect } from 'vitest'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatSliderModule } from '@angular/material/slider';

import { DataElement } from 'dwv';

import { TagsTableComponent } from './tags-table.component';

describe('TagsTableComponent', () => {
  let component: TagsTableComponent;
  let fixture: ComponentFixture<TagsTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        MatInputModule,
        MatFormFieldModule,
        MatTableModule,
        MatSliderModule
      ],
      providers: [
        provideZonelessChangeDetection()
      ]
    });
    fixture = TestBed.createComponent(TagsTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should init', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('handles data without instance number', () => {
    component.data = {
      '00100010': {vr: 'PN', value: ['Doe^John']}
    } as unknown as Record<string, DataElement>;
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.instanceNumbers).toEqual([]);
    expect(component.dataSource.data.length).toBe(1);
    // no slider shown
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-slider')).toBeNull();
    // slider change is a no-op
    const event = {target: {value: '0'}} as unknown as Event;
    expect(() => component.onsliderchange(event)).not.toThrow();
  });

  it('connects the table sort', () => {
    component.data = {
      '00100010': {vr: 'PN', value: ['Doe^John']}
    } as unknown as Record<string, DataElement>;
    fixture.detectChanges();
    expect(component.sort).toBeDefined();
    expect(component.dataSource.sort).toBe(component.sort);
  });

});
