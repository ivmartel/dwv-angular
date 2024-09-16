import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TagsTableComponent } from './tags-table.component';
import { MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import * as i0 from "@angular/core";
import * as i1 from "@angular/material/dialog";
class DialogData {
    title;
    value;
}
export class TagsDialogComponent {
    dialogRef;
    data;
    constructor(dialogRef, data) {
        this.dialogRef = dialogRef;
        this.data = data;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.4", ngImport: i0, type: TagsDialogComponent, deps: [{ token: i1.MatDialogRef }, { token: MAT_DIALOG_DATA }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.4", type: TagsDialogComponent, isStandalone: true, selector: "dwv-tags-dialog", ngImport: i0, template: "<h1 mat-dialog-title>{{data.title}}</h1>\n<mat-dialog-content>\n  <dwv-tags-table [data]=\"data.value\"></dwv-tags-table>\n</mat-dialog-content>\n", dependencies: [{ kind: "directive", type: MatDialogTitle, selector: "[mat-dialog-title], [matDialogTitle]", inputs: ["id"], exportAs: ["matDialogTitle"] }, { kind: "directive", type: MatDialogContent, selector: "[mat-dialog-content], mat-dialog-content, [matDialogContent]" }, { kind: "component", type: TagsTableComponent, selector: "dwv-tags-table", inputs: ["data"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.4", ngImport: i0, type: TagsDialogComponent, decorators: [{
            type: Component,
            args: [{ selector: 'dwv-tags-dialog', standalone: true, imports: [
                        MatDialogTitle,
                        MatDialogContent,
                        TagsTableComponent
                    ], template: "<h1 mat-dialog-title>{{data.title}}</h1>\n<mat-dialog-content>\n  <dwv-tags-table [data]=\"data.value\"></dwv-tags-table>\n</mat-dialog-content>\n" }]
        }], ctorParameters: () => [{ type: i1.MatDialogRef }, { type: DialogData, decorators: [{
                    type: Inject,
                    args: [MAT_DIALOG_DATA]
                }] }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFncy1kaWFsb2cuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvZHd2LWFuZ3VsYXIvc3JjL2xpYi90YWdzLWRpYWxvZy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi9wcm9qZWN0cy9kd3YtYW5ndWxhci9zcmMvbGliL3RhZ3MtZGlhbG9nLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ2xELE9BQU8sRUFBRSxlQUFlLEVBQWdCLE1BQU0sMEJBQTBCLENBQUM7QUFHekUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFDNUQsT0FBTyxFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLDBCQUEwQixDQUFDOzs7QUFFNUUsTUFBTSxVQUFVO0lBQ2QsS0FBSyxDQUFVO0lBQ2YsS0FBSyxDQUErQjtDQUNyQztBQWFELE1BQU0sT0FBTyxtQkFBbUI7SUFHckI7SUFDeUI7SUFGbEMsWUFDUyxTQUE0QyxFQUNuQixJQUFnQjtRQUR6QyxjQUFTLEdBQVQsU0FBUyxDQUFtQztRQUNuQixTQUFJLEdBQUosSUFBSSxDQUFZO0lBQUcsQ0FBQzt1R0FKM0MsbUJBQW1CLDhDQUlwQixlQUFlOzJGQUpkLG1CQUFtQiwyRUN2QmhDLG9KQUlBLDRDRFlJLGNBQWMsK0hBQ2QsZ0JBQWdCLHlHQUNoQixrQkFBa0I7OzJGQUtULG1CQUFtQjtrQkFYL0IsU0FBUzsrQkFDRSxpQkFBaUIsY0FDZixJQUFJLFdBQ1A7d0JBQ1AsY0FBYzt3QkFDZCxnQkFBZ0I7d0JBQ2hCLGtCQUFrQjtxQkFDbkI7OzBCQVFFLE1BQU07MkJBQUMsZUFBZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgSW5qZWN0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBNQVRfRElBTE9HX0RBVEEsIE1hdERpYWxvZ1JlZiB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL2RpYWxvZyc7XG5pbXBvcnQgeyBEYXRhRWxlbWVudCB9IGZyb20gJ2R3dic7XG5cbmltcG9ydCB7IFRhZ3NUYWJsZUNvbXBvbmVudCB9IGZyb20gJy4vdGFncy10YWJsZS5jb21wb25lbnQnO1xuaW1wb3J0IHsgTWF0RGlhbG9nVGl0bGUsIE1hdERpYWxvZ0NvbnRlbnQgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9kaWFsb2cnO1xuXG5jbGFzcyBEaWFsb2dEYXRhIHtcbiAgdGl0bGUhOiBzdHJpbmc7XG4gIHZhbHVlITogUmVjb3JkPHN0cmluZywgRGF0YUVsZW1lbnQ+O1xufVxuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdkd3YtdGFncy1kaWFsb2cnLFxuICBzdGFuZGFsb25lOiB0cnVlLFxuICBpbXBvcnRzOiBbXG4gICAgTWF0RGlhbG9nVGl0bGUsXG4gICAgTWF0RGlhbG9nQ29udGVudCxcbiAgICBUYWdzVGFibGVDb21wb25lbnRcbiAgXSxcbiAgdGVtcGxhdGVVcmw6ICcuL3RhZ3MtZGlhbG9nLmNvbXBvbmVudC5odG1sJ1xufSlcblxuZXhwb3J0IGNsYXNzIFRhZ3NEaWFsb2dDb21wb25lbnQge1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBkaWFsb2dSZWY6IE1hdERpYWxvZ1JlZjxUYWdzRGlhbG9nQ29tcG9uZW50PixcbiAgICBASW5qZWN0KE1BVF9ESUFMT0dfREFUQSkgcHVibGljIGRhdGE6IERpYWxvZ0RhdGEpIHt9XG5cbn1cbiIsIjxoMSBtYXQtZGlhbG9nLXRpdGxlPnt7ZGF0YS50aXRsZX19PC9oMT5cbjxtYXQtZGlhbG9nLWNvbnRlbnQ+XG4gIDxkd3YtdGFncy10YWJsZSBbZGF0YV09XCJkYXRhLnZhbHVlXCI+PC9kd3YtdGFncy10YWJsZT5cbjwvbWF0LWRpYWxvZy1jb250ZW50PlxuIl19