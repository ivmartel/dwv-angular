import { Component, Input } from '@angular/core';
import { TestBed, ComponentFixture, async } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { TagsDialogComponent } from './tags-dialog.component';

describe('TagsDialogComponent', () => {
  let component: TagsDialogComponent;
  let fixture: ComponentFixture<TagsDialogComponent>;

  @Component({
      selector: 'app-dwv-tags-table',
      template: ''
  })
  class FakeTagsTableComponent {
      @Input() data: any;
  }

  beforeEach(async(() => {
      TestBed.configureTestingModule({
          imports: [
              MatDialogModule
          ],
          declarations: [
              TagsDialogComponent,
              FakeTagsTableComponent
          ],
          providers: [
              { provide: MAT_DIALOG_DATA, useValue: {} },
              { provide: MatDialogRef, useValue: {} }
          ]
    }).compileComponents();
  }));

  beforeEach(() => {
      fixture = TestBed.createComponent(TagsDialogComponent);
      component = fixture.debugElement.componentInstance;
  });

  it('should create', () => {
      expect(component).toBeTruthy();
  });

  it('should init', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
  });

});
