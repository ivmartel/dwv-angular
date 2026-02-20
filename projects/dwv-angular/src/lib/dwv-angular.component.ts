import {
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { VERSION } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  App,
  AppOptions,
  DataElement,
  ViewConfig,
  ToolConfig,
  getDwvVersion
} from 'dwv';
import { overlayConfig } from './overlays';
import { MatDialog } from '@angular/material/dialog';

import { TagsDialogComponent } from './tags-dialog.component';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

class DwvEvent {
  dataid!: string;
  value!: (number|string)[];
}

/**
 * DWV component: display DICOM data using DWV (DICOM Web Viewer). Default
 * (no arguments) shows a dropbox to manually load dicom data from the
 * local system. The arguments are
 * - uri: string, an input URI to load the data from
 * - urls: string[], a list of urls to load the data from
 * - showLegend: boolean, defaults to false
 *
 * The dropbox is shown if no uri nor urls are provided.
 *
 * ref: {@link https://github.com/ivmartel/dwv}.
 *
 * Usage example:
 * @example
 * <dwv-angular [showLegend]="true"></dwv-angular>
 * @example
 * <dwv-angular
 *   [uri]="https://www.demo.com/index.html?input=file.dcm">
 * </dwv-angular>
 * @example
 * <dwv-angular
 *   [urls]="[
 *     'https://www.demo.com/file0.dcm',
 *     'https://www.demo.com/file1.dcm'
 *   ]">
 * </dwv-angular>
 */

@Component({
  selector: 'dwv-angular',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule
],
  templateUrl: './dwv-angular.component.html',
  styleUrls: ['./dwv-angular.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class DwvComponent implements OnInit {
  dialog = inject(MatDialog);
  changeDetectorRef = inject(ChangeDetectorRef);

  @Input() showLegend = false;
  @Input() uri!: string;
  @Input() urls!: string[];

  public versions = {
    dwv: getDwvVersion(),
    angular: VERSION.full
  };
  public shapeNames = [
    'Ruler',
    'Arrow',
    'Rectangle',
    'Circle',
    'Ellipse',
    'Protractor',
    'Roi'
  ];
  public tools = {
    Scroll: new ToolConfig(),
    ZoomAndPan: new ToolConfig(),
    WindowLevel: new ToolConfig(),
    Draw: new ToolConfig(this.shapeNames),
  };
  public toolNames: string[] = Object.keys(this.tools);
  public canScroll = false;
  public canWindowLevel = false;
  public presetNames: string[] = [];
  public loadProgress = 0;
  public dataLoaded = false;

  private _selectedTool = '';
  private _selectedPreset = '';
  private _selectedShape = this.shapeNames[0];

  private dwvApp!: App;
  private metaData!: Record<string, DataElement>;

  private orientation!: string;

  // drop box class name
  private dropboxDivId = 'dropBox';
  private dropboxClassName = 'dropBox';
  private borderClassName = 'dropBoxBorder';
  private hoverClassName = 'hover';

  /**
   * Get the selected tool.
   * @returns The selected tool.
   */
  get selectedTool(): string {
    return this._selectedTool;
  }

  /**
   * Set and apply the selected tool.
   * @param name The selected tool.
   */
  set selectedTool(name: string) {
    // draw case: could be a shape change
    if (this._selectedTool !== name ||
      this._selectedTool === 'Draw'
    ) {
      this._selectedTool = name;
      // apply
      this.applySelectedTool();
    }
  }

  /**
   * Get the selected preset.
   * @returns The selected preset.
   */
  get selectedPreset(): string {
    return this._selectedPreset;
  }

  /**
   * Set and apply the selected preset.
   * @param name The selected preset.
   */
  set selectedPreset(name: string) {
    if (this._selectedPreset !== name) {
      this._selectedPreset = name;
      // apply
      this.applySelectedPreset();
    }
  }

  /**
   * Get the selected shape.
   * @returns The selected shape.
   */
  get selectedShape(): string {
    return this._selectedShape;
  }

  /**
   * Set and apply the selected shape.
   * @param name The selected shape.
   */
  set selectedShape(name: string) {
    if (this._selectedShape !== name) {
      this._selectedShape = name;
      // apply
      this.applySelectedShape();
    }
  }

  ngOnInit() {
    // create app
    this.dwvApp = new App();
    // initialise app
    const viewConfig0 = new ViewConfig('layerGroup0');
    const viewConfigs = {'*': [viewConfig0]};
    const options = new AppOptions(viewConfigs);
    options.tools = this.tools;
    options.overlayConfig = overlayConfig;
    this.dwvApp.init(options);
    // handle load events
    let nLoadItem = 0;
    let nReceivedLoadError = 0;
    let nReceivedLoadAbort = 0;
    let isFirstRender = false;
    this.dwvApp.addEventListener('loadstart', (/*event*/) => {
      // reset flags
      this.dataLoaded = false;
      nLoadItem = 0;
      nReceivedLoadError = 0;
      nReceivedLoadAbort = 0;
      isFirstRender = true;
      // hide drop box
      this.showDropbox(false);
    });
    this.dwvApp.addEventListener('loadprogress', (event: ProgressEvent) => {
      this.loadProgress = event.loaded;
      // trigger angular update
      this.changeDetectorRef.markForCheck();
    });
    this.dwvApp.addEventListener('renderend', (event: DwvEvent) => {
      if (isFirstRender) {
        isFirstRender = false;
        const vl = this.dwvApp.getViewLayersByDataId(event.dataid)[0];
        const vc = vl.getViewController();
        // available tools
        if (this.toolNames.includes('Scroll') && vc.canScroll()) {
          this.canScroll = true;
        }
        if (this.toolNames.includes('WindowLevel') && vc.isMonochrome()) {
          this.canWindowLevel = true;
        }
        // selected tool
        let selectedTool = this.toolNames[0];
        if (selectedTool === 'Scroll' &&
          !vc.canScroll() &&
          this.toolNames.length > 0) {
          selectedTool = this.toolNames[1];
        }
        // set and apply
        this.selectedTool = selectedTool;

        // get window level presets
        if (this.toolNames.includes('WindowLevel')) {
          this.presetNames = vc.getWindowLevelPresetsNames();
          this._selectedPreset = this.presetNames[0];
        }
      }
    });
    this.dwvApp.addEventListener('load', (event: DwvEvent) => {
      // set dicom tags
      this.metaData = this.dwvApp.getMetaData(event.dataid) as Record<string, DataElement>;
      // force progress
      this.loadProgress = 100;
      // set data loaded flag
      this.dataLoaded = true;
    });
    this.dwvApp.addEventListener('loadend', (/*event*/) => {
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
    this.dwvApp.addEventListener('loaditem', (/*event*/) => {
      ++nLoadItem;
    });
    this.dwvApp.addEventListener('loaderror', (event: ErrorEvent) => {
      console.error(event.error);
      ++nReceivedLoadError;
    });
    this.dwvApp.addEventListener('loadabort', (/*event*/) => {
      ++nReceivedLoadAbort;
    });

    // handle key events
    this.dwvApp.addEventListener('keydown', (event: KeyboardEvent) => {
        this.dwvApp.defaultOnKeydown(event);
    });
    // listen to 'wlchange'
    this.dwvApp.addEventListener('wlchange', (event: DwvEvent) => {
      // value: [center, width, name]
      const manualStr = 'manual';
      if (event.value[2] === manualStr) {
        if (!this.presetNames.includes(manualStr)) {
          this.presetNames.push(manualStr);
          // trigger angular update
          this.changeDetectorRef.detectChanges();
        }
        if (this.selectedPreset !== manualStr) {
          this._selectedPreset = manualStr;
        }
      }
    });
    // handle window resize
    window.addEventListener('resize', this.dwvApp.onResize);

    // load or dropbox
    if (this.uri !== undefined) {
      this.dwvApp.loadFromUri(this.uri);
    } else if (this.urls !== undefined) {
      this.dwvApp.loadURLs(this.urls);
    } else {
      this.setupDropbox();
    }
  }

  /**
   * Get the icon of a tool.
   *
   * @param tool The tool name.
   * @returns The associated icon string.
   */
  getToolIcon = (tool: string) => {
    let res!: string;
    if (tool === 'Scroll') {
      res = 'menu';
    } else if (tool === 'ZoomAndPan') {
      res = 'search';
    } else if (tool === 'WindowLevel') {
      res = 'contrast';
    } else if (tool === 'Draw') {
      if (this._selectedShape === 'Ruler') {
        res = 'straighten';
      } else if (this._selectedShape === 'Arrow') {
        res = 'call_made';
      } else if (this._selectedShape === 'Rectangle') {
        res = 'crop_landscape';
      } else if (this._selectedShape === 'Circle') {
        res = 'radio_button_unchecked';
      } else if (this._selectedShape === 'Ellipse') {
        res = 'sports_rugby';
      } else if (this._selectedShape === 'Protractor') {
        res = 'square_foot';
      } else if (this._selectedShape === 'Roi') {
        res = 'polyline';
      }
    }
    return res;
  }

  /**
   * Handle a tool change event.
   * @param tool The new tool name.
   */
  onChangeTool = (tool: string) => {
    // will apply selected tool
    this.selectedTool = tool;
  }

  /**
   * Apply the selected tool.
   */
  applySelectedTool = () => {
    if (this.dwvApp) {
      this.dwvApp.setTool(this._selectedTool);
      const lg = this.dwvApp.getActiveLayerGroup();
      if (this._selectedTool === 'Draw') {
        this.dwvApp.setToolFeatures({shapeName: this._selectedShape});
        // reuse created draw layer
        if (lg !== undefined && lg.getNumberOfLayers() > 1) {
          lg?.setActiveLayer(1);
        }
      } else {
        // if draw was created, active is now a draw layer...
        // reset to view layer
        lg?.setActiveLayer(0);
      }
    }
  }

  /**
   * Apply the selected window level preset.
   */
  applySelectedPreset = () => {
    const lg = this.dwvApp.getActiveLayerGroup();
    if (lg !== undefined) {
      const vl = lg.getViewLayersFromActive()[0];
      const vc = vl.getViewController();
      vc.setWindowLevelPreset(this._selectedPreset);
    }
  }

  /**
   * Apply the selected draw shape.
   */
  applySelectedShape = () => {
    // will apply selected tool and shape
    this.selectedTool = 'Draw';
  }

  /**
   * Check if a tool can be run.
   *
   * @param tool The tool name.
   * @returns True if the tool can be run.
   */
  canRunTool = (tool: string) => {
    let res: boolean;
    if (tool === 'Scroll') {
      res = this.canScroll;
    } else if (tool === 'WindowLevel') {
      res = this.canWindowLevel;
    } else {
      res = true;
    }
    return res;
  }

  /**
   * Toogle the viewer orientation.
   */
  toggleOrientation = () => {
    if (typeof this.orientation !== 'undefined') {
      if (this.orientation === 'axial') {
        this.orientation = 'coronal';
      } else if (this.orientation === 'coronal') {
        this.orientation = 'sagittal';
      } else if (this.orientation === 'sagittal') {
        this.orientation = 'axial';
      }
    } else {
      // default is most probably axial
      this.orientation = 'coronal';
    }
    // update data view config
    const viewConfig0 = new ViewConfig('layerGroup0');
    viewConfig0.orientation = this.orientation;
    const viewConfigs = {'*': [viewConfig0]};
    this.dwvApp.setDataViewConfigs(viewConfigs);
    // render data
    const dataIds = this.dwvApp.getDataIds();
    for (const dataId of dataIds) {
      this.dwvApp.render(dataId);
    }
  }

  /**
   * Handle a reset event.
   */
  onReset = () => {
    if ( this.dwvApp ) {
      this.dwvApp.resetLayout();
    }
  }

  /**
   * Open the DICOM tags dialog.
   */
  openTagsDialog = () => {
    this.dialog.open(TagsDialogComponent,
      {
        data: {
          title: 'DICOM Tags',
          value: this.metaData
        }
      }
    );
  }

  // drag and drop [begin] -----------------------------------------------------

  /**
   * Setup the data load drop box: add event listeners and set initial size.
   */
  private setupDropbox = () => {
    this.showDropbox(true);
  }

  /**
   * Default drag event handling.
   * @param event The event to handle.
   */
  private defaultHandleDragEvent = (event: DragEvent) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
  }

  /**
   * Handle a drag over.
   * @param event The event to handle.
   */
  private onBoxDragOver = (event: DragEvent) => {
    this.defaultHandleDragEvent(event);
    // update box border
    const box = document.getElementById(this.dropboxDivId);
    if (box && box.className.indexOf(this.hoverClassName) === -1) {
        box.className += ' ' + this.hoverClassName;
    }
  }

  /**
   * Handle a drag leave.
   * @param event The event to handle.
   */
  private onBoxDragLeave = (event: DragEvent) => {
    this.defaultHandleDragEvent(event);
    // update box border
    const box = document.getElementById(this.dropboxDivId);
    if (box && box.className.indexOf(this.hoverClassName) !== -1) {
        box.className = box.className.replace(' ' + this.hoverClassName, '');
    }
  }

  /**
   * Handle a drop event.
   * @param event The event to handle.
   */
  private onDrop = (event: DragEvent) => {
    this.defaultHandleDragEvent(event);
    // load files
    if (event.dataTransfer) {
      const files = Array.from(event.dataTransfer.files);
      this.dwvApp.loadFiles(files);
    }
  }

  /**
   * Handle a an input[type:file] change event.
   * @param event The event to handle.
   */
  private onInputFile = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target && target.files) {
      const files = Array.from(target.files);
      this.dwvApp.loadFiles(files);
    }
  }

  /**
   * Show/hide the data load drop box.
   * @param show True to show the drop box.
   */
  private showDropbox = (show: boolean) => {
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
    } else {
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
  }

  // drag and drop [end] -------------------------------------------------------

}
