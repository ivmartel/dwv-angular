import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import * as dwv from 'dwv';

@Component({
  selector: 'app-dwv-tags-table',
  styleUrls: ['./tags-table.component.scss'],
  templateUrl: './tags-table.component.html'
})

export class TagsTableComponent {
  _fullMetaData: any;

  @Input()
  set data(value: any) {
    this._fullMetaData = value;
    // store keys (to not recreate them)
    this.keys = Object.keys(this._fullMetaData);
    // set slider with instance numbers ('00200013')
    let instanceNumbers = this._fullMetaData['InstanceNumber'].value;
    if (typeof instanceNumbers === 'string') {
      instanceNumbers = [instanceNumbers];
    }
    // convert string to numbers
    const numbers = instanceNumbers.map(Number);
    numbers.sort((a, b) => a - b);
    // store
    this.min = numbers[0];
    this.max = numbers[numbers.length - 1];
    // set data source
    this.setDataSource(this.min);
  }

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  public displayedColumns: string[] = ['name', 'value'];

  public dataSource: any;

  public min: number;
  public max: number;
  public instanceNumber: number;
  private keys: string[];

  constructor() {}

  setDataSource(instanceNumber: number) {
    // update member (to update html)
    this.instanceNumber = instanceNumber;
    // get instance meta data
    const metaData = this.getMetaArray(instanceNumber)
    // keep previous filter if defined
    let filter = '';
    if (this.dataSource) {
      filter = this.dataSource.filter;
    }
    // create data source
    this.dataSource = new MatTableDataSource<DicomTags>(metaData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filter = filter;
  }

  applyFilter(filterValue: string) {
     // Remove whitespace
    filterValue = filterValue.trim();
     // MatTableDataSource defaults to lowercase matches
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  onsliderchange(event: Event) {
    const sliderValue = parseInt((event.target as HTMLInputElement).value, 10);
    this.setDataSource(sliderValue);
  }

  getMetaArray(instanceNumber: number): any[] {
    const reducer = this.getTagReducer(this._fullMetaData, instanceNumber, '');
    return this.keys.reduce(reducer, []);
  }

  private getTagReducer(tagData: any, instanceNumber: number, prefix: string) {
    return (accumulator: any[], currentValue: string) => {
      let name = currentValue;
      const element = tagData[currentValue];
      let value = element.value;
      // possible 'merged' object
      if (typeof value[instanceNumber] !== 'undefined') {
        value = value[instanceNumber];
      }
      // force instance number (otherwise takes value in non indexed array)
      if (name === 'InstanceNumber') {
        value = instanceNumber;
      }
      // recurse for sequence
      if (element.vr === 'SQ') {
        // sequence tag
        accumulator.push({
          name: (prefix ? prefix + ' ' : '') + name,
          value: ''
        });
        // sequence value
        for (let i = 0; i < value.length; ++i) {
          const sqItems = value[i];
          const keys = Object.keys(sqItems);
          const res = keys.reduce(
            this.getTagReducer(sqItems, instanceNumber, prefix + '[' + i + ']'), []
          );
          accumulator = accumulator.concat(res);
        }
      } else {
        accumulator.push({
          name: (prefix ? prefix + ' ' : '') + name,
          value: value
        });
      }
      return accumulator;
    }
  }
}

interface DicomTags {
    name: string;
    value: string;
}
