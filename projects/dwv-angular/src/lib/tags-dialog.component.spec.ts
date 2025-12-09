import { beforeEach, describe, it, expect } from 'vitest'
import { Component, Input } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DataElement } from 'dwv';

import { TagsDialogComponent } from './tags-dialog.component';

describe('TagsDialogComponent', () => {
  let component: TagsDialogComponent;
  let fixture: ComponentFixture<TagsDialogComponent>;

  @Component({
    selector: 'dwv-tags-table',
    standalone: true,
    template: ''
  })
  class FakeTagsTableComponent {
    @Input() data!: Record<string, DataElement>;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatDialogModule,
        FakeTagsTableComponent
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {
            title: 'test title',
            value: 'test value'
          }
        },
        { provide: MatDialogRef, useValue: {} },
        provideZonelessChangeDetection()
      ]
    });
    fixture = TestBed.createComponent(TagsDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should init', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

});
