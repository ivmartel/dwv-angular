import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DataElement } from 'dwv';
import * as i0 from "@angular/core";
export declare class TagsTableComponent {
    private _fullMetaData;
    min: number;
    max: number;
    instanceNumber: number;
    private instanceNumbers;
    private keys;
    set data(value: Record<string, DataElement>);
    sort: MatSort;
    displayedColumns: string[];
    dataSource: MatTableDataSource<SimpleDataElement>;
    setDataSource(instanceNumber: number): void;
    onkeyup(event: Event): void;
    applyFilter(filterValue: string): void;
    onsliderchange(event: Event): void;
    getMetaArray(instanceNumber: number): SimpleDataElement[];
    private isDicomMeta;
    private getTagReducer;
    private getDicomTagReducer;
    static ɵfac: i0.ɵɵFactoryDeclaration<TagsTableComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<TagsTableComponent, "dwv-tags-table", never, { "data": { "alias": "data"; "required": false; }; }, {}, never, never, true, never>;
}
declare class SimpleDataElement {
    name: string;
    value: string | string[];
}
export {};
