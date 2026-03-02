import {
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
  inject,
  effect,
  model,
  untracked
} from '@angular/core';
import { VERSION } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DwvService } from './dwv.service';
import { MatDialog } from '@angular/material/dialog';

import { TagsDialogComponent } from './tags-dialog.component';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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

  @Input() showLegend = false;
  @Input() uri!: string;
  @Input() urls!: string[];

  private readonly dwvService = inject(DwvService);
  public toolNames = this.dwvService.getToolNames();
  public shapeNames = this.dwvService.getShapeNames();
  // dwvService signals
  public loadProgress = this.dwvService.loadProgress;
  public dataReady = this.dwvService.dataReady;
  public dataLoaded = this.dwvService.dataLoaded;
  public presetNames = this.dwvService.presetNames;
  public isManualPreset = this.dwvService.isManualPreset;

  public versions = {
    dwv: this.dwvService.getDwvVersion(),
    angular: VERSION.full
  };

  readonly selectedTool = model<string>('');
  readonly selectedShape = model(this.shapeNames[0]);
  readonly selectedPreset = model<string>('');

  // drop box class name
  private dropboxDivId = 'dropBox';
  private dropboxClassName = 'dropBox';
  private borderClassName = 'dropBoxBorder';
  private hoverClassName = 'hover';

  constructor() {
    // watch data ready
    effect(() => {
      if (this.dataReady()) {
        const runnableTool = this.dwvService.getFirstRunnableTool();
        if (runnableTool !== undefined) {
          this.selectedTool.set(runnableTool);
          this.applyTool(runnableTool);
        }
      }
    });
    // watch data load and progress
    effect(() => {
      const isLoaded = this.dataLoaded();
      const progress = this.loadProgress();
      const isLoading = progress !== 0 && progress !== 100;
      this.showDropbox(!isLoading && !isLoaded);
    });
    // watch preset names
    effect(() => {
      const presetNames = this.presetNames();
      this.selectedPreset.set(presetNames[0]);
    });
    // watch isManualPreset
    effect(() => {
      const isManual = this.isManualPreset();
      // untrack since we could set it next
      const preset = untracked(() => this.selectedPreset());
      const manualStr = 'manual';
      if (isManual && preset !== manualStr) {
        this.selectedPreset.set(manualStr);
      }
    });
  }

  ngOnInit() {
    // load or dropbox
    if (this.uri !== undefined) {
      this.dwvService.loadFromUri(this.uri);
    } else if (this.urls !== undefined) {
      this.dwvService.loadURLs(this.urls);
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
  getToolIcon(tool: string) {
    let res!: string;
    if (tool === 'Scroll') {
      res = 'menu';
    } else if (tool === 'ZoomAndPan') {
      res = 'search';
    } else if (tool === 'WindowLevel') {
      res = 'contrast';
    } else if (tool === 'Draw') {
      res = this.getShapeIcon(this.selectedShape());
    }
    return res;
  }

  /**
   * Get the icon of a shape.
   *
   * @param shape The shape name.
   * @returns The associated icon string.
   */
  getShapeIcon(shape: string) {
    let res!: string;
    if (shape === 'Ruler') {
      res = 'straighten';
    } else if (shape === 'Arrow') {
      res = 'call_made';
    } else if (shape === 'Rectangle') {
      res = 'crop_landscape';
    } else if (shape === 'Circle') {
      res = 'radio_button_unchecked';
    } else if (shape === 'Ellipse') {
      res = 'sports_rugby';
    } else if (shape === 'Protractor') {
      res = 'square_foot';
    } else if (shape === 'Roi') {
      res = 'polyline';
    }
    return res;
  }

  /**
   * Handle a tool change.
   *
   * @param tool The tool name.
   */
  onChangeTool(tool: string) {
    this.selectedTool.set(tool);
    this.applyTool(tool);
  }

  /**
   * Handle a shape select event.
   *
   * @param event The change event.
   */
  onChangeShape(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedTool.set('Draw');
    this.selectedShape.set(val);
    this.applyShape(val);
  }

  /**
   * Handle a preset select event.
   *
   * @param event The change event.
   */
  onChangePreset(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedPreset.set(val);
    this.applyPreset(val);
  }

  /**
   * Apply a tool.
   *
   * @param tool The tool name.
   * @param features Optional tool features.
   */
  applyTool(tool: string, features?: object) {
    if (features === undefined && tool === 'Draw') {
      features = {shapeName: this.selectedShape()};
    }
    this.dwvService.applyTool(tool, features);
  }

  /**
   * Apply a draw shape.
   *
   * @param shape The shape name.
   */
  applyShape(shape: string) {
    this.applyTool('Draw', {shapeName: shape});
  }

  /**
   * Apply a window level preset.
   *
   * @param preset The preset name.
   */
  applyPreset(preset: string) {
    this.dwvService.applyPreset(preset);
  }

  /**
   * Check if a tool can be run.
   *
   * @param tool The tool name.
   * @returns True if the tool can be run.
   */
  canRunTool(tool: string) {
    return this.dwvService.canRunTool(tool);
  }

  /**
   * Toogle the viewer orientation.
   */
  toggleOrientation() {
    this.dwvService.toggleOrientation();
  }

  /**
   * Handle a reset event.
   */
  onReset() {
    this.dwvService.reset();
  }

  /**
   * Open the DICOM tags dialog.
   */
  openTagsDialog() {
    this.dialog.open(TagsDialogComponent,
      {
        data: {
          title: 'DICOM Tags',
          value: this.dwvService.getMetaData()
        }
      }
    );
  }

  // drag and drop [begin] -----------------------------------------------------

  /**
   * Setup the data load drop box: add event listeners and set initial size.
   */
  private setupDropbox() {
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
      this.dwvService.loadFiles(files);
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
      this.dwvService.loadFiles(files);
    }
  }

  /**
   * Show/hide the data load drop box.
   * @param show True to show the drop box.
   */
  private showDropbox(show: boolean) {
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
