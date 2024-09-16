import { Component, Input, ViewEncapsulation } from '@angular/core';
import { VERSION } from '@angular/core';
import { App, AppOptions, ViewConfig, ToolConfig, decoderScripts, getDwvVersion } from 'dwv';
import { TagsDialogComponent } from './tags-dialog.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import * as i0 from "@angular/core";
import * as i1 from "@angular/material/dialog";
import * as i2 from "@angular/common";
import * as i3 from "@angular/material/button-toggle";
import * as i4 from "@angular/material/icon";
import * as i5 from "@angular/material/progress-bar";
// Image decoders (for web workers)
decoderScripts.jpeg2000 = 'assets/dwv/decoders/pdfjs/decode-jpeg2000.js';
decoderScripts['jpeg-lossless'] = 'assets/dwv/decoders/rii-mango/decode-jpegloss.js';
decoderScripts['jpeg-baseline'] = 'assets/dwv/decoders/pdfjs/decode-jpegbaseline.js';
decoderScripts.rle = 'assets/dwv/decoders/dwv/decode-rle.js';
class DwvEvent {
    dataid;
}
export class DwvComponent {
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.4", ngImport: i0, type: DwvComponent, deps: [{ token: i1.MatDialog }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.4", type: DwvComponent, isStandalone: true, selector: "dwv-angular", inputs: { showLegend: "showLegend" }, ngImport: i0, template: "<div id=\"dwv\">\n  <mat-progress-bar mode=\"determinate\" value=\"{{ loadProgress }}\"></mat-progress-bar>\n  <div class=\"button-row\">\n    <mat-button-toggle-group name=\"tool\" [disabled]=\"!dataLoaded\">\n      <mat-button-toggle value=\"{{ tool }}\" color=\"primary\"\n        *ngFor=\"let tool of toolNames\"\n        title=\"{{ tool }}\"\n        (click)=\"onChangeTool(tool)\"\n        [disabled]=\"!dataLoaded || !canRunTool(tool)\">\n        <mat-icon>{{ getToolIcon(tool) }}</mat-icon>\n      </mat-button-toggle>\n    </mat-button-toggle-group>\n\n    <mat-button-toggle-group name=\"reset\" [disabled]=\"!dataLoaded\"\n      (change)=\"onSingleToogleChange($event)\">\n      <mat-button-toggle color=\"primary\"\n        title=\"Reset\"\n        (click)=\"onReset()\">\n        <mat-icon>refresh</mat-icon>\n      </mat-button-toggle>\n    </mat-button-toggle-group>\n\n    <mat-button-toggle-group name=\"reset\" [disabled]=\"!dataLoaded\"\n      (change)=\"onSingleToogleChange($event)\">\n      <mat-button-toggle color=\"primary\"\n        title=\"Toggle Orientation\"\n        (click)=\"toggleOrientation()\">\n        <mat-icon>cameraswitch</mat-icon>\n      </mat-button-toggle>\n    </mat-button-toggle-group>\n\n    <mat-button-toggle-group name=\"tags\" [disabled]=\"!dataLoaded\"\n      (change)=\"onSingleToogleChange($event)\">\n      <mat-button-toggle color=\"primary\"\n        title=\"Tags\"\n        (click)=\"openTagsDialog()\">\n        <mat-icon>library_books</mat-icon>\n      </mat-button-toggle>\n    </mat-button-toggle-group>\n</div>\n  <div id=\"layerGroup0\" class=\"layerGroup\">\n    <div id=\"dropBox\"></div>\n  </div>\n  <div class=\"legend mat-small\" *ngIf=\"showLegend\">\n    <p>Powered by\n    <a href=\"https://github.com/ivmartel/dwv\">dwv</a>\n    {{ versions.dwv }}\n    and\n    <a href=\"https://github.com/angular/angular\">Angular</a>\n    {{ versions.angular }}\n    </p>\n  </div>\n</div>\n", styles: ["#dwv{height:90%}.legend{text-align:center;font-size:8pt;margin:1em}.layerGroup{position:relative;padding:0;display:flex;justify-content:center;height:90%}.layer{position:absolute;pointer-events:none}.dropBox{margin:auto;text-align:center;vertical-align:middle;width:50%;height:75%}\n"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i2.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "ngmodule", type: MatButtonModule }, { kind: "ngmodule", type: MatButtonToggleModule }, { kind: "directive", type: i3.MatButtonToggleGroup, selector: "mat-button-toggle-group", inputs: ["appearance", "name", "vertical", "value", "multiple", "disabled", "disabledInteractive", "hideSingleSelectionIndicator", "hideMultipleSelectionIndicator"], outputs: ["valueChange", "change"], exportAs: ["matButtonToggleGroup"] }, { kind: "component", type: i3.MatButtonToggle, selector: "mat-button-toggle", inputs: ["aria-label", "aria-labelledby", "id", "name", "value", "tabIndex", "disableRipple", "appearance", "checked", "disabled", "disabledInteractive"], outputs: ["change"], exportAs: ["matButtonToggle"] }, { kind: "ngmodule", type: MatDialogModule }, { kind: "ngmodule", type: MatIconModule }, { kind: "component", type: i4.MatIcon, selector: "mat-icon", inputs: ["color", "inline", "svgIcon", "fontSet", "fontIcon"], exportAs: ["matIcon"] }, { kind: "ngmodule", type: MatProgressBarModule }, { kind: "component", type: i5.MatProgressBar, selector: "mat-progress-bar", inputs: ["color", "value", "bufferValue", "mode"], outputs: ["animationEnd"], exportAs: ["matProgressBar"] }], encapsulation: i0.ViewEncapsulation.None });
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
        }], ctorParameters: () => [{ type: i1.MatDialog }], propDecorators: { showLegend: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHd2LWFuZ3VsYXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvZHd2LWFuZ3VsYXIvc3JjL2xpYi9kd3YtYW5ndWxhci5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi9wcm9qZWN0cy9kd3YtYW5ndWxhci9zcmMvbGliL2R3di1hbmd1bGFyLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFVLGlCQUFpQixFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzVFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDeEMsT0FBTyxFQUNMLEdBQUcsRUFDSCxVQUFVLEVBRVYsVUFBVSxFQUNWLFVBQVUsRUFDVixjQUFjLEVBQ2QsYUFBYSxFQUNkLE1BQU0sS0FBSyxDQUFDO0FBSWIsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFOUQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUMzRCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUN4RSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDM0QsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQ3ZELE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGdDQUFnQyxDQUFDOzs7Ozs7O0FBRXRFLG1DQUFtQztBQUNuQyxjQUFjLENBQUMsUUFBUSxHQUFHLDhDQUE4QyxDQUFDO0FBQ3pFLGNBQWMsQ0FBQyxlQUFlLENBQUMsR0FBRyxrREFBa0QsQ0FBQztBQUNyRixjQUFjLENBQUMsZUFBZSxDQUFDLEdBQUcsa0RBQWtELENBQUM7QUFDckYsY0FBYyxDQUFDLEdBQUcs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QUFDLENBQUM7Z0JBQ3BFLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pELENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQyxDQUFBO3VHQXRYVSxZQUFZOzJGQUFaLFlBQVksNkdDakR6QixtNkRBcURBLG9WRGhCSSxZQUFZLCtQQUNaLGVBQWUsOEJBQ2YscUJBQXFCLHNvQkFDckIsZUFBZSw4QkFDZixhQUFhLG1MQUNiLG9CQUFvQjs7MkZBT1gsWUFBWTtrQkFoQnhCLFNBQVM7K0JBQ0UsYUFBYSxjQUNYLElBQUksV0FDUDt3QkFDUCxZQUFZO3dCQUNaLGVBQWU7d0JBQ2YscUJBQXFCO3dCQUNyQixlQUFlO3dCQUNmLGFBQWE7d0JBQ2Isb0JBQW9CO3FCQUNyQixpQkFHYyxpQkFBaUIsQ0FBQyxJQUFJOzhFQUk1QixVQUFVO3NCQUFsQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBJbnB1dCwgT25Jbml0LCBWaWV3RW5jYXBzdWxhdGlvbiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgVkVSU0lPTiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgQXBwLFxuICBBcHBPcHRpb25zLFxuICBEYXRhRWxlbWVudCxcbiAgVmlld0NvbmZpZyxcbiAgVG9vbENvbmZpZyxcbiAgZGVjb2RlclNjcmlwdHMsXG4gIGdldER3dlZlcnNpb25cbn0gZnJvbSAnZHd2JztcbmltcG9ydCB7IE1hdERpYWxvZyB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL2RpYWxvZyc7XG5pbXBvcnQgeyBNYXRCdXR0b25Ub2dnbGVDaGFuZ2UgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9idXR0b24tdG9nZ2xlJztcblxuaW1wb3J0IHsgVGFnc0RpYWxvZ0NvbXBvbmVudCB9IGZyb20gJy4vdGFncy1kaWFsb2cuY29tcG9uZW50JztcblxuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7IE1hdEJ1dHRvbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL2J1dHRvbic7XG5pbXBvcnQgeyBNYXRCdXR0b25Ub2dnbGVNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9idXR0b24tdG9nZ2xlJztcbmltcG9ydCB7IE1hdERpYWxvZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL2RpYWxvZyc7XG5pbXBvcnQgeyBNYXRJY29uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvaWNvbic7XG5pbXBvcnQgeyBNYXRQcm9ncmVzc0Jhck1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL3Byb2dyZXNzLWJhcic7XG5cbi8vIEltYWdlIGRlY29kZXJzIChmb3Igd2ViIHdvcmtlcnMpXG5kZWNvZGVyU2NyaXB0cy5qcGVnMjAwMCA9ICdhc3NldHMvZHd2L2RlY29kZXJzL3BkZmpzL2RlY29kZS1qcGVnMjAwMC5qcyc7XG5kZWNvZGVyU2NyaXB0c1snanBlZy1sb3NzbGVzcyddID0gJ2Fzc2V0cy9kd3YvZGVjb2RlcnMvcmlpLW1hbmdvL2RlY29kZS1qcGVnbG9zcy5qcyc7XG5kZWNvZGVyU2NyaXB0c1snanBlZy1iYXNlbGluZSddID0gJ2Fzc2V0cy9kd3YvZGVjb2RlcnMvcGRmanMvZGVjb2RlLWpwZWdiYXNlbGluZS5qcyc7XG5kZWNvZGVyU2NyaXB0cy5ybGUgPSAnYXNzZXRzL2R3di9kZWNvZGVycy9kd3YvZGVjb2RlLXJsZS5qcyc7XG5cbmNsYXNzIER3dkV2ZW50IHtcbiAgZGF0YWlkITogc3RyaW5nO1xufVxuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdkd3YtYW5ndWxhcicsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIGltcG9ydHM6IFtcbiAgICBDb21tb25Nb2R1bGUsXG4gICAgTWF0QnV0dG9uTW9kdWxlLFxuICAgIE1hdEJ1dHRvblRvZ2dsZU1vZHVsZSxcbiAgICBNYXREaWFsb2dNb2R1bGUsXG4gICAgTWF0SWNvbk1vZHVsZSxcbiAgICBNYXRQcm9ncmVzc0Jhck1vZHVsZVxuICBdLFxuICB0ZW1wbGF0ZVVybDogJy4vZHd2LWFuZ3VsYXIuY29tcG9uZW50Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9kd3YtYW5ndWxhci5jb21wb25lbnQuc2NzcyddLFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lXG59KVxuXG5leHBvcnQgY2xhc3MgRHd2Q29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgQElucHV0KCkgc2hvd0xlZ2VuZCA9IGZhbHNlO1xuICBwdWJsaWMgdmVyc2lvbnMgPSB7XG4gICAgZHd2OiBnZXREd3ZWZXJzaW9uKCksXG4gICAgYW5ndWxhcjogVkVSU0lPTi5mdWxsXG4gIH07XG4gIHB1YmxpYyB0b29scyA9IHtcbiAgICAgIFNjcm9sbDogbmV3IFRvb2xDb25maWcoKSxcbiAgICAgIFpvb21BbmRQYW46IG5ldyBUb29sQ29uZmlnKCksXG4gICAgICBXaW5kb3dMZXZlbDogbmV3IFRvb2xDb25maWcoKSxcbiAgICAgIERyYXc6IG5ldyBUb29sQ29uZmlnKFsnUnVsZXInXSksXG4gIH07XG4gIHB1YmxpYyB0b29sTmFtZXM6IHN0cmluZ1tdID0gT2JqZWN0LmtleXModGhpcy50b29scyk7XG4gIHB1YmxpYyBzZWxlY3RlZFRvb2wgPSAnU2VsZWN0IFRvb2wnO1xuICBwdWJsaWMgbG9hZFByb2dyZXNzID0gMDtcbiAgcHVibGljIGRhdGFMb2FkZWQgPSBmYWxzZTtcblxuICBwcml2YXRlIGR3dkFwcCE6IEFwcDtcbiAgcHJpdmF0ZSBtZXRhRGF0YSE6IFJlY29yZDxzdHJpbmcsIERhdGFFbGVtZW50PjtcblxuICBwcml2YXRlIG9yaWVudGF0aW9uITogc3RyaW5nO1xuXG4gIC8vIGRyb3AgYm94IGNsYXNzIG5hbWVcbiAgcHJpdmF0ZSBkcm9wYm94RGl2SWQgPSAnZHJvcEJveCc7XG4gIHByaXZhdGUgZHJvcGJveENsYXNzTmFtZSA9ICdkcm9wQm94JztcbiAgcHJpdmF0ZSBib3JkZXJDbGFzc05hbWUgPSAnZHJvcEJveEJvcmRlcic7XG4gIHByaXZhdGUgaG92ZXJDbGFzc05hbWUgPSAnaG92ZXInO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBkaWFsb2c6IE1hdERpYWxvZykge31cblxuICBuZ09uSW5pdCgpIHtcbiAgICAvLyBjcmVhdGUgYXBwXG4gICAgdGhpcy5kd3ZBcHAgPSBuZXcgQXBwKCk7XG4gICAgLy8gaW5pdGlhbGlzZSBhcHBcbiAgICBjb25zdCB2aWV3Q29uZmlnMCA9IG5ldyBWaWV3Q29uZmlnKCdsYXllckdyb3VwMCcpO1xuICAgIGNvbnN0IHZpZXdDb25maWdzID0geycqJzogW3ZpZXdDb25maWcwXX07XG4gICAgY29uc3Qgb3B0aW9ucyA9IG5ldyBBcHBPcHRpb25zKHZpZXdDb25maWdzKTtcbiAgICBvcHRpb25zLnRvb2xzID0gdGhpcy50b29scztcbiAgICB0aGlzLmR3dkFwcC5pbml0KG9wdGlvbnMpO1xuICAgIC8vIGhhbmRsZSBsb2FkIGV2ZW50c1xuICAgIGxldCBuTG9hZEl0ZW0gPSAwO1xuICAgIGxldCBuUmVjZWl2ZWRMb2FkRXJyb3IgPSAwO1xuICAgIGxldCBuUmVjZWl2ZWRMb2FkQWJvcnQgPSAwO1xuICAgIGxldCBpc0ZpcnN0UmVuZGVyID0gZmFsc2U7XG4gICAgdGhpcy5kd3ZBcHAuYWRkRXZlbnRMaXN0ZW5lcignbG9hZHN0YXJ0JywgKC8qZXZlbnQqLykgPT4ge1xuICAgICAgLy8gcmVzZXQgZmxhZ3NcbiAgICAgIHRoaXMuZGF0YUxvYWRlZCA9IGZhbHNlO1xuICAgICAgbkxvYWRJdGVtID0gMDtcbiAgICAgIG5SZWNlaXZlZExvYWRFcnJvciA9IDA7XG4gICAgICBuUmVjZWl2ZWRMb2FkQWJvcnQgPSAwO1xuICAgICAgaXNGaXJzdFJlbmRlciA9IHRydWU7XG4gICAgICAvLyBoaWRlIGRyb3AgYm94XG4gICAgICB0aGlzLnNob3dEcm9wYm94KGZhbHNlKTtcbiAgICB9KTtcbiAgICB0aGlzLmR3dkFwcC5hZGRFdmVudExpc3RlbmVyKCdsb2FkcHJvZ3Jlc3MnLCAoZXZlbnQ6IFByb2dyZXNzRXZlbnQpID0+IHtcbiAgICAgIHRoaXMubG9hZFByb2dyZXNzID0gZXZlbnQubG9hZGVkO1xuICAgIH0pO1xuICAgIHRoaXMuZHd2QXBwLmFkZEV2ZW50TGlzdGVuZXIoJ3JlbmRlcmVuZCcsICgvKmV2ZW50Ki8pID0+IHtcbiAgICAgIGlmIChpc0ZpcnN0UmVuZGVyKSB7XG4gICAgICAgIGlzRmlyc3RSZW5kZXIgPSBmYWxzZTtcbiAgICAgICAgLy8gYXZhaWxhYmxlIHRvb2xzXG4gICAgICAgIGxldCBzZWxlY3RlZFRvb2wgPSAnWm9vbUFuZFBhbic7XG4gICAgICAgIGlmICh0aGlzLmR3dkFwcC5jYW5TY3JvbGwoKSkge1xuICAgICAgICAgIHNlbGVjdGVkVG9vbCA9ICdTY3JvbGwnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub25DaGFuZ2VUb29sKHNlbGVjdGVkVG9vbCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5kd3ZBcHAuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIChldmVudDogRHd2RXZlbnQpID0+IHtcbiAgICAgIC8vIHNldCBkaWNvbSB0YWdzXG4gICAgICB0aGlzLm1ldGFEYXRhID0gdGhpcy5kd3ZBcHAuZ2V0TWV0YURhdGEoZXZlbnQuZGF0YWlkKSBhcyBSZWNvcmQ8c3RyaW5nLCBEYXRhRWxlbWVudD47XG4gICAgICAvLyBzZXQgZGF0YSBsb2FkZWQgZmxhZ1xuICAgICAgdGhpcy5kYXRhTG9hZGVkID0gdHJ1ZTtcbiAgICB9KTtcbiAgICB0aGlzLmR3dkFwcC5hZGRFdmVudExpc3RlbmVyKCdsb2FkZW5kJywgKC8qZXZlbnQqLykgPT4ge1xuICAgICAgaWYgKG5SZWNlaXZlZExvYWRFcnJvcikge1xuICAgICAgICB0aGlzLmxvYWRQcm9ncmVzcyA9IDA7XG4gICAgICAgIGFsZXJ0KCdSZWNlaXZlZCBlcnJvcnMgZHVyaW5nIGxvYWQuIENoZWNrIGxvZyBmb3IgZGV0YWlscy4nKTtcbiAgICAgICAgLy8gc2hvdyBkcm9wIGJveCBpZiBub3RoaW5nIGhhcyBiZWVuIGxvYWRlZFxuICAgICAgICBpZiAoIW5Mb2FkSXRlbSkge1xuICAgICAgICAgIHRoaXMuc2hvd0Ryb3Bib3godHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChuUmVjZWl2ZWRMb2FkQWJvcnQpIHtcbiAgICAgICAgdGhpcy5sb2FkUHJvZ3Jlc3MgPSAwO1xuICAgICAgICBhbGVydCgnTG9hZCB3YXMgYWJvcnRlZC4nKTtcbiAgICAgICAgdGhpcy5zaG93RHJvcGJveCh0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmR3dkFwcC5hZGRFdmVudExpc3RlbmVyKCdsb2FkaXRlbScsICgvKmV2ZW50Ki8pID0+IHtcbiAgICAgICsrbkxvYWRJdGVtO1xuICAgIH0pO1xuICAgIHRoaXMuZHd2QXBwLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWRlcnJvcicsIChldmVudDogRXJyb3JFdmVudCkgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihldmVudC5lcnJvcik7XG4gICAgICArK25SZWNlaXZlZExvYWRFcnJvcjtcbiAgICB9KTtcbiAgICB0aGlzLmR3dkFwcC5hZGRFdmVudExpc3RlbmVyKCdsb2FkYWJvcnQnLCAoLypldmVudCovKSA9PiB7XG4gICAgICArK25SZWNlaXZlZExvYWRBYm9ydDtcbiAgICB9KTtcblxuICAgIC8vIGhhbmRsZSBrZXkgZXZlbnRzXG4gICAgdGhpcy5kd3ZBcHAuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgICB0aGlzLmR3dkFwcC5kZWZhdWx0T25LZXlkb3duKGV2ZW50KTtcbiAgICB9KTtcbiAgICAvLyBoYW5kbGUgd2luZG93IHJlc2l6ZVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLmR3dkFwcC5vblJlc2l6ZSk7XG5cbiAgICAvLyBzZXR1cCBkcm9wIGJveFxuICAgIHRoaXMuc2V0dXBEcm9wYm94KCk7XG5cbiAgICAvLyBwb3NzaWJsZSBsb2FkIGZyb20gbG9jYXRpb25cbiAgICB0aGlzLmR3dkFwcC5sb2FkRnJvbVVyaSh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBpY29uIG9mIGEgdG9vbC5cbiAgICpcbiAgICogQHBhcmFtIHRvb2wgVGhlIHRvb2wgbmFtZS5cbiAgICogQHJldHVybnMgVGhlIGFzc29jaWF0ZWQgaWNvbiBzdHJpbmcuXG4gICAqL1xuICBnZXRUb29sSWNvbiA9ICh0b29sOiBzdHJpbmcpID0+IHtcbiAgICBsZXQgcmVzITogc3RyaW5nO1xuICAgIGlmICh0b29sID09PSAnU2Nyb2xsJykge1xuICAgICAgcmVzID0gJ21lbnUnO1xuICAgIH0gZWxzZSBpZiAodG9vbCA9PT0gJ1pvb21BbmRQYW4nKSB7XG4gICAgICByZXMgPSAnc2VhcmNoJztcbiAgICB9IGVsc2UgaWYgKHRvb2wgPT09ICdXaW5kb3dMZXZlbCcpIHtcbiAgICAgIHJlcyA9ICdjb250cmFzdCc7XG4gICAgfSBlbHNlIGlmICh0b29sID09PSAnRHJhdycpIHtcbiAgICAgIHJlcyA9ICdzdHJhaWdodGVuJztcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYSBjaGFuZ2UgdG9vbCBldmVudC5cbiAgICogQHBhcmFtIHRvb2wgVGhlIG5ldyB0b29sIG5hbWUuXG4gICAqL1xuICBvbkNoYW5nZVRvb2wgPSAodG9vbDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKCB0aGlzLmR3dkFwcCApIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRUb29sID0gdG9vbDtcbiAgICAgIHRoaXMuZHd2QXBwLnNldFRvb2wodG9vbCk7XG4gICAgICBpZiAodG9vbCA9PT0gJ0RyYXcnICYmXG4gICAgICAgIHR5cGVvZiB0aGlzLnRvb2xzLkRyYXcub3B0aW9ucyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5vbkNoYW5nZVNoYXBlKHRoaXMudG9vbHMuRHJhdy5vcHRpb25zWzBdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSB0b29sIGNhbiBiZSBydW4uXG4gICAqXG4gICAqIEBwYXJhbSB0b29sIFRoZSB0b29sIG5hbWUuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHRvb2wgY2FuIGJlIHJ1bi5cbiAgICovXG4gIGNhblJ1blRvb2wgPSAodG9vbDogc3RyaW5nKSA9PiB7XG4gICAgbGV0IHJlczogYm9vbGVhbjtcbiAgICBpZiAodG9vbCA9PT0gJ1Njcm9sbCcpIHtcbiAgICAgIHJlcyA9IHRoaXMuZHd2QXBwLmNhblNjcm9sbCgpO1xuICAgIH0gZWxzZSBpZiAodG9vbCA9PT0gJ1dpbmRvd0xldmVsJykge1xuICAgICAgcmVzID0gdGhpcy5kd3ZBcHAuY2FuV2luZG93TGV2ZWwoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3IgdG9vZ2xlIGJ1dHRvbiB0byBub3QgZ2V0IHNlbGVjdGVkLlxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIHRvb2dsZSBjaGFuZ2UuXG4gICAqL1xuICBvblNpbmdsZVRvb2dsZUNoYW5nZSA9IChldmVudDogTWF0QnV0dG9uVG9nZ2xlQ2hhbmdlKSA9PiB7XG4gICAgLy8gdW5zZXQgdmFsdWUgLT4gZG8gbm90IHNlbGVjdCBidXR0b25cbiAgICBldmVudC5zb3VyY2UuYnV0dG9uVG9nZ2xlR3JvdXAudmFsdWUgPSAnJztcbiAgfVxuXG4gIC8qKlxuICAgKiBUb29nbGUgdGhlIHZpZXdlciBvcmllbnRhdGlvbi5cbiAgICovXG4gIHRvZ2dsZU9yaWVudGF0aW9uID0gKCkgPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5vcmllbnRhdGlvbiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGlmICh0aGlzLm9yaWVudGF0aW9uID09PSAnYXhpYWwnKSB7XG4gICAgICAgIHRoaXMub3JpZW50YXRpb24gPSAnY29yb25hbCc7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMub3JpZW50YXRpb24gPT09ICdjb3JvbmFsJykge1xuICAgICAgICB0aGlzLm9yaWVudGF0aW9uID0gJ3NhZ2l0dGFsJztcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5vcmllbnRhdGlvbiA9PT0gJ3NhZ2l0dGFsJykge1xuICAgICAgICB0aGlzLm9yaWVudGF0aW9uID0gJ2F4aWFsJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZGVmYXVsdCBpcyBtb3N0IHByb2JhYmx5IGF4aWFsXG4gICAgICB0aGlzLm9yaWVudGF0aW9uID0gJ2Nvcm9uYWwnO1xuICAgIH1cbiAgICAvLyB1cGRhdGUgZGF0YSB2aWV3IGNvbmZpZ1xuICAgIGNvbnN0IHZpZXdDb25maWcwID0gbmV3IFZpZXdDb25maWcoJ2xheWVyR3JvdXAwJyk7XG4gICAgdmlld0NvbmZpZzAub3JpZW50YXRpb24gPSB0aGlzLm9yaWVudGF0aW9uO1xuICAgIGNvbnN0IHZpZXdDb25maWdzID0geycqJzogW3ZpZXdDb25maWcwXX07XG4gICAgdGhpcy5kd3ZBcHAuc2V0RGF0YVZpZXdDb25maWdzKHZpZXdDb25maWdzKTtcbiAgICAvLyByZW5kZXIgZGF0YVxuICAgIGNvbnN0IGRhdGFJZHMgPSB0aGlzLmR3dkFwcC5nZXREYXRhSWRzKCk7XG4gICAgZm9yIChjb25zdCBkYXRhSWQgb2YgZGF0YUlkcykge1xuICAgICAgdGhpcy5kd3ZBcHAucmVuZGVyKGRhdGFJZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBhIGNoYW5nZSBkcmF3IHNoYXBlIGV2ZW50LlxuICAgKiBAcGFyYW0gc2hhcGUgVGhlIG5ldyBzaGFwZSBuYW1lLlxuICAgKi9cbiAgcHJpdmF0ZSBvbkNoYW5nZVNoYXBlID0gKHNoYXBlOiBzdHJpbmcpID0+IHtcbiAgICBpZiAoIHRoaXMuZHd2QXBwICYmIHRoaXMuc2VsZWN0ZWRUb29sID09PSAnRHJhdycpIHtcbiAgICAgIHRoaXMuZHd2QXBwLnNldFRvb2xGZWF0dXJlcyh7c2hhcGVOYW1lOiBzaGFwZX0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYSByZXNldCBldmVudC5cbiAgICovXG4gIG9uUmVzZXQgPSAoKSA9PiB7XG4gICAgaWYgKCB0aGlzLmR3dkFwcCApIHtcbiAgICAgIHRoaXMuZHd2QXBwLnJlc2V0RGlzcGxheSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuIHRoZSBESUNPTSB0YWdzIGRpYWxvZy5cbiAgICovXG4gIG9wZW5UYWdzRGlhbG9nID0gKCkgPT4ge1xuICAgIHRoaXMuZGlhbG9nLm9wZW4oVGFnc0RpYWxvZ0NvbXBvbmVudCxcbiAgICAgIHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIHRpdGxlOiAnRElDT00gVGFncycsXG4gICAgICAgICAgdmFsdWU6IHRoaXMubWV0YURhdGFcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH1cblxuICAvLyBkcmFnIGFuZCBkcm9wIFtiZWdpbl0gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogU2V0dXAgdGhlIGRhdGEgbG9hZCBkcm9wIGJveDogYWRkIGV2ZW50IGxpc3RlbmVycyBhbmQgc2V0IGluaXRpYWwgc2l6ZS5cbiAgICovXG4gIHByaXZhdGUgc2V0dXBEcm9wYm94ID0gKCkgPT4ge1xuICAgIHRoaXMuc2hvd0Ryb3Bib3godHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVmYXVsdCBkcmFnIGV2ZW50IGhhbmRsaW5nLlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGV2ZW50IHRvIGhhbmRsZS5cbiAgICovXG4gIHByaXZhdGUgZGVmYXVsdEhhbmRsZURyYWdFdmVudCA9IChldmVudDogRHJhZ0V2ZW50KSA9PiB7XG4gICAgLy8gcHJldmVudCBkZWZhdWx0IGhhbmRsaW5nXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYSBkcmFnIG92ZXIuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZXZlbnQgdG8gaGFuZGxlLlxuICAgKi9cbiAgcHJpdmF0ZSBvbkJveERyYWdPdmVyID0gKGV2ZW50OiBEcmFnRXZlbnQpID0+IHtcbiAgICB0aGlzLmRlZmF1bHRIYW5kbGVEcmFnRXZlbnQoZXZlbnQpO1xuICAgIC8vIHVwZGF0ZSBib3ggYm9yZGVyXG4gICAgY29uc3QgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5kcm9wYm94RGl2SWQpO1xuICAgIGlmIChib3ggJiYgYm94LmNsYXNzTmFtZS5pbmRleE9mKHRoaXMuaG92ZXJDbGFzc05hbWUpID09PSAtMSkge1xuICAgICAgICBib3guY2xhc3NOYW1lICs9ICcgJyArIHRoaXMuaG92ZXJDbGFzc05hbWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBhIGRyYWcgbGVhdmUuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZXZlbnQgdG8gaGFuZGxlLlxuICAgKi9cbiAgcHJpdmF0ZSBvbkJveERyYWdMZWF2ZSA9IChldmVudDogRHJhZ0V2ZW50KSA9PiB7XG4gICAgdGhpcy5kZWZhdWx0SGFuZGxlRHJhZ0V2ZW50KGV2ZW50KTtcbiAgICAvLyB1cGRhdGUgYm94IGJvcmRlclxuICAgIGNvbnN0IGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuZHJvcGJveERpdklkKTtcbiAgICBpZiAoYm94ICYmIGJveC5jbGFzc05hbWUuaW5kZXhPZih0aGlzLmhvdmVyQ2xhc3NOYW1lKSAhPT0gLTEpIHtcbiAgICAgICAgYm94LmNsYXNzTmFtZSA9IGJveC5jbGFzc05hbWUucmVwbGFjZSgnICcgKyB0aGlzLmhvdmVyQ2xhc3NOYW1lLCAnJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBhIGRyb3AgZXZlbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZXZlbnQgdG8gaGFuZGxlLlxuICAgKi9cbiAgcHJpdmF0ZSBvbkRyb3AgPSAoZXZlbnQ6IERyYWdFdmVudCkgPT4ge1xuICAgIHRoaXMuZGVmYXVsdEhhbmRsZURyYWdFdmVudChldmVudCk7XG4gICAgLy8gbG9hZCBmaWxlc1xuICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIHtcbiAgICAgIGNvbnN0IGZpbGVzID0gQXJyYXkuZnJvbShldmVudC5kYXRhVHJhbnNmZXIuZmlsZXMpO1xuICAgICAgdGhpcy5kd3ZBcHAubG9hZEZpbGVzKGZpbGVzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGEgYW4gaW5wdXRbdHlwZTpmaWxlXSBjaGFuZ2UgZXZlbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZXZlbnQgdG8gaGFuZGxlLlxuICAgKi9cbiAgcHJpdmF0ZSBvbklucHV0RmlsZSA9IChldmVudDogRXZlbnQpID0+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAodGFyZ2V0ICYmIHRhcmdldC5maWxlcykge1xuICAgICAgY29uc3QgZmlsZXMgPSBBcnJheS5mcm9tKHRhcmdldC5maWxlcyk7XG4gICAgICB0aGlzLmR3dkFwcC5sb2FkRmlsZXMoZmlsZXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTaG93L2hpZGUgdGhlIGRhdGEgbG9hZCBkcm9wIGJveC5cbiAgICogQHBhcmFtIHNob3cgVHJ1ZSB0byBzaG93IHRoZSBkcm9wIGJveC5cbiAgICovXG4gIHByaXZhdGUgc2hvd0Ryb3Bib3ggPSAoc2hvdzogYm9vbGVhbikgPT4ge1xuICAgIGNvbnN0IGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuZHJvcGJveERpdklkKTtcbiAgICBpZiAoIWJveCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBsYXllckRpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsYXllckdyb3VwMCcpO1xuXG4gICAgaWYgKHNob3cpIHtcbiAgICAgIC8vIHJlc2V0IGNzcyBjbGFzc1xuICAgICAgYm94LmNsYXNzTmFtZSA9IHRoaXMuZHJvcGJveENsYXNzTmFtZSArICcgJyArIHRoaXMuYm9yZGVyQ2xhc3NOYW1lO1xuICAgICAgLy8gY2hlY2sgY29udGVudFxuICAgICAgaWYgKGJveC5pbm5lckhUTUwgPT09ICcnKSB7XG4gICAgICAgIGNvbnN0IHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gICAgICAgIHAuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJ0RyYWcgYW5kIGRyb3AgZGF0YSBoZXJlIG9yICcpKTtcbiAgICAgICAgLy8gaW5wdXQgZmlsZVxuICAgICAgICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIGlucHV0Lm9uY2hhbmdlID0gdGhpcy5vbklucHV0RmlsZTtcbiAgICAgICAgaW5wdXQudHlwZSA9ICdmaWxlJztcbiAgICAgICAgaW5wdXQubXVsdGlwbGUgPSB0cnVlO1xuICAgICAgICBpbnB1dC5pZCA9ICdpbnB1dC1maWxlJztcbiAgICAgICAgaW5wdXQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgICAgICBsYWJlbC5odG1sRm9yID0gJ2lucHV0LWZpbGUnO1xuICAgICAgICBjb25zdCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBsaW5rLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCdjbGljayBoZXJlJykpO1xuICAgICAgICBsaW5rLmlkID0gJ2lucHV0LWZpbGUtbGluayc7XG4gICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKGxpbmspO1xuICAgICAgICBwLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgcC5hcHBlbmRDaGlsZChsYWJlbCk7XG5cbiAgICAgICAgYm94LmFwcGVuZENoaWxkKHApO1xuICAgICAgfVxuICAgICAgLy8gc2hvdyBib3hcbiAgICAgIGJveC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6aW5pdGlhbCcpO1xuICAgICAgLy8gc3RvcCBsYXllciBsaXN0ZW5pbmdcbiAgICAgIGlmIChsYXllckRpdikge1xuICAgICAgICBsYXllckRpdi5yZW1vdmVFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHRoaXMuZGVmYXVsdEhhbmRsZURyYWdFdmVudCk7XG4gICAgICAgIGxheWVyRGl2LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIHRoaXMuZGVmYXVsdEhhbmRsZURyYWdFdmVudCk7XG4gICAgICAgIGxheWVyRGl2LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLm9uRHJvcCk7XG4gICAgICB9XG4gICAgICAvLyBsaXN0ZW4gdG8gYm94IGV2ZW50c1xuICAgICAgYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5vbkJveERyYWdPdmVyKTtcbiAgICAgIGJveC5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCB0aGlzLm9uQm94RHJhZ0xlYXZlKTtcbiAgICAgIGJveC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5vbkRyb3ApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyByZW1vdmUgYm9yZGVyIGNzcyBjbGFzc1xuICAgICAgYm94LmNsYXNzTmFtZSA9IHRoaXMuZHJvcGJveENsYXNzTmFtZTtcbiAgICAgIC8vIHJlbW92ZSBjb250ZW50XG4gICAgICBib3guaW5uZXJIVE1MID0gJyc7XG4gICAgICAvLyBoaWRlIGJveFxuICAgICAgYm94LnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTpub25lJyk7XG4gICAgICAvLyBzdG9wIGJveCBsaXN0ZW5pbmdcbiAgICAgIGJveC5yZW1vdmVFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHRoaXMub25Cb3hEcmFnT3Zlcik7XG4gICAgICBib3gucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJhZ2xlYXZlJywgdGhpcy5vbkJveERyYWdMZWF2ZSk7XG4gICAgICBib3gucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJvcCcsIHRoaXMub25Ecm9wKTtcbiAgICAgIC8vIGxpc3RlbiB0byBsYXllciBldmVudHNcbiAgICAgIGlmIChsYXllckRpdikge1xuICAgICAgICBsYXllckRpdi5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHRoaXMuZGVmYXVsdEhhbmRsZURyYWdFdmVudCk7XG4gICAgICAgIGxheWVyRGl2LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIHRoaXMuZGVmYXVsdEhhbmRsZURyYWdFdmVudCk7XG4gICAgICAgIGxheWVyRGl2LmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLm9uRHJvcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gZHJhZyBhbmQgZHJvcCBbZW5kXSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbn1cbiIsIjxkaXYgaWQ9XCJkd3ZcIj5cbiAgPG1hdC1wcm9ncmVzcy1iYXIgbW9kZT1cImRldGVybWluYXRlXCIgdmFsdWU9XCJ7eyBsb2FkUHJvZ3Jlc3MgfX1cIj48L21hdC1wcm9ncmVzcy1iYXI+XG4gIDxkaXYgY2xhc3M9XCJidXR0b24tcm93XCI+XG4gICAgPG1hdC1idXR0b24tdG9nZ2xlLWdyb3VwIG5hbWU9XCJ0b29sXCIgW2Rpc2FibGVkXT1cIiFkYXRhTG9hZGVkXCI+XG4gICAgICA8bWF0LWJ1dHRvbi10b2dnbGUgdmFsdWU9XCJ7eyB0b29sIH19XCIgY29sb3I9XCJwcmltYXJ5XCJcbiAgICAgICAgKm5nRm9yPVwibGV0IHRvb2wgb2YgdG9vbE5hbWVzXCJcbiAgICAgICAgdGl0bGU9XCJ7eyB0b29sIH19XCJcbiAgICAgICAgKGNsaWNrKT1cIm9uQ2hhbmdlVG9vbCh0b29sKVwiXG4gICAgICAgIFtkaXNhYmxlZF09XCIhZGF0YUxvYWRlZCB8fCAhY2FuUnVuVG9vbCh0b29sKVwiPlxuICAgICAgICA8bWF0LWljb24+e3sgZ2V0VG9vbEljb24odG9vbCkgfX08L21hdC1pY29uPlxuICAgICAgPC9tYXQtYnV0dG9uLXRvZ2dsZT5cbiAgICA8L21hdC1idXR0b24tdG9nZ2xlLWdyb3VwPlxuXG4gICAgPG1hdC1idXR0b24tdG9nZ2xlLWdyb3VwIG5hbWU9XCJyZXNldFwiIFtkaXNhYmxlZF09XCIhZGF0YUxvYWRlZFwiXG4gICAgICAoY2hhbmdlKT1cIm9uU2luZ2xlVG9vZ2xlQ2hhbmdlKCRldmVudClcIj5cbiAgICAgIDxtYXQtYnV0dG9uLXRvZ2dsZSBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICB0aXRsZT1cIlJlc2V0XCJcbiAgICAgICAgKGNsaWNrKT1cIm9uUmVzZXQoKVwiPlxuICAgICAgICA8bWF0LWljb24+cmVmcmVzaDwvbWF0LWljb24+XG4gICAgICA8L21hdC1idXR0b24tdG9nZ2xlPlxuICAgIDwvbWF0LWJ1dHRvbi10b2dnbGUtZ3JvdXA+XG5cbiAgICA8bWF0LWJ1dHRvbi10b2dnbGUtZ3JvdXAgbmFtZT1cInJlc2V0XCIgW2Rpc2FibGVkXT1cIiFkYXRhTG9hZGVkXCJcbiAgICAgIChjaGFuZ2UpPVwib25TaW5nbGVUb29nbGVDaGFuZ2UoJGV2ZW50KVwiPlxuICAgICAgPG1hdC1idXR0b24tdG9nZ2xlIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgIHRpdGxlPVwiVG9nZ2xlIE9yaWVudGF0aW9uXCJcbiAgICAgICAgKGNsaWNrKT1cInRvZ2dsZU9yaWVudGF0aW9uKClcIj5cbiAgICAgICAgPG1hdC1pY29uPmNhbWVyYXN3aXRjaDwvbWF0LWljb24+XG4gICAgICA8L21hdC1idXR0b24tdG9nZ2xlPlxuICAgIDwvbWF0LWJ1dHRvbi10b2dnbGUtZ3JvdXA+XG5cbiAgICA8bWF0LWJ1dHRvbi10b2dnbGUtZ3JvdXAgbmFtZT1cInRhZ3NcIiBbZGlzYWJsZWRdPVwiIWRhdGFMb2FkZWRcIlxuICAgICAgKGNoYW5nZSk9XCJvblNpbmdsZVRvb2dsZUNoYW5nZSgkZXZlbnQpXCI+XG4gICAgICA8bWF0LWJ1dHRvbi10b2dnbGUgY29sb3I9XCJwcmltYXJ5XCJcbiAgICAgICAgdGl0bGU9XCJUYWdzXCJcbiAgICAgICAgKGNsaWNrKT1cIm9wZW5UYWdzRGlhbG9nKClcIj5cbiAgICAgICAgPG1hdC1pY29uPmxpYnJhcnlfYm9va3M8L21hdC1pY29uPlxuICAgICAgPC9tYXQtYnV0dG9uLXRvZ2dsZT5cbiAgICA8L21hdC1idXR0b24tdG9nZ2xlLWdyb3VwPlxuPC9kaXY+XG4gIDxkaXYgaWQ9XCJsYXllckdyb3VwMFwiIGNsYXNzPVwibGF5ZXJHcm91cFwiPlxuICAgIDxkaXYgaWQ9XCJkcm9wQm94XCI+PC9kaXY+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwibGVnZW5kIG1hdC1zbWFsbFwiICpuZ0lmPVwic2hvd0xlZ2VuZFwiPlxuICAgIDxwPlBvd2VyZWQgYnlcbiAgICA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL2l2bWFydGVsL2R3dlwiPmR3djwvYT5cbiAgICB7eyB2ZXJzaW9ucy5kd3YgfX1cbiAgICBhbmRcbiAgICA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhclwiPkFuZ3VsYXI8L2E+XG4gICAge3sgdmVyc2lvbnMuYW5ndWxhciB9fVxuICAgIDwvcD5cbiAgPC9kaXY+XG48L2Rpdj5cbiJdfQ==