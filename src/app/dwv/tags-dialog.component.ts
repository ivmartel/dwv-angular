import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-dwv-tags-dialog',
    templateUrl: './tags-dialog.component.html'
})

export class TagsDialogComponent {

    constructor(
        public dialogRef: MatDialogRef<TagsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {}

}
