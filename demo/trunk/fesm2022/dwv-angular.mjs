import * as i0 from '@angular/core';
import { Component, Input, ViewChild, Inject, VERSION, ViewEncapsulation } from '@angular/core';
import { getTagFromKey, decoderScripts, getDwvVersion, ToolConfig, App, ViewConfig, AppOptions } from 'dwv';
import * as i1$1 from '@angular/material/dialog';
import { MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogModule } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import * as i3 from '@angular/material/table';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import * as i1 from '@angular/material/input';
import { MatInputModule } from '@angular/material/input';
import * as i2 from '@angular/material/form-field';
import { MatFormFieldModule } from '@angular/material/form-field';
import * as i4 from '@angular/material/slider';
import { MatSliderModule } from '@angular/material/slider';
import * as i2$1 from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import * as i3$1 from '@angular/material/button-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import * as i4$1 from '@angular/material/icon';
import { MatIconModule } from '@angular/material/icon';
import * as i5 from '@angular/material/progress-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

class TagsTableComponent {
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

class DialogData {
    title;
    value;
}
class TagsDialogComponent {
    dialogRef;
    data;
    constructor(dialogRef, data) {
        this.dialogRef = dialogRef;
        this.data = data;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.4", ngImport: i0, type: TagsDialogComponent, deps: [{ token: i1$1.MatDialogRef }, { token: MAT_DIALOG_DATA }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.4", type: TagsDialogComponent, isStandalone: true, selector: "dwv-tags-dialog", ngImport: i0, template: "<h1 mat-dialog-title>{{data.title}}</h1>\n<mat-dialog-content>\n  <dwv-tags-table [data]=\"data.value\"></dwv-tags-table>\n</mat-dialog-content>\n", dependencies: [{ kind: "directive", type: MatDialogTitle, selector: "[mat-dialog-title], [matDialogTitle]", inputs: ["id"], exportAs: ["matDialogTitle"] }, { kind: "directive", type: MatDialogContent, selector: "[mat-dialog-content], mat-dialog-content, [matDialogContent]" }, { kind: "component", type: TagsTableComponent, selector: "dwv-tags-table", inputs: ["data"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.4", ngImport: i0, type: TagsDialogComponent, decorators: [{
            type: Component,
            args: [{ selector: 'dwv-tags-dialog', standalone: true, imports: [
                        MatDialogTitle,
                        MatDialogContent,
                        TagsTableComponent
                    ], template: "<h1 mat-dialog-title>{{data.title}}</h1>\n<mat-dialog-content>\n  <dwv-tags-table [data]=\"data.value\"></dwv-tags-table>\n</mat-dialog-content>\n" }]
        }], ctorParameters: () => [{ type: i1$1.MatDialogRef }, { type: DialogData, decorators: [{
                    type: Inject,
                    args: [MAT_DIALOG_DATA]
                }] }] });

// Image decoders (for web workers)
decoderScripts.jpeg2000 = 'assets/dwv/decoders/pdfjs/decode-jpeg2000.js';
decoderScripts['jpeg-lossless'] = 'assets/dwv/decoders/rii-mango/decode-jpegloss.js';
decoderScripts['jpeg-baseline'] = 'assets/dwv/decoders/pdfjs/decode-jpegbaseline.js';
decoderScripts.rle = 'assets/dwv/decoders/dwv/decode-rle.js';
class DwvEvent {
    dataid;
}
class DwvComponent {
    dialog;
    showLegend = false;
    versions = {
        dwv: getDwvVersion(),
        angular: VERSION.full
    };
    tools = {
        Scroll: new ToolConfig(),
        ZoomAndPan: new ToolConfig(),
        WindowLevel: new ToolConfig(),
        Draw: new ToolConfig(['Ruler']),
    };
    toolNames = Object.keys(this.tools);
    selectedTool = 'Select Tool';
    loadProgress = 0;
    dataLoaded = false;
    dwvApp;
    metaData;
    orientation;
    // drop box class name
    dropboxDivId = 'dropBox';
    dropboxClassName = 'dropBox';
    borderClassName = 'dropBoxBorder';
    hoverClassName = 'hover';
    constructor(dialog) {
        this.dialog = dialog;
    }
    ngOnInit() {
        // create app
        this.dwvApp = new App();
        // initialise app
        const viewConfig0 = new ViewConfig('layerGroup0');
        const viewConfigs = { '*': [viewConfig0] };
        const options = new AppOptions(viewConfigs);
        options.tools = this.tools;
        this.dwvApp.init(options);
        // handle load events
        let nLoadItem = 0;
        let nReceivedLoadError = 0;
        let nReceivedLoadAbort = 0;
        let isFirstRender = false;
        this.dwvApp.addEventListener('loadstart', ( /*event*/) => {
            // reset flags
            this.dataLoaded = false;
            nLoadItem = 0;
            nReceivedLoadError = 0;
            nReceivedLoadAbort = 0;
            isFirstRender = true;
            // hide drop box
            this.showDropbox(false);
        });
        this.dwvApp.addEventListener('loadprogress', (event) => {
            this.loadProgress = event.loaded;
        });
        this.dwvApp.addEventListener('renderend', ( /*event*/) => {
            if (isFirstRender) {
                isFirstRender = false;
                // available tools
                let selectedTool = 'ZoomAndPan';
                if (this.dwvApp.canScroll()) {
                    selectedTool = 'Scroll';
                }
                this.onChangeTool(selectedTool);
            }
        });
        this.dwvApp.addEventListener('load', (event) => {
            // set dicom tags
            this.metaData = this.dwvApp.getMetaData(event.dataid);
            // set data loaded flag
            this.dataLoaded = true;
        });
        this.dwvApp.addEventListener('loadend', ( /*event*/) => {
            if (nReceivedLoadError) {
                this.loadProgress = 0;
                alert('Received errors during load. Check log for details.');
                // show drop box if nothing has been loaded
                if (!nLoadItem) {
                    this.showDropbox(true);
                }
            }
            if (nReceivedLoadAbort) {
                this.loadProgress = 0;
                alert('Load was aborted.');
                this.showDropbox(true);
            }
        });
        this.dwvApp.addEventListener('loaditem', ( /*event*/) => {
            ++nLoadItem;
        });
        this.dwvApp.addEventListener('loaderror', (event) => {
            console.error(event.error);
            ++nReceivedLoadError;
        });
        this.dwvApp.addEventListener('loadabort', ( /*event*/) => {
            ++nReceivedLoadAbort;
        });
        // handle key events
        this.dwvApp.addEventListener('keydown', (event) => {
            this.dwvApp.defaultOnKeydown(event);
        });
        // handle window resize
        window.addEventListener('resize', this.dwvApp.onResize);
        // setup drop box
        this.setupDropbox();
        // possible load from location
        this.dwvApp.loadFromUri(window.location.href);
    }
    /**
     * Get the icon of a tool.
     *
     * @param tool The tool name.
     * @returns The associated icon string.
     */
    getToolIcon = (tool) => {
        let res;
        if (tool === 'Scroll') {
            res = 'menu';
        }
        else if (tool === 'ZoomAndPan') {
            res = 'search';
        }
        else if (tool === 'WindowLevel') {
            res = 'contrast';
        }
        else if (tool === 'Draw') {
            res = 'straighten';
        }
        return res;
    };
    /**
     * Handle a change tool event.
     * @param tool The new tool name.
     */
    onChangeTool = (tool) => {
        if (this.dwvApp) {
            this.selectedTool = tool;
            this.dwvApp.setTool(tool);
            if (tool === 'Draw' &&
                typeof this.tools.Draw.options !== 'undefined') {
                this.onChangeShape(this.tools.Draw.options[0]);
            }
        }
    };
    /**
     * Check if a tool can be run.
     *
     * @param tool The tool name.
     * @returns True if the tool can be run.
     */
    canRunTool = (tool) => {
        let res;
        if (tool === 'Scroll') {
            res = this.dwvApp.canScroll();
        }
        else if (tool === 'WindowLevel') {
            res = this.dwvApp.canWindowLevel();
        }
        else {
            res = true;
        }
        return res;
    };
    /**
     * For toogle button to not get selected.
     *
     * @param event The toogle change.
     */
    onSingleToogleChange = (event) => {
        // unset value -> do not select button
        event.source.buttonToggleGroup.value = '';
    };
    /**
     * Toogle the viewer orientation.
     */
    toggleOrientation = () => {
        if (typeof this.orientation !== 'undefined') {
            if (this.orientation === 'axial') {
                this.orientation = 'coronal';
            }
            else if (this.orientation === 'coronal') {
                this.orientation = 'sagittal';
            }
            else if (this.orientation === 'sagittal') {
                this.orientation = 'axial';
            }
        }
        else {
            // default is most probably axial
            this.orientation = 'coronal';
        }
        // update data view config
        const viewConfig0 = new ViewConfig('layerGroup0');
        viewConfig0.orientation = this.orientation;
        const viewConfigs = { '*': [viewConfig0] };
        this.dwvApp.setDataViewConfigs(viewConfigs);
        // render data
        const dataIds = this.dwvApp.getDataIds();
        for (const dataId of dataIds) {
            this.dwvApp.render(dataId);
        }
    };
    /**
     * Handle a change draw shape event.
     * @param shape The new shape name.
     */
    onChangeShape = (shape) => {
        if (this.dwvApp && this.selectedTool === 'Draw') {
            this.dwvApp.setToolFeatures({ shapeName: shape });
        }
    };
    /**
     * Handle a reset event.
     */
    onReset = () => {
        if (this.dwvApp) {
            this.dwvApp.resetDisplay();
        }
    };
    /**
     * Open the DICOM tags dialog.
     */
    openTagsDialog = () => {
        this.dialog.open(TagsDialogComponent, {
            data: {
                title: 'DICOM Tags',
                value: this.metaData
            }
        });
    };
    // drag and drop [begin] -----------------------------------------------------
    /**
     * Setup the data load drop box: add event listeners and set initial size.
     */
    setupDropbox = () => {
        this.showDropbox(true);
    };
    /**
     * Default drag event handling.
     * @param event The event to handle.
     */
    defaultHandleDragEvent = (event) => {
        // prevent default handling
        event.stopPropagation();
        event.preventDefault();
    };
    /**
     * Handle a drag over.
     * @param event The event to handle.
     */
    onBoxDragOver = (event) => {
        this.defaultHandleDragEvent(event);
        // update box border
        const box = document.getElementById(this.dropboxDivId);
        if (box && box.className.indexOf(this.hoverClassName) === -1) {
            box.className += ' ' + this.hoverClassName;
        }
    };
    /**
     * Handle a drag leave.
     * @param event The event to handle.
     */
    onBoxDragLeave = (event) => {
        this.defaultHandleDragEvent(event);
        // update box border
        const box = document.getElementById(this.dropboxDivId);
        if (box && box.className.indexOf(this.hoverClassName) !== -1) {
            box.className = box.className.replace(' ' + this.hoverClassName, '');
        }
    };
    /**
     * Handle a drop event.
     * @param event The event to handle.
     */
    onDrop = (event) => {
        this.defaultHandleDragEvent(event);
        // load files
        if (event.dataTransfer) {
            const files = Array.from(event.dataTransfer.files);
            this.dwvApp.loadFiles(files);
        }
    };
    /**
     * Handle a an input[type:file] change event.
     * @param event The event to handle.
     */
    onInputFile = (event) => {
        const target = event.target;
        if (target && target.files) {
            const files = Array.from(target.files);
            this.dwvApp.loadFiles(files);
        }
    };
    /**
     * Show/hide the data load drop box.
     * @param show True to show the drop box.
     */
    showDropbox = (show) => {
        const box = document.getElementById(this.dropboxDivId);
        if (!box) {
            return;
        }
        const layerDiv = document.getElementById('layerGroup0');
        if (show) {
            // reset css class
            box.className = this.dropboxClassName + ' ' + this.borderClassName;
            // check content
            if (box.innerHTML === '') {
                const p = document.createElement('p');
                p.appendChild(document.createTextNode('Drag and drop data here or '));
                // input file
                const input = document.createElement('input');
                input.onchange = this.onInputFile;
                input.type = 'file';
                input.multiple = true;
                input.id = 'input-file';
                input.style.display = 'none';
                const label = document.createElement('label');
                label.htmlFor = 'input-file';
                const link = document.createElement('a');
                link.appendChild(document.createTextNode('click here'));
                link.id = 'input-file-link';
                label.appendChild(link);
                p.appendChild(input);
                p.appendChild(label);
                box.appendChild(p);
            }
            // show box
            box.setAttribute('style', 'display:initial');
            // stop layer listening
            if (layerDiv) {
                layerDiv.removeEventListener('dragover', this.defaultHandleDragEvent);
                layerDiv.removeEventListener('dragleave', this.defaultHandleDragEvent);
                layerDiv.removeEventListener('drop', this.onDrop);
            }
            // listen to box events
            box.addEventListener('dragover', this.onBoxDragOver);
            box.addEventListener('dragleave', this.onBoxDragLeave);
            box.addEventListener('drop', this.onDrop);
        }
        else {
            // remove border css class
            box.className = this.dropboxClassName;
            // remove content
            box.innerHTML = '';
            // hide box
            box.setAttribute('style', 'display:none');
            // stop box listening
            box.removeEventListener('dragover', this.onBoxDragOver);
            box.removeEventListener('dragleave', this.onBoxDragLeave);
            box.removeEventListener('drop', this.onDrop);
            // listen to layer events
            if (layerDiv) {
                layerDiv.addEventListener('dragover', this.defaultHandleDragEvent);
                layerDiv.addEventListener('dragleave', this.defaultHandleDragEvent);
                layerDiv.addEventListener('drop', this.onDrop);
            }
        }
    };
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.4", ngImport: i0, type: DwvComponent, deps: [{ token: i1$1.MatDialog }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.4", type: DwvComponent, isStandalone: true, selector: "dwv-angular", inputs: { showLegend: "showLegend" }, ngImport: i0, template: "<div id=\"dwv\">\n  <mat-progress-bar mode=\"determinate\" value=\"{{ loadProgress }}\"></mat-progress-bar>\n  <div class=\"button-row\">\n    <mat-button-toggle-group name=\"tool\" [disabled]=\"!dataLoaded\">\n      <mat-button-toggle value=\"{{ tool }}\" color=\"primary\"\n        *ngFor=\"let tool of toolNames\"\n        title=\"{{ tool }}\"\n        (click)=\"onChangeTool(tool)\"\n        [disabled]=\"!dataLoaded || !canRunTool(tool)\">\n        <mat-icon>{{ getToolIcon(tool) }}</mat-icon>\n      </mat-button-toggle>\n    </mat-button-toggle-group>\n\n    <mat-button-toggle-group name=\"reset\" [disabled]=\"!dataLoaded\"\n      (change)=\"onSingleToogleChange($event)\">\n      <mat-button-toggle color=\"primary\"\n        title=\"Reset\"\n        (click)=\"onReset()\">\n        <mat-icon>refresh</mat-icon>\n      </mat-button-toggle>\n    </mat-button-toggle-group>\n\n    <mat-button-toggle-group name=\"reset\" [disabled]=\"!dataLoaded\"\n      (change)=\"onSingleToogleChange($event)\">\n      <mat-button-toggle color=\"primary\"\n        title=\"Toggle Orientation\"\n        (click)=\"toggleOrientation()\">\n        <mat-icon>cameraswitch</mat-icon>\n      </mat-button-toggle>\n    </mat-button-toggle-group>\n\n    <mat-button-toggle-group name=\"tags\" [disabled]=\"!dataLoaded\"\n      (change)=\"onSingleToogleChange($event)\">\n      <mat-button-toggle color=\"primary\"\n        title=\"Tags\"\n        (click)=\"openTagsDialog()\">\n        <mat-icon>library_books</mat-icon>\n      </mat-button-toggle>\n    </mat-button-toggle-group>\n</div>\n  <div id=\"layerGroup0\" class=\"layerGroup\">\n    <div id=\"dropBox\"></div>\n  </div>\n  <div class=\"legend mat-small\" *ngIf=\"showLegend\">\n    <p>Powered by\n    <a href=\"https://github.com/ivmartel/dwv\">dwv</a>\n    {{ versions.dwv }}\n    and\n    <a href=\"https://github.com/angular/angular\">Angular</a>\n    {{ versions.angular }}\n    </p>\n  </div>\n</div>\n", styles: ["#dwv{height:90%}.legend{text-align:center;font-size:8pt;margin:1em}.layerGroup{position:relative;padding:0;display:flex;justify-content:center;height:90%}.layer{position:absolute;pointer-events:none}.dropBox{margin:auto;text-align:center;vertical-align:middle;width:50%;height:75%}\n"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i2$1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i2$1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "ngmodule", type: MatButtonModule }, { kind: "ngmodule", type: MatButtonToggleModule }, { kind: "directive", type: i3$1.MatButtonToggleGroup, selector: "mat-button-toggle-group", inputs: ["appearance", "name", "vertical", "value", "multiple", "disabled", "disabledInteractive", "hideSingleSelectionIndicator", "hideMultipleSelectionIndicator"], outputs: ["valueChange", "change"], exportAs: ["matButtonToggleGroup"] }, { kind: "component", type: i3$1.MatButtonToggle, selector: "mat-button-toggle", inputs: ["aria-label", "aria-labelledby", "id", "name", "value", "tabIndex", "disableRipple", "appearance", "checked", "disabled", "disabledInteractive"], outputs: ["change"], exportAs: ["matButtonToggle"] }, { kind: "ngmodule", type: MatDialogModule }, { kind: "ngmodule", type: MatIconModule }, { kind: "component", type: i4$1.MatIcon, selector: "mat-icon", inputs: ["color", "inline", "svgIcon", "fontSet", "fontIcon"], exportAs: ["matIcon"] }, { kind: "ngmodule", type: MatProgressBarModule }, { kind: "component", type: i5.MatProgressBar, selector: "mat-progress-bar", inputs: ["color", "value", "bufferValue", "mode"], outputs: ["animationEnd"], exportAs: ["matProgressBar"] }], encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.4", ngImport: i0, type: DwvComponent, decorators: [{
            type: Component,
            args: [{ selector: 'dwv-angular', standalone: true, imports: [
                        CommonModule,
                        MatButtonModule,
                        MatButtonToggleModule,
                        MatDialogModule,
                        MatIconModule,
                        MatProgressBarModule
                    ], encapsulation: ViewEncapsulation.None, template: "<div id=\"dwv\">\n  <mat-progress-bar mode=\"determinate\" value=\"{{ loadProgress }}\"></mat-progress-bar>\n  <div class=\"button-row\">\n    <mat-button-toggle-group name=\"tool\" [disabled]=\"!dataLoaded\">\n      <mat-button-toggle value=\"{{ tool }}\" color=\"primary\"\n        *ngFor=\"let tool of toolNames\"\n        title=\"{{ tool }}\"\n        (click)=\"onChangeTool(tool)\"\n        [disabled]=\"!dataLoaded || !canRunTool(tool)\">\n        <mat-icon>{{ getToolIcon(tool) }}</mat-icon>\n      </mat-button-toggle>\n    </mat-button-toggle-group>\n\n    <mat-button-toggle-group name=\"reset\" [disabled]=\"!dataLoaded\"\n      (change)=\"onSingleToogleChange($event)\">\n      <mat-button-toggle color=\"primary\"\n        title=\"Reset\"\n        (click)=\"onReset()\">\n        <mat-icon>refresh</mat-icon>\n      </mat-button-toggle>\n    </mat-button-toggle-group>\n\n    <mat-button-toggle-group name=\"reset\" [disabled]=\"!dataLoaded\"\n      (change)=\"onSingleToogleChange($event)\">\n      <mat-button-toggle color=\"primary\"\n        title=\"Toggle Orientation\"\n        (click)=\"toggleOrientation()\">\n        <mat-icon>cameraswitch</mat-icon>\n      </mat-button-toggle>\n    </mat-button-toggle-group>\n\n    <mat-button-toggle-group name=\"tags\" [disabled]=\"!dataLoaded\"\n      (change)=\"onSingleToogleChange($event)\">\n      <mat-button-toggle color=\"primary\"\n        title=\"Tags\"\n        (click)=\"openTagsDialog()\">\n        <mat-icon>library_books</mat-icon>\n      </mat-button-toggle>\n    </mat-button-toggle-group>\n</div>\n  <div id=\"layerGroup0\" class=\"layerGroup\">\n    <div id=\"dropBox\"></div>\n  </div>\n  <div class=\"legend mat-small\" *ngIf=\"showLegend\">\n    <p>Powered by\n    <a href=\"https://github.com/ivmartel/dwv\">dwv</a>\n    {{ versions.dwv }}\n    and\n    <a href=\"https://github.com/angular/angular\">Angular</a>\n    {{ versions.angular }}\n    </p>\n  </div>\n</div>\n", styles: ["#dwv{height:90%}.legend{text-align:center;font-size:8pt;margin:1em}.layerGroup{position:relative;padding:0;display:flex;justify-content:center;height:90%}.layer{position:absolute;pointer-events:none}.dropBox{margin:auto;text-align:center;vertical-align:middle;width:50%;height:75%}\n"] }]
        }], ctorParameters: () => [{ type: i1$1.MatDialog }], propDecorators: { showLegend: [{
                type: Input
            }] } });

/*
 * Public API Surface of dwv-angular
 */

/**
 * Generated bundle index. Do not edit.
 */

export { DwvComponent };
//# sourceMappingURL=dwv-angular.mjs.map
