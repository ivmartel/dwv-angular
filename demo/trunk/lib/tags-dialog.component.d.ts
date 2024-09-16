import { MatDialogRef } from '@angular/material/dialog';
import { DataElement } from 'dwv';
import * as i0 from "@angular/core";
declare class DialogData {
    title: string;
    value: Record<string, DataElement>;
}
export declare class TagsDialogComponent {
    dialogRef: MatDialogRef<TagsDialogComponent>;
    data: DialogData;
    constructor(dialogRef: MatDialogRef<TagsDialogComponent>, data: DialogData);
    static ɵfac: i0.ɵɵFactoryDeclaration<TagsDialogComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<TagsDialogComponent, "dwv-tags-dialog", never, {}, {}, never, never, true, never>;
}
export {};
