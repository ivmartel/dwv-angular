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

  it('handles data without merge id', () => {
    component.data = {
      '00100010': {vr: 'PN', value: ['Doe^John']}
    } as unknown as Record<string, DataElement>;
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.mergeIds).toEqual([]);
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

  it('handles merged data', () => {
    component.data = {
      mergeId: ['2', '10', '1'],
      '00020010': {vr: 'UI', value: ['1.2.840.10008.1.2.1']},
      '00100010': {vr: 'PN', value: ['Doe^John']},
      '00200013': {vr: 'IS', value: {'2': ['2'], '10': ['10'], '1': ['1']}},
      '00081140': {vr: 'SQ', value: {
        '2': [{'00081155': {vr: 'UI', value: ['1.2.2']}}],
        '10': [{'00081155': {vr: 'UI', value: ['1.2.10']}}],
        '1': undefined
      }}
    } as unknown as Record<string, DataElement>;
    expect(() => fixture.detectChanges()).not.toThrow();
    // sorted merge ids
    expect(component.mergeIds).toEqual(['1', '2', '10']);
    expect(component.max).toBe(2);
    expect(component.mergeId).toBe('1');
    const getValue = (name: string) =>
      component.dataSource.data.find((item) => item.name === name)?.value;
    expect(component.dataSource.data.some((item) => item.name.includes('mergeId'))).toBe(false);
    expect(getValue('InstanceNumber')).toBe('1');
    expect(getValue('PatientName')).toBe('Doe^John');
    expect(getValue('ReferencedImageSequence')).toBe('');
    expect(getValue('[0] ReferencedSOPInstanceUID')).toBeUndefined();
    // slider shown
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-slider')).not.toBeNull();
    // change id
    const event = {target: {value: '2'}} as unknown as Event;
    component.onsliderchange(event);
    expect(component.mergeId).toBe('10');
    expect(getValue('InstanceNumber')).toBe('10');
    expect(getValue('[0] ReferencedSOPInstanceUID')).toBe('1.2.10');
  });

  it('shortens long other data', () => {
    component.data = {
      '00020010': {vr: 'UI', value: ['1.2.840.10008.1.2.1']},
      '7FE00010': {vr: 'OW', value: new Uint16Array(20)}
    } as unknown as Record<string, DataElement>;
    fixture.detectChanges();
    expect(component.dataSource.data.find((item) => item.name === 'PixelData')?.value)
      .toBe('0,0,0,0,0,0,0,0,0,0... (len:20)');
  });

});
