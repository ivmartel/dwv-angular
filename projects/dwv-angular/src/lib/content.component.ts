import {
  Component,
  ViewEncapsulation,
  inject,
  effect
} from '@angular/core';

import { DwvService } from '../services/dwv.service';

/**
 * Content component.
 */

@Component({
  selector: 'dwv-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class DwvContentComponent {

  private readonly dwvService = inject(DwvService);
  // dwvService signals
  public loadProgress = this.dwvService.loadProgress;
  public dataLoaded = this.dwvService.dataLoaded;

  // drop box class name
  private dropboxDivId = 'dropBox';
  private dropboxClassName = 'dropBox';
  private borderClassName = 'dropBoxBorder';
  private hoverClassName = 'hover';

  constructor() {
    this.showDropbox(true);
    // watch data load and progress
    effect(() => {
      const isLoaded = this.dataLoaded();
      const progress = this.loadProgress();
      const isLoading = progress !== 0 && progress !== 100;
      this.showDropbox(!isLoading && !isLoaded);
    });
  }

  // drag and drop [begin] -----------------------------------------------------

  /**
   * Default drag event handling.
   * @param event The event to handle.
   */
  defaultHandleDragEvent = (event: Event) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
  }

  /**
   * Handle a drag over.
   * @param event The event to handle.
   */
  onBoxDragOver = (event: Event) => {
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
  onBoxDragLeave = (event: Event) => {
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
  onDrop = (event: DragEvent) => {
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
  onInputFile = (event: Event) => {
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
