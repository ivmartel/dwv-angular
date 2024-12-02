import { Component, Input, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DataElement, getTagFromKey } from 'dwv';

import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'dwv-tags-table',
  imports: [
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatSliderModule
  ],
  styleUrls: ['./tags-table.component.scss'],
  templateUrl: './tags-table.component.html'
})

export class TagsTableComponent {
  private _fullMetaData!: Record<string, DataElement>;

  public min!: number;
  public max!: number;
  public instanceNumber = 0;
  private instanceNumbers!: number[];
  private keys!: string[];

  @Input()
  set data(value: Record<string, DataElement>) {
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
      this.instanceNumbers.sort((a: number, b: number) => a - b);
      // store
      this.min = 0;
      this.max = this.instanceNumbers.length - 1;
      this.instanceNumber = this.instanceNumbers[this.min];
    }
    // set data source
    this.setDataSource(this.instanceNumber);
  }

  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  public displayedColumns: string[] = ['name', 'value'];

  public dataSource!: MatTableDataSource<SimpleDataElement>;

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
    this.dataSource = new MatTableDataSource<SimpleDataElement>(metaData);
    this.dataSource.sort = this.sort;
    this.dataSource.filter = filter;
  }

  onkeyup(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.applyFilter(event.target.value);
    }
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
    this.setDataSource(this.instanceNumbers[sliderValue]);
  }

  getMetaArray(instanceNumber: number): SimpleDataElement[] {
    let reducer;
    if (this.isDicomMeta(this._fullMetaData)) {
      reducer = this.getDicomTagReducer(this._fullMetaData, instanceNumber, '');
    } else {
      reducer = this.getTagReducer(this._fullMetaData);
    }
    return this.keys.reduce(reducer, []);
  }

  private isDicomMeta(meta: Record<string, DataElement>) {
    return typeof meta['00020010'] !== 'undefined';
  }

  private getTagReducer(tagData: Record<string, DataElement>) {
    return function (accumulator: SimpleDataElement[], currentValue: string) {
      accumulator.push({
        name: currentValue,
        value: tagData[currentValue].value
      });
      return accumulator;
    };
  }

  private getDicomTagReducer(tagData: Record<string, DataElement>, instanceNumber: number, prefix: string) {
    return (accumulator: SimpleDataElement[], currentValue: string) => {
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
          const res = keys.reduce(
            this.getDicomTagReducer(sqItems, instanceNumber, prefix + '[' + i + ']'), []
          );
          accumulator = accumulator.concat(res);
        }
      } else {
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
    }
  }
}

class SimpleDataElement {
  name!: string;
  value!: string|string[];
}
