import { Component, OnInit } from '@angular/core';
import { VERSION } from '@angular/core';
import * as dwv from 'dwv';
import { MatDialog } from '@angular/material/dialog';
import { TagsDialogComponent } from './tags-dialog.component';

// gui overrides

// get element
dwv.gui.getElement = dwv.gui.base.getElement;

// Image decoders (for web workers)
dwv.image.decoderScripts = {
    jpeg2000: 'assets/dwv/decoders/pdfjs/decode-jpeg2000.js',
    'jpeg-lossless': 'assets/dwv/decoders/rii-mango/decode-jpegloss.js',
    'jpeg-baseline': 'assets/dwv/decoders/pdfjs/decode-jpegbaseline.js',
    rle: 'assets/dwv/decoders/dwv/decode-rle.js'
};

@Component({
  selector: 'app-dwv',
  templateUrl: './dwv.component.html',
  styleUrls: ['./dwv.component.scss']
})

export class DwvComponent implements OnInit {
  public versions: any;
  public tools = ['Scroll', 'ZoomAndPan', 'WindowLevel', 'Draw'];
  public shapes = ['Ruler'];
  public selectedTool = 'Select Tool';
  public loadProgress = 0;
  public dataLoaded = false;
  private dwvApp: any;
  private metaData: any[];

  // drop box class name
  private dropboxClassName = 'dropBox';
  private borderClassName = 'dropBoxBorder';
  private hoverClassName = 'hover';

  constructor(public dialog: MatDialog) {
    this.versions = {
      dwv: dwv.getVersion(),
      angular: VERSION.full
    };
  }

  ngOnInit() {
    // create app
    this.dwvApp = new dwv.App();
    // initialise app
    this.dwvApp.init({
      containerDivId: 'dwv',
      tools: this.tools,
      shapes: this.shapes
    });
    // progress
    this.dwvApp.addEventListener('load-progress', (event) => {
      this.loadProgress = event.loaded;
    });
    this.dwvApp.addEventListener('load-end', (event) => {
      // set data loaded flag
      this.dataLoaded = true;
      // set dicom tags
      this.metaData = this.objectToArray(this.dwvApp.getMetaData());
      // set the selected tool
      if (this.dwvApp.isMonoSliceData() && this.dwvApp.getImage().getNumberOfFrames() === 1) {
        this.selectedTool = 'ZoomAndPan';
      } else {
        this.selectedTool = 'Scroll';
      }
      this.onChangeTool(this.selectedTool);
    });
    // setup drop box
    this.setupDropbox();
  }

  /**
   * Setup the drop box: add event listeners and set initial size.
   */
  setupDropbox = () => {
      // start listening to drag events on the layer container
      const layerContainer = this.dwvApp.getElement('layerContainer');
      if (layerContainer) {
        layerContainer.addEventListener('dragover', this.onDragOver);
        layerContainer.addEventListener('dragleave', this.onDragLeave);
        layerContainer.addEventListener('drop', this.onDrop);
      }
      // set the initial drop box size
      const box = this.dwvApp.getElement(this.dropboxClassName);
      if (box) {
        const size = this.dwvApp.getLayerContainerSize();
        const dropBoxSize = 2 * size.height / 3;
        box.setAttribute(
          'style',
          'width:' + dropBoxSize + 'px;height:' + dropBoxSize + 'px');
      }
  }

  hideDropbox = () => {
    // remove box
    const box = this.dwvApp.getElement(this.dropboxClassName);
    if (box) {
      box.parentNode.removeChild(box);
    }
  }

  /**
   * Handle a change tool event.
   * @param tool The new tool.
   */
  onChangeTool = (tool) => {
    if ( this.dwvApp ) {
      this.selectedTool = tool;
      this.dwvApp.setTool(tool);
      if (tool === 'Draw') {
        this.onChangeShape(this.shapes[0]);
      }
    }
  }

  /**
   * Handle a change draw shape event.
   * @param shape The new shape.
   */
  onChangeShape = (shape) => {
    if ( this.dwvApp && this.selectedTool === 'Draw') {
      this.dwvApp.setDrawShape(shape);
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
        width: '80%',
        height: '90%',
        data: { title: 'DICOM Tags', value: this.metaData }
      }
    );
  }

  /**
   * Handle a drag over.
   * @param event The event to handle.
   */
  onDragOver = (event) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
    // update box border
    const box = this.dwvApp.getElement(this.borderClassName);
    if (box && box.className.indexOf(this.hoverClassName) === -1) {
        box.className += ' ' + this.hoverClassName;
    }
  }

  /**
   * Handle a drag leave.
   * @param event The event to handle.
   */
  onDragLeave = (event) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
    // update box class
    const box = this.dwvApp.getElement(this.borderClassName + ' hover');
    if (box && box.className.indexOf(this.hoverClassName) !== -1) {
        box.className = box.className.replace(' ' + this.hoverClassName, '');
    }
  }

  /**
   * Handle a drop event.
   * @param event The event to handle.
   */
  onDrop = (event) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
    // load files
    this.dwvApp.loadFiles(event.dataTransfer.files);
    // hide drop box
    this.hideDropbox();
  }

  isObject = (unknown) => {
      const type = typeof unknown;
      return type === 'function' || type === 'object' && !!unknown;
  }

  objectToArray = (obj) => {
      const array = [];
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; ++i ) {
          const key = keys[i];
          const row = {name: key};
          const innerKeys = Object.keys(obj[key]);
          for (let j = 0; j < innerKeys.length; ++j ) {
              const innerKey = innerKeys[j];
              let value = obj[key][innerKey];
              if (this.isObject(value)) {
                  value = JSON.stringify(value);
              }
              row[innerKey] = value;
          }
          array.push(row);
      }
      return array;
  }

}
