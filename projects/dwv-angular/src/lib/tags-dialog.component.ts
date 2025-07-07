import { Component, inject } from '@angular/core';
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
  imports: [
    MatDialogTitle,
    MatDialogContent,
    TagsTableComponent
  ],
  templateUrl: './tags-dialog.component.html'
})

export class TagsDialogComponent {
  dialogRef = inject<MatDialogRef<TagsDialogComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);

}
