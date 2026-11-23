import { Component, Input, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DataElement, getDicomTagInfo, getTagFromKey } from 'dwv';

import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatSliderModule } from '@angular/material/slider';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'dwv-tags-table',
  imports: [
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatSliderModule,
    MatSortModule,
    MatTooltipModule
  ],
  styleUrls: ['./tags-table.component.scss'],
  templateUrl: './tags-table.component.html'
})

/**
 * Table of the DICOM tags of the loaded data. Merged data (several
 *   slices or volumes) has a `mergeId` list and per id values for the
 *   elements that differ between them: a slider allows to select the
 *   displayed id.
 */
export class TagsTableComponent {
  private _fullMetaData!: Record<string, DataElement>;

  public min = 0;
  public max = 0;
  /**
   * The displayed merge id (the instance number, with a volume suffix
   *   for multi-volume data), empty if the data is not merged.
   */
  public mergeId = '';
  /**
   * The sorted list of merge ids.
   */
  public mergeIds: string[] = [];
  private keys!: string[];

  /**
   * Set the meta data to display.
   *
   * @param value The meta data, as returned by the dwv app.
   */
  @Input()
  set data(value: Record<string, DataElement>) {
    this._fullMetaData = value;
    // store element keys (to not recreate them)
    this.keys = Object.keys(this._fullMetaData).filter(
      (key) => key !== MERGE_ID_KEY
    );

    // reset merge ids (data may not have any)
    this.mergeIds = [];
    this.min = 0;
    this.max = 0;
    this.mergeId = '';

    const mergeIds: unknown = (this._fullMetaData as Record<string, unknown>)[MERGE_ID_KEY];
    if (Array.isArray(mergeIds) && mergeIds.length !== 0) {
      this.mergeIds = mergeIds.map(String);
      this.mergeIds.sort(
        (a, b) => a.localeCompare(b, undefined, {numeric: true})
      );
      this.min = 0;
      this.max = this.mergeIds.length - 1;
      this.mergeId = this.mergeIds[this.min];
    }
    // set data source
    this.setDataSource(this.mergeId);
  }

  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  public displayedColumns: string[] = ['name', 'value'];

  public dataSource!: MatTableDataSource<SimpleDataElement>;

  /**
   * Set the table data source for a merge id.
   *
   * @param mergeId The merge id.
   */
  setDataSource(mergeId: string) {
    // update member (to update html)
    this.mergeId = mergeId;
    // get the meta data for the id
    const metaData = this.getMetaArray(mergeId);
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

  /**
   * Handle a filter input key up event.
   *
   * @param event The key up event.
   */
  onkeyup(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.applyFilter(event.target.value);
    }
  }

  /**
   * Apply a filter to the table.
   *
   * @param filterValue The filter string.
   */
  applyFilter(filterValue: string) {
     // Remove whitespace
    filterValue = filterValue.trim();
     // MatTableDataSource defaults to lowercase matches
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  /**
   * Handle a slider change event.
   *
   * @param event The slider input event.
   */
  onsliderchange(event: Event) {
    const sliderValue = parseInt((event.target as HTMLInputElement).value, 10);
    const mergeId = this.mergeIds[sliderValue];
    if (typeof mergeId !== 'undefined') {
      this.setDataSource(mergeId);
    }
  }

  /**
   * Get the list of displayed elements for a merge id.
   *
   * @param mergeId The merge id.
   * @returns The list of elements.
   */
  getMetaArray(mergeId: string): SimpleDataElement[] {
    let reducer;
    if (this.isDicomMeta(this._fullMetaData)) {
      reducer = this.getDicomTagReducer(this._fullMetaData, mergeId, '');
    } else {
      reducer = this.getTagReducer(this._fullMetaData, mergeId);
    }
    return this.keys.reduce(reducer, []);
  }

  private isDicomMeta(meta: Record<string, DataElement>) {
    return typeof meta['00020010'] !== 'undefined';
  }

  /**
   * Get the value of an element for a merge id: merged elements
   *   which values differ have a value object indexed by merge id.
   *
   * @param element The data element.
   * @param mergeId The merge id.
   * @returns The element value.
   */
  private getElementValue(element: DataElement, mergeId: string) {
    const value: unknown = element.value;
    if (typeof value === 'object' && value !== null &&
      !Array.isArray(value) && !ArrayBuffer.isView(value)) {
      return (value as Record<string, unknown>)[mergeId];
    }
    return value;
  }

  private getTagReducer(tagData: Record<string, DataElement>, mergeId: string) {
    return (accumulator: SimpleDataElement[], currentValue: string) => {
      const value = this.getElementValue(tagData[currentValue], mergeId);
      accumulator.push({
        name: currentValue,
        value: typeof value === 'undefined' ? '' : String(value)
      });
      return accumulator;
    };
  }

  private getDicomTagReducer(tagData: Record<string, DataElement>, mergeId: string, prefix: string) {
    return (accumulator: SimpleDataElement[], currentValue: string) => {
      const tag = getTagFromKey(currentValue);
      let key = getDicomTagInfo(tag)?.getName();
      if (typeof key === 'undefined') {
        // add 'x' to help sorting
        key = 'x' + tag.getKey();
      }
      const name = (prefix ? prefix + ' ' : '') + key;
      const element = tagData[currentValue];
      const elementValue = this.getElementValue(element, mergeId) as
        DataElement['value'] | undefined | null;
      // element not present for this id
      if (typeof elementValue === 'undefined' || elementValue === null) {
        accumulator.push({name, value: ''});
        return accumulator;
      }
      // recurse for sequence
      if (element.vr === 'SQ') {
        // sequence tag
        accumulator.push({name, value: ''});
        // sequence items
        for (let i = 0; i < elementValue.length; ++i) {
          const sqItems = elementValue[i];
          const keys = Object.keys(sqItems);
          const res = keys.reduce(
            this.getDicomTagReducer(sqItems, mergeId, prefix + '[' + i + ']'), []
          );
          accumulator = accumulator.concat(res);
        }
      } else {
        let value: string;
        // shorten long 'o'ther data
        if (element.vr[0] === 'O' && elementValue.length > 10) {
          value = elementValue.slice(0, 10).toString() +
            '... (len:' + elementValue.length + ')';
        } else {
          value = elementValue.toString();
        }
        accumulator.push({name, value});
      }
      return accumulator;
    };
  }
}

/**
 * Key of the merge id list in merged meta data.
 */
const MERGE_ID_KEY = 'mergeId';

/**
 * Simple element used as table row.
 */
class SimpleDataElement {
  name!: string;
  value!: string;
}
