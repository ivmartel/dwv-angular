import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule } from '@angular/material';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material';
import { MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule } from '@angular/material';

import { DwvComponent } from './dwv.component';
import { TagsDialogComponent } from './tags-dialog.component';
import { TagsTableComponent } from './tags-table.component';

@NgModule({
  declarations: [
    DwvComponent,
    TagsDialogComponent,
    TagsTableComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule
  ],
  entryComponents: [
    TagsDialogComponent
  ],
  exports : [
    DwvComponent
  ]
})

export class DwvModule {}
