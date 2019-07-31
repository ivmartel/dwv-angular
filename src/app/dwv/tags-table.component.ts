import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
    selector: 'app-dwv-tags-table',
    templateUrl: './tags-table.component.html'
})

export class TagsTableComponent implements OnInit {

    @Input() data: any;

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    displayedColumns: string[] = ['name', 'value'];

    dataSource: any;

    constructor() {}

    ngOnInit() {
        this.dataSource = new MatTableDataSource<DicomTags>(this.data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
        this.dataSource.filter = filterValue;
    }

}

interface DicomTags {
    name: string;
    value: string;
}
