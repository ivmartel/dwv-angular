import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TestBed, ComponentFixture, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatSliderModule } from '@angular/material/slider';

import { TagsTableComponent } from './tags-table.component';

describe('TagsTableComponent', () => {
  let component: TagsTableComponent;
  let fixture: ComponentFixture<TagsTableComponent>;

  beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
          imports: [
              BrowserAnimationsModule,
              FormsModule,
              MatInputModule,
              MatFormFieldModule,
              MatTableModule,
              MatSliderModule
          ],
          declarations: [
              TagsTableComponent
          ]
      }).compileComponents();
  }));

  beforeEach(() => {
      fixture = TestBed.createComponent(TagsTableComponent);
      component = fixture.debugElement.componentInstance;
  });

  it('should create', () => {
      expect(component).toBeTruthy();
  });

  it('should init', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
  });

});
