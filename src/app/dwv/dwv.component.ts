import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { VERSION } from '@angular/core';
import {
  App,
  AppOptions,
  ViewConfig,
  ToolConfig,
  decoderScripts,
  getDwvVersion
} from 'dwv';
import { MatDialog } from '@angular/material/dialog';
import { TagsDialogComponent } from './tags-dialog.component';
import { MatButtonToggleChange } from '@angular/material/button-toggle';

// gui overrides

// Image decoders (for web workers)
decoderScripts.jpeg2000 = 'assets/dwv/decoders/pdfjs/decode-jpeg2000.js';
decoderScripts['jpeg-lossless'] = 'assets/dwv/decoders/rii-mango/decode-jpegloss.js';
decoderScripts['jpeg-baseline'] = 'assets/dwv/decoders/pdfjs/decode-jpegbaseline.js';
decoderScripts.rle = 'assets/dwv/decoders/dwv/decode-rle.js';

@Component({
  selector: 'app-dwv',
  templateUrl: './dwv.component.html',
  styleUrls: ['./dwv.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class DwvComponent implements OnInit {
  public versions: any;
  public tools = {
      Scroll: new ToolConfig(),
      ZoomAndPan: new ToolConfig(),
      WindowLevel: new ToolConfig(),
      Draw: new ToolConfig(['Ruler']),
  };
  public toolNames: string[] = Object.keys(this.tools);
  public selectedTool = 'Select Tool';
  public loadProgress = 0;
  public dataLoaded = false;

  private dwvApp!: App;
  private metaData!: any;

  private orientation!: string;

  // drop box class name
  private dropboxDivId = 'dropBox';
  private dropboxClassName = 'dropBox';
  private borderClassName = 'dropBoxBorder';
  private hoverClassName = 'hover';

  constructor(public dialog: MatDialog) {
    this.versions = {
      dwv: getDwvVersion(),
      angular: VERSION.full
    };
  }

  ngOnInit() {
    // create app
    this.dwvApp = new App();
    // initialise app
    const viewConfig0 = new ViewConfig('layerGroup0');
    const viewConfigs = {'*': [viewConfig0]};
    const options = new AppOptions(viewConfigs);
    options.tools = this.tools;
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
    });
    this.dwvApp.addEventListener('renderend', (/*event*/) => {
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
    this.dwvApp.addEventListener('load', (event: any) => {
      // set dicom tags
      this.metaData = this.dwvApp.getMetaData(event.dataid);
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
  getToolIcon = (tool: string) => {
    let res!: string;
    if (tool === 'Scroll') {
      res = 'menu';
    } else if (tool === 'ZoomAndPan') {
      res = 'search';
    } else if (tool === 'WindowLevel') {
      res = 'contrast';
    } else if (tool === 'Draw') {
      res = 'straighten';
    }
    return res;
  }

  /**
   * Handle a change tool event.
   * @param tool The new tool name.
   */
  onChangeTool = (tool: string) => {
    if ( this.dwvApp ) {
      this.selectedTool = tool;
      this.dwvApp.setTool(tool);
      if (tool === 'Draw' &&
        typeof this.tools.Draw.options !== 'undefined') {
        this.onChangeShape(this.tools.Draw.options[0]);
      }
    }
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
      res = this.dwvApp.canScroll();
    } else if (tool === 'WindowLevel') {
      res = this.dwvApp.canWindowLevel();
    } else {
      res = true;
    }
    return res;
  }

  /**
   * For toogle button to not get selected.
   *
   * @param event The toogle change.
   */
  onSingleToogleChange = (event: MatButtonToggleChange) => {
    // unset value -> do not select button
    event.source.buttonToggleGroup.value = '';
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
   * Handle a change draw shape event.
   * @param shape The new shape name.
   */
  private onChangeShape = (shape: string) => {
    if ( this.dwvApp && this.selectedTool === 'Draw') {
      this.dwvApp.setToolFeatures({shapeName: shape});
    }
  }

  /**
   * Handle a reset event.
   */
  onReset = () => {
    if ( this.dwvApp ) {
      this.dwvApp.resetDisplay();
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
