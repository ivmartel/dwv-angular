import { Component, Input, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { getTagFromKey } from 'dwv';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatSliderModule } from '@angular/material/slider';
import * as i0 from "@angular/core";
import * as i1 from "@angular/material/input";
import * as i2 from "@angular/material/form-field";
import * as i3 from "@angular/material/table";
import * as i4 from "@angular/material/slider";
export class TagsTableComponent {
    _fullMetaData;
    min;
    max;
    instanceNumber = 0;
    instanceNumbers;
    keys;
    set data(value) {
        this._fullMetaData = value;
        // store keys (to not recreate them)
        this.keys = Object.keys(this._fullMetaData);
        const instanceElement = this._fullMetaData['00200013'];
        if (typeof instanceElement !== 'undefined') {
            // set slider with instance numbers ('00200013')
            let instanceNumberValue = instanceElement.value;
            if (typeof instanceNumberValue === 'string') {
                instanceNumberValue = [instanceNumberValue];
            }
            // convert string to numbers
            this.instanceNumbers = instanceNumberValue.map(Number);
            this.instanceNumbers.sort((a, b) => a - b);
            // store
            this.min = 0;
            this.max = this.instanceNumbers.length - 1;
            this.instanceNumber = this.instanceNumbers[this.min];
        }
        // set data source
        this.setDataSource(this.instanceNumber);
    }
    sort;
    displayedColumns = ['name', 'value'];
    dataSource;
    setDataSource(instanceNumber) {
        // update member (to update html)
        this.instanceNumber = instanceNumber;
        // get instance meta data
        const metaData = this.getMetaArray(instanceNumber);
        // keep previous filter if defined
        let filter = '';
        if (this.dataSource) {
            filter = this.dataSource.filter;
        }
        // create data source
        this.dataSource = new MatTableDataSource(metaData);
        this.dataSource.sort = this.sort;
        this.dataSource.filter = filter;
    }
    onkeyup(event) {
        if (event.target instanceof HTMLInputElement) {
            this.applyFilter(event.target.value);
        }
    }
    applyFilter(filterValue) {
        // Remove whitespace
        filterValue = filterValue.trim();
        // MatTableDataSource defaults to lowercase matches
        filterValue = filterValue.toLowerCase();
        this.dataSource.filter = filterValue;
    }
    onsliderchange(event) {
        const sliderValue = parseInt(event.target.value, 10);
        this.setDataSource(this.instanceNumbers[sliderValue]);
    }
    getMetaArray(instanceNumber) {
        let reducer;
        if (this.isDicomMeta(this._fullMetaData)) {
            reducer = this.getDicomTagReducer(this._fullMetaData, instanceNumber, '');
        }
        else {
            reducer = this.getTagReducer(this._fullMetaData);
        }
        return this.keys.reduce(reducer, []);
    }
    isDicomMeta(meta) {
        return typeof meta['00020010'] !== 'undefined';
    }
    getTagReducer(tagData) {
        return function (accumulator, currentValue) {
            accumulator.push({
                name: currentValue,
                value: tagData[currentValue].value
            });
            return accumulator;
        };
    }
    getDicomTagReducer(tagData, instanceNumber, prefix) {
        return (accumulator, currentValue) => {
            const tag = getTagFromKey(currentValue);
            let key = tag.getNameFromDictionary();
            if (typeof key === 'undefined') {
                // add 'x' to help sorting
                key = 'x' + tag.getKey();
            }
            const name = key;
            const element = tagData[currentValue];
            // recurse for sequence
            if (element.vr === 'SQ') {
                // sequence tag
                accumulator.push({
                    name: (prefix ? prefix + ' ' : '') + name,
                    value: ''
                });
                // sequence value
                for (let i = 0; i < element.value.length; ++i) {
                    const sqItems = element.value[i];
                    const keys = Object.keys(sqItems);
                    const res = keys.reduce(this.getDicomTagReducer(sqItems, instanceNumber, prefix + '[' + i + ']'), []);
                    accumulator = accumulator.concat(res);
                }
            }
            else {
                let value;
                // possible 'merged' object
                // (use slice method as test for array and typed array)
                if (typeof element.value.slice === 'undefined' &&
                    typeof element.value[instanceNumber] !== 'undefined') {
                    value = element.value[instanceNumber];
                }
                // force instance number (otherwise takes value in non indexed array)
                if (name === 'InstanceNumber') {
                    value = instanceNumber.toString();
                }
                // shorten long 'o'ther data
                if (element.vr[0] === 'O' && element.value.length > 10) {
                    value = element.value.slice(0, 10).toString() + '... (len:' + element.value.length + ')';
                }
                // else
                if (typeof value === 'undefined') {
                    value = element.value.toString();
                }
                // store
                accumulator.push({
                    name: (prefix ? prefix + ' ' : '') + name,
                    value: value
                });
            }
            return accumulator;
        };
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.4", ngImport: i0, type: TagsTableComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.4", type: TagsTableComponent, isStandalone: true, selector: "dwv-tags-table", inputs: { data: "data" }, viewQueries: [{ propertyName: "sort", first: true, predicate: MatSort, descendants: true, static: true }], ngImport: i0, template: "<div>\n  <mat-form-field class=\"searchfield\">\n    <input class=\"searchinput\" matInput (keyup)=\"onkeyup($event)\" placeholder=\"Filter\">\n  </mat-form-field>\n  <mat-slider class=\"instanceslider\" id=\"instanceslider\"\n    [min]=\"min\" [max]=\"max\" step=\"1\" showTickMarks=\"true\" matTooltip=\"Instance number\">\n    <input class=\"instanceinput\" matSliderThumb (input)=\"onsliderchange($event)\">\n  </mat-slider>\n  <label for=\"instanceslider\" class=\"instancelabel\" matTooltip=\"Instance number\">{{instanceNumber}}</label>\n\n  <section class=\"container mat-elevation-z8\">\n    <table mat-table [dataSource]=\"dataSource\" matSort class=\"mat-elevation-z4\">\n      <!-- name column -->\n      <ng-container matColumnDef=\"name\">\n        <th mat-header-cell *matHeaderCellDef mat-sort-header> Name </th>\n        <td mat-cell *matCellDef=\"let element\"> {{element.name}} </td>\n      </ng-container>\n      <!-- value column -->\n      <ng-container matColumnDef=\"value\">\n        <th mat-header-cell *matHeaderCellDef mat-sort-header> Value </th>\n        <td mat-cell *matCellDef=\"let element\"> {{element.value}} </td>\n      </ng-container>\n      <!-- row template -->\n      <tr mat-header-row *matHeaderRowDef=\"displayedColumns; sticky: true\"></tr>\n      <tr mat-row *matRowDef=\"let row; columns: displayedColumns;\"></tr>\n    </table>\n  </section>\n</div>\n", styles: [".instanceslider{width:25%;margin:10px}.instancelabel{margin-left:15px}.searchfield{padding-right:20px;width:50%}.searchinput{width:80%}.container{height:400px;overflow:auto}\n"], dependencies: [{ kind: "ngmodule", type: FormsModule }, { kind: "ngmodule", type: MatInputModule }, { kind: "directive", type: i1.MatInput, selector: "input[matInput], textarea[matInput], select[matNativeControl],      input[matNativeControl], textarea[matNativeControl]", inputs: ["disabled", "id", "placeholder", "name", "required", "type", "errorStateMatcher", "aria-describedby", "value", "readonly"], exportAs: ["matInput"] }, { kind: "component", type: i2.MatFormField, selector: "mat-form-field", inputs: ["hideRequiredMarker", "color", "floatLabel", "appearance", "subscriptSizing", "hintLabel"], exportAs: ["matFormField"] }, { kind: "ngmodule", type: MatFormFieldModule }, { kind: "ngmodule", type: MatTableModule }, { kind: "component", type: i3.MatTable, selector: "mat-table, table[mat-table]", exportAs: ["matTable"] }, { kind: "directive", type: i3.MatHeaderCellDef, selector: "[matHeaderCellDef]" }, { kind: "directive", type: i3.MatHeaderRowDef, selector: "[matHeaderRowDef]", inputs: ["matHeaderRowDef", "matHeaderRowDefSticky"] }, { kind: "directive", type: i3.MatColumnDef, selector: "[matColumnDef]", inputs: ["matColumnDef"] }, { kind: "directive", type: i3.MatCellDef, selector: "[matCellDef]" }, { kind: "directive", type: i3.MatRowDef, selector: "[matRowDef]", inputs: ["matRowDefColumns", "matRowDefWhen"] }, { kind: "directive", type: i3.MatHeaderCell, selector: "mat-header-cell, th[mat-header-cell]" }, { kind: "directive", type: i3.MatCell, selector: "mat-cell, td[mat-cell]" }, { kind: "component", type: i3.MatHeaderRow, selector: "mat-header-row, tr[mat-header-row]", exportAs: ["matHeaderRow"] }, { kind: "component", type: i3.MatRow, selector: "mat-row, tr[mat-row]", exportAs: ["matRow"] }, { kind: "ngmodule", type: MatSliderModule }, { kind: "component", type: i4.MatSlider, selector: "mat-slider", inputs: ["disabled", "discrete", "showTickMarks", "min", "color", "disableRipple", "max", "step", "displayWith"], exportAs: ["matSlider"] }, { kind: "directive", type: i4.MatSliderThumb, selector: "input[matSliderThumb]", inputs: ["value"], outputs: ["valueChange", "dragStart", "dragEnd"], exportAs: ["matSliderThumb"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.4", ngImport: i0, type: TagsTableComponent, decorators: [{
            type: Component,
            args: [{ selector: 'dwv-tags-table', standalone: true, imports: [
                        FormsModule,
                        MatInputModule,
                        MatFormFieldModule,
                        MatTableModule,
                        MatSliderModule
                    ], template: "<div>\n  <mat-form-field class=\"searchfield\">\n    <input class=\"searchinput\" matInput (keyup)=\"onkeyup($event)\" placeholder=\"Filter\">\n  </mat-form-field>\n  <mat-slider class=\"instanceslider\" id=\"instanceslider\"\n    [min]=\"min\" [max]=\"max\" step=\"1\" showTickMarks=\"true\" matTooltip=\"Instance number\">\n    <input class=\"instanceinput\" matSliderThumb (input)=\"onsliderchange($event)\">\n  </mat-slider>\n  <label for=\"instanceslider\" class=\"instancelabel\" matTooltip=\"Instance number\">{{instanceNumber}}</label>\n\n  <section class=\"container mat-elevation-z8\">\n    <table mat-table [dataSource]=\"dataSource\" matSort class=\"mat-elevation-z4\">\n      <!-- name column -->\n      <ng-container matColumnDef=\"name\">\n        <th mat-header-cell *matHeaderCellDef mat-sort-header> Name </th>\n        <td mat-cell *matCellDef=\"let element\"> {{element.name}} </td>\n      </ng-container>\n      <!-- value column -->\n      <ng-container matColumnDef=\"value\">\n        <th mat-header-cell *matHeaderCellDef mat-sort-header> Value </th>\n        <td mat-cell *matCellDef=\"let element\"> {{element.value}} </td>\n      </ng-container>\n      <!-- row template -->\n      <tr mat-header-row *matHeaderRowDef=\"displayedColumns; sticky: true\"></tr>\n      <tr mat-row *matRowDef=\"let row; columns: displayedColumns;\"></tr>\n    </table>\n  </section>\n</div>\n", styles: [".instanceslider{width:25%;margin:10px}.instancelabel{margin-left:15px}.searchfield{padding-right:20px;width:50%}.searchinput{width:80%}.container{height:400px;overflow:auto}\n"] }]
        }], propDecorators: { data: [{
                type: Input
            }], sort: [{
                type: ViewChild,
                args: [MatSort, { static: true }]
            }] } });
class SimpleDataElement {
    name;
    value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFncy10YWJsZS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9kd3YtYW5ndWxhci9zcmMvbGliL3RhZ3MtdGFibGUuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vcHJvamVjdHMvZHd2LWFuZ3VsYXIvc3JjL2xpYi90YWdzLXRhYmxlLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUM1RCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFDakQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDN0QsT0FBTyxFQUFlLGFBQWEsRUFBRSxNQUFNLEtBQUssQ0FBQztBQUVqRCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0MsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ3pELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ2xFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RCxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7Ozs7OztBQWdCM0QsTUFBTSxPQUFPLGtCQUFrQjtJQUNyQixhQUFhLENBQStCO0lBRTdDLEdBQUcsQ0FBVTtJQUNiLEdBQUcsQ0FBVTtJQUNiLGNBQWMsR0FBRyxDQUFDLENBQUM7SUFDbEIsZUFBZSxDQUFZO0lBQzNCLElBQUksQ0FBWTtJQUV4QixJQUNJLElBQUksQ0FBQyxLQUFrQztRQUN6QyxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztRQUMzQixvQ0FBb0M7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUks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Q0FDZCxlQUFlOzsyRkFNTixrQkFBa0I7a0JBZDlCLFNBQVM7K0JBQ0UsZ0JBQWdCLGNBQ2QsSUFBSSxXQUNQO3dCQUNQLFdBQVc7d0JBQ1gsY0FBYzt3QkFDZCxrQkFBa0I7d0JBQ2xCLGNBQWM7d0JBQ2QsZUFBZTtxQkFDaEI7OEJBZUcsSUFBSTtzQkFEUCxLQUFLO2dCQXlCZ0MsSUFBSTtzQkFBekMsU0FBUzt1QkFBQyxPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFOztBQTBIdEMsTUFBTSxpQkFBaUI7SUFDckIsSUFBSSxDQUFVO0lBQ2QsS0FBSyxDQUFtQjtDQUN6QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgSW5wdXQsIFZpZXdDaGlsZCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTWF0U29ydCB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL3NvcnQnO1xuaW1wb3J0IHsgTWF0VGFibGVEYXRhU291cmNlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvdGFibGUnO1xuaW1wb3J0IHsgRGF0YUVsZW1lbnQsIGdldFRhZ0Zyb21LZXkgfSBmcm9tICdkd3YnO1xuXG5pbXBvcnQgeyBGb3Jtc01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcbmltcG9ydCB7IE1hdElucHV0TW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvaW5wdXQnO1xuaW1wb3J0IHsgTWF0Rm9ybUZpZWxkTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvZm9ybS1maWVsZCc7XG5pbXBvcnQgeyBNYXRUYWJsZU1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL3RhYmxlJztcbmltcG9ydCB7IE1hdFNsaWRlck1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL3NsaWRlcic7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2R3di10YWdzLXRhYmxlJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgaW1wb3J0czogW1xuICAgIEZvcm1zTW9kdWxlLFxuICAgIE1hdElucHV0TW9kdWxlLFxuICAgIE1hdEZvcm1GaWVsZE1vZHVsZSxcbiAgICBNYXRUYWJsZU1vZHVsZSxcbiAgICBNYXRTbGlkZXJNb2R1bGVcbiAgXSxcbiAgc3R5bGVVcmxzOiBbJy4vdGFncy10YWJsZS5jb21wb25lbnQuc2NzcyddLFxuICB0ZW1wbGF0ZVVybDogJy4vdGFncy10YWJsZS5jb21wb25lbnQuaHRtbCdcbn0pXG5cbmV4cG9ydCBjbGFzcyBUYWdzVGFibGVDb21wb25lbnQge1xuICBwcml2YXRlIF9mdWxsTWV0YURhdGEhOiBSZWNvcmQ8c3RyaW5nLCBEYXRhRWxlbWVudD47XG5cbiAgcHVibGljIG1pbiE6IG51bWJlcjtcbiAgcHVibGljIG1heCE6IG51bWJlcjtcbiAgcHVibGljIGluc3RhbmNlTnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBpbnN0YW5jZU51bWJlcnMhOiBudW1iZXJbXTtcbiAgcHJpdmF0ZSBrZXlzITogc3RyaW5nW107XG5cbiAgQElucHV0KClcbiAgc2V0IGRhdGEodmFsdWU6IFJlY29yZDxzdHJpbmcsIERhdGFFbGVtZW50Pikge1xuICAgIHRoaXMuX2Z1bGxNZXRhRGF0YSA9IHZhbHVlO1xuICAgIC8vIHN0b3JlIGtleXMgKHRvIG5vdCByZWNyZWF0ZSB0aGVtKVxuICAgIHRoaXMua2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuX2Z1bGxNZXRhRGF0YSk7XG5cbiAgICBjb25zdCBpbnN0YW5jZUVsZW1lbnQgPSB0aGlzLl9mdWxsTWV0YURhdGFbJzAwMjAwMDEzJ107XG4gICAgaWYgKHR5cGVvZiBpbnN0YW5jZUVsZW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBzZXQgc2xpZGVyIHdpdGggaW5zdGFuY2UgbnVtYmVycyAoJzAwMjAwMDEzJylcbiAgICAgIGxldCBpbnN0YW5jZU51bWJlclZhbHVlID0gaW5zdGFuY2VFbGVtZW50LnZhbHVlO1xuICAgICAgaWYgKHR5cGVvZiBpbnN0YW5jZU51bWJlclZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICBpbnN0YW5jZU51bWJlclZhbHVlID0gW2luc3RhbmNlTnVtYmVyVmFsdWVdO1xuICAgICAgfVxuICAgICAgLy8gY29udmVydCBzdHJpbmcgdG8gbnVtYmVyc1xuICAgICAgdGhpcy5pbnN0YW5jZU51bWJlcnMgPSBpbnN0YW5jZU51bWJlclZhbHVlLm1hcChOdW1iZXIpO1xuICAgICAgdGhpcy5pbnN0YW5jZU51bWJlcnMuc29ydCgoYTogbnVtYmVyLCBiOiBudW1iZXIpID0+IGEgLSBiKTtcbiAgICAgIC8vIHN0b3JlXG4gICAgICB0aGlzLm1pbiA9IDA7XG4gICAgICB0aGlzLm1heCA9IHRoaXMuaW5zdGFuY2VOdW1iZXJzLmxlbmd0aCAtIDE7XG4gICAgICB0aGlzLmluc3RhbmNlTnVtYmVyID0gdGhpcy5pbnN0YW5jZU51bWJlcnNbdGhpcy5taW5dO1xuICAgIH1cbiAgICAvLyBzZXQgZGF0YSBzb3VyY2VcbiAgICB0aGlzLnNldERhdGFTb3VyY2UodGhpcy5pbnN0YW5jZU51bWJlcik7XG4gIH1cblxuICBAVmlld0NoaWxkKE1hdFNvcnQsIHsgc3RhdGljOiB0cnVlIH0pIHNvcnQhOiBNYXRTb3J0O1xuXG4gIHB1YmxpYyBkaXNwbGF5ZWRDb2x1bW5zOiBzdHJpbmdbXSA9IFsnbmFtZScsICd2YWx1ZSddO1xuXG4gIHB1YmxpYyBkYXRhU291cmNlITogTWF0VGFibGVEYXRhU291cmNlPFNpbXBsZURhdGFFbGVtZW50PjtcblxuICBzZXREYXRhU291cmNlKGluc3RhbmNlTnVtYmVyOiBudW1iZXIpIHtcbiAgICAvLyB1cGRhdGUgbWVtYmVyICh0byB1cGRhdGUgaHRtbClcbiAgICB0aGlzLmluc3RhbmNlTnVtYmVyID0gaW5zdGFuY2VOdW1iZXI7XG4gICAgLy8gZ2V0IGluc3RhbmNlIG1ldGEgZGF0YVxuICAgIGNvbnN0IG1ldGFEYXRhID0gdGhpcy5nZXRNZXRhQXJyYXkoaW5zdGFuY2VOdW1iZXIpXG4gICAgLy8ga2VlcCBwcmV2aW91cyBmaWx0ZXIgaWYgZGVmaW5lZFxuICAgIGxldCBmaWx0ZXIgPSAnJztcbiAgICBpZiAodGhpcy5kYXRhU291cmNlKSB7XG4gICAgICBmaWx0ZXIgPSB0aGlzLmRhdGFTb3VyY2UuZmlsdGVyO1xuICAgIH1cbiAgICAvLyBjcmVhdGUgZGF0YSBzb3VyY2VcbiAgICB0aGlzLmRhdGFTb3VyY2UgPSBuZXcgTWF0VGFibGVEYXRhU291cmNlPFNpbXBsZURhdGFFbGVtZW50PihtZXRhRGF0YSk7XG4gICAgdGhpcy5kYXRhU291cmNlLnNvcnQgPSB0aGlzLnNvcnQ7XG4gICAgdGhpcy5kYXRhU291cmNlLmZpbHRlciA9IGZpbHRlcjtcbiAgfVxuXG4gIG9ua2V5dXAoZXZlbnQ6IEV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LnRhcmdldCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICAgIHRoaXMuYXBwbHlGaWx0ZXIoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBhcHBseUZpbHRlcihmaWx0ZXJWYWx1ZTogc3RyaW5nKSB7XG4gICAgIC8vIFJlbW92ZSB3aGl0ZXNwYWNlXG4gICAgZmlsdGVyVmFsdWUgPSBmaWx0ZXJWYWx1ZS50cmltKCk7XG4gICAgIC8vIE1hdFRhYmxlRGF0YVNvdXJjZSBkZWZhdWx0cyB0byBsb3dlcmNhc2UgbWF0Y2hlc1xuICAgIGZpbHRlclZhbHVlID0gZmlsdGVyVmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICB0aGlzLmRhdGFTb3VyY2UuZmlsdGVyID0gZmlsdGVyVmFsdWU7XG4gIH1cblxuICBvbnNsaWRlcmNoYW5nZShldmVudDogRXZlbnQpIHtcbiAgICBjb25zdCBzbGlkZXJWYWx1ZSA9IHBhcnNlSW50KChldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUsIDEwKTtcbiAgICB0aGlzLnNldERhdGFTb3VyY2UodGhpcy5pbnN0YW5jZU51bWJlcnNbc2xpZGVyVmFsdWVdKTtcbiAgfVxuXG4gIGdldE1ldGFBcnJheShpbnN0YW5jZU51bWJlcjogbnVtYmVyKTogU2ltcGxlRGF0YUVsZW1lbnRbXSB7XG4gICAgbGV0IHJlZHVjZXI7XG4gICAgaWYgKHRoaXMuaXNEaWNvbU1ldGEodGhpcy5fZnVsbE1ldGFEYXRhKSkge1xuICAgICAgcmVkdWNlciA9IHRoaXMuZ2V0RGljb21UYWdSZWR1Y2VyKHRoaXMuX2Z1bGxNZXRhRGF0YSwgaW5zdGFuY2VOdW1iZXIsICcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVkdWNlciA9IHRoaXMuZ2V0VGFnUmVkdWNlcih0aGlzLl9mdWxsTWV0YURhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5rZXlzLnJlZHVjZShyZWR1Y2VyLCBbXSk7XG4gIH1cblxuICBwcml2YXRlIGlzRGljb21NZXRhKG1ldGE6IFJlY29yZDxzdHJpbmcsIERhdGFFbGVtZW50Pikge1xuICAgIHJldHVybiB0eXBlb2YgbWV0YVsnMDAwMjAwMTAnXSAhPT0gJ3VuZGVmaW5lZCc7XG4gIH1cblxuICBwcml2YXRlIGdldFRhZ1JlZHVjZXIodGFnRGF0YTogUmVjb3JkPHN0cmluZywgRGF0YUVsZW1lbnQ+KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChhY2N1bXVsYXRvcjogU2ltcGxlRGF0YUVsZW1lbnRbXSwgY3VycmVudFZhbHVlOiBzdHJpbmcpIHtcbiAgICAgIGFjY3VtdWxhdG9yLnB1c2goe1xuICAgICAgICBuYW1lOiBjdXJyZW50VmFsdWUsXG4gICAgICAgIHZhbHVlOiB0YWdEYXRhW2N1cnJlbnRWYWx1ZV0udmFsdWVcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGdldERpY29tVGFnUmVkdWNlcih0YWdEYXRhOiBSZWNvcmQ8c3RyaW5nLCBEYXRhRWxlbWVudD4sIGluc3RhbmNlTnVtYmVyOiBudW1iZXIsIHByZWZpeDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIChhY2N1bXVsYXRvcjogU2ltcGxlRGF0YUVsZW1lbnRbXSwgY3VycmVudFZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IHRhZyA9IGdldFRhZ0Zyb21LZXkoY3VycmVudFZhbHVlKTtcbiAgICAgIGxldCBrZXkgPSB0YWcuZ2V0TmFtZUZyb21EaWN0aW9uYXJ5KCk7XG4gICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gYWRkICd4JyB0byBoZWxwIHNvcnRpbmdcbiAgICAgICAga2V5ID0gJ3gnICsgdGFnLmdldEtleSgpO1xuICAgICAgfVxuICAgICAgY29uc3QgbmFtZSA9IGtleTtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0YWdEYXRhW2N1cnJlbnRWYWx1ZV07XG4gICAgICAvLyByZWN1cnNlIGZvciBzZXF1ZW5jZVxuICAgICAgaWYgKGVsZW1lbnQudnIgPT09ICdTUScpIHtcbiAgICAgICAgLy8gc2VxdWVuY2UgdGFnXG4gICAgICAgIGFjY3VtdWxhdG9yLnB1c2goe1xuICAgICAgICAgIG5hbWU6IChwcmVmaXggPyBwcmVmaXggKyAnICcgOiAnJykgKyBuYW1lLFxuICAgICAgICAgIHZhbHVlOiAnJ1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gc2VxdWVuY2UgdmFsdWVcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtZW50LnZhbHVlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgY29uc3Qgc3FJdGVtcyA9IGVsZW1lbnQudmFsdWVbaV07XG4gICAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHNxSXRlbXMpO1xuICAgICAgICAgIGNvbnN0IHJlcyA9IGtleXMucmVkdWNlKFxuICAgICAgICAgICAgdGhpcy5nZXREaWNvbVRhZ1JlZHVjZXIoc3FJdGVtcywgaW5zdGFuY2VOdW1iZXIsIHByZWZpeCArICdbJyArIGkgKyAnXScpLCBbXVxuICAgICAgICAgICk7XG4gICAgICAgICAgYWNjdW11bGF0b3IgPSBhY2N1bXVsYXRvci5jb25jYXQocmVzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHZhbHVlO1xuICAgICAgICAvLyBwb3NzaWJsZSAnbWVyZ2VkJyBvYmplY3RcbiAgICAgICAgLy8gKHVzZSBzbGljZSBtZXRob2QgYXMgdGVzdCBmb3IgYXJyYXkgYW5kIHR5cGVkIGFycmF5KVxuICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnQudmFsdWUuc2xpY2UgPT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgdHlwZW9mIGVsZW1lbnQudmFsdWVbaW5zdGFuY2VOdW1iZXJdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHZhbHVlID0gZWxlbWVudC52YWx1ZVtpbnN0YW5jZU51bWJlcl07XG4gICAgICAgIH1cbiAgICAgICAgLy8gZm9yY2UgaW5zdGFuY2UgbnVtYmVyIChvdGhlcndpc2UgdGFrZXMgdmFsdWUgaW4gbm9uIGluZGV4ZWQgYXJyYXkpXG4gICAgICAgIGlmIChuYW1lID09PSAnSW5zdGFuY2VOdW1iZXInKSB7XG4gICAgICAgICAgdmFsdWUgPSBpbnN0YW5jZU51bWJlci50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHNob3J0ZW4gbG9uZyAnbyd0aGVyIGRhdGFcbiAgICAgICAgaWYgKGVsZW1lbnQudnJbMF0gPT09ICdPJyAmJiBlbGVtZW50LnZhbHVlLmxlbmd0aCA+IDEwKSB7XG4gICAgICAgICAgdmFsdWUgPSBlbGVtZW50LnZhbHVlLnNsaWNlKDAsIDEwKS50b1N0cmluZygpICsgJy4uLiAobGVuOicgKyBlbGVtZW50LnZhbHVlLmxlbmd0aCArICcpJztcbiAgICAgICAgfVxuICAgICAgICAvLyBlbHNlXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgdmFsdWUgPSBlbGVtZW50LnZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc3RvcmVcbiAgICAgICAgYWNjdW11bGF0b3IucHVzaCh7XG4gICAgICAgICAgbmFtZTogKHByZWZpeCA/IHByZWZpeCArICcgJyA6ICcnKSArIG5hbWUsXG4gICAgICAgICAgdmFsdWU6IHZhbHVlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBTaW1wbGVEYXRhRWxlbWVudCB7XG4gIG5hbWUhOiBzdHJpbmc7XG4gIHZhbHVlITogc3RyaW5nfHN0cmluZ1tdO1xufVxuIiwiPGRpdj5cbiAgPG1hdC1mb3JtLWZpZWxkIGNsYXNzPVwic2VhcmNoZmllbGRcIj5cbiAgICA8aW5wdXQgY2xhc3M9XCJzZWFyY2hpbnB1dFwiIG1hdElucHV0IChrZXl1cCk9XCJvbmtleXVwKCRldmVudClcIiBwbGFjZWhvbGRlcj1cIkZpbHRlclwiPlxuICA8L21hdC1mb3JtLWZpZWxkPlxuICA8bWF0LXNsaWRlciBjbGFzcz1cImluc3RhbmNlc2xpZGVyXCIgaWQ9XCJpbnN0YW5jZXNsaWRlclwiXG4gICAgW21pbl09XCJtaW5cIiBbbWF4XT1cIm1heFwiIHN0ZXA9XCIxXCIgc2hvd1RpY2tNYXJrcz1cInRydWVcIiBtYXRUb29sdGlwPVwiSW5zdGFuY2UgbnVtYmVyXCI+XG4gICAgPGlucHV0IGNsYXNzPVwiaW5zdGFuY2VpbnB1dFwiIG1hdFNsaWRlclRodW1iIChpbnB1dCk9XCJvbnNsaWRlcmNoYW5nZSgkZXZlbnQpXCI+XG4gIDwvbWF0LXNsaWRlcj5cbiAgPGxhYmVsIGZvcj1cImluc3RhbmNlc2xpZGVyXCIgY2xhc3M9XCJpbnN0YW5jZWxhYmVsXCIgbWF0VG9vbHRpcD1cIkluc3RhbmNlIG51bWJlclwiPnt7aW5zdGFuY2VOdW1iZXJ9fTwvbGFiZWw+XG5cbiAgPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXIgbWF0LWVsZXZhdGlvbi16OFwiPlxuICAgIDx0YWJsZSBtYXQtdGFibGUgW2RhdGFTb3VyY2VdPVwiZGF0YVNvdXJjZVwiIG1hdFNvcnQgY2xhc3M9XCJtYXQtZWxldmF0aW9uLXo0XCI+XG4gICAgICA8IS0tIG5hbWUgY29sdW1uIC0tPlxuICAgICAgPG5nLWNvbnRhaW5lciBtYXRDb2x1bW5EZWY9XCJuYW1lXCI+XG4gICAgICAgIDx0aCBtYXQtaGVhZGVyLWNlbGwgKm1hdEhlYWRlckNlbGxEZWYgbWF0LXNvcnQtaGVhZGVyPiBOYW1lIDwvdGg+XG4gICAgICAgIDx0ZCBtYXQtY2VsbCAqbWF0Q2VsbERlZj1cImxldCBlbGVtZW50XCI+IHt7ZWxlbWVudC5uYW1lfX0gPC90ZD5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPCEtLSB2YWx1ZSBjb2x1bW4gLS0+XG4gICAgICA8bmctY29udGFpbmVyIG1hdENvbHVtbkRlZj1cInZhbHVlXCI+XG4gICAgICAgIDx0aCBtYXQtaGVhZGVyLWNlbGwgKm1hdEhlYWRlckNlbGxEZWYgbWF0LXNvcnQtaGVhZGVyPiBWYWx1ZSA8L3RoPlxuICAgICAgICA8dGQgbWF0LWNlbGwgKm1hdENlbGxEZWY9XCJsZXQgZWxlbWVudFwiPiB7e2VsZW1lbnQudmFsdWV9fSA8L3RkPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8IS0tIHJvdyB0ZW1wbGF0ZSAtLT5cbiAgICAgIDx0ciBtYXQtaGVhZGVyLXJvdyAqbWF0SGVhZGVyUm93RGVmPVwiZGlzcGxheWVkQ29sdW1uczsgc3RpY2t5OiB0cnVlXCI+PC90cj5cbiAgICAgIDx0ciBtYXQtcm93ICptYXRSb3dEZWY9XCJsZXQgcm93OyBjb2x1bW5zOiBkaXNwbGF5ZWRDb2x1bW5zO1wiPjwvdHI+XG4gICAgPC90YWJsZT5cbiAgPC9zZWN0aW9uPlxuPC9kaXY+XG4iXX0=