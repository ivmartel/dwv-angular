import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DataElement } from 'dwv';

import { TagsTableComponent } from './tags-table.component';
import { MatDialogTitle, MatDialogContent } from '@angular/material/dialog';

class DialogData {
  title!: string;
  value!: Record<string, DataElement>;
}

@Component({
  selector: 'dwv-tags-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    TagsTableComponent
  ],
  templateUrl: './tags-dialog.component.html'
})

export class TagsDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<TagsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

}
