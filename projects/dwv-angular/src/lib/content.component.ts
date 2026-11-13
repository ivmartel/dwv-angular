import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  signal,
  viewChild,
  afterNextRender
} from '@angular/core';

import { DwvAppService } from '../services/dwv-app.service';

import { DwvAnnotationListComponent } from './annotation-list.component';
import { DwvRightPanelComponent } from './right-panel.component';

/**
 * Content component.
 */

@Component({
  selector: 'dwv-content',
  imports: [
    DwvAnnotationListComponent,
    DwvRightPanelComponent
  ],
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class DwvContentComponent {

  private readonly dwvAppService = inject(DwvAppService);
  // dwvAppService signals
  public loadProgress = this.dwvAppService.loadProgress;
  public dataLoaded = this.dwvAppService.dataLoaded;
  /**
   * Id of the HTML div element of the main layer group.
   */
  public layerGroupDivId = this.dwvAppService.getLayerGroupDivId();

  /**
   * Show the drop box when no data is loaded nor loading.
   */
  readonly showDropbox = computed(() => {
    const progress = this.loadProgress();
    const isLoading = progress !== 0 && progress !== 100;
    return !isLoading && !this.dataLoaded();
  });
  /**
   * Drag hover over the drop box flag.
   */
  readonly isHover = signal(false);

  private readonly dropBox = viewChild.required<ElementRef<HTMLElement>>('dropBox');
  private readonly layerGroup = viewChild.required<ElementRef<HTMLElement>>('layerGroup');

  constructor() {
    // refit the view when the layer group size changes
    // (for example when the right panel is opened or closed)
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new ResizeObserver(() => {
        this.dwvAppService.onResize();
      });
      observer.observe(this.layerGroup().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  // drag and drop [begin] -----------------------------------------------------

  /**
   * Default drag event handling: prevent the browser from opening the files.
   * @param event The event to handle.
   */
  private defaultHandleDragEvent(event: Event) {
    event.stopPropagation();
    event.preventDefault();
  }

  /**
   * Handle a drag over.
   * @param event The event to handle.
   */
  onDragOver(event: DragEvent) {
    this.defaultHandleDragEvent(event);
    this.isHover.set(this.showDropbox() && this.isInDropBox(event.target));
  }

  /**
   * Check if an event target is inside the drop box.
   * @param target The event target.
   * @returns True if inside the drop box.
   */
  private isInDropBox(target: EventTarget | null) {
    return target instanceof Node &&
      this.dropBox().nativeElement.contains(target);
  }

  /**
   * Handle a drag leave.
   * @param event The event to handle.
   */
  onDragLeave(event: DragEvent) {
    this.defaultHandleDragEvent(event);
    // ignore leave events towards a child of the drop box
    if (this.isInDropBox(event.relatedTarget)) {
      return;
    }
    this.isHover.set(false);
  }

  /**
   * Handle a drop event.
   * @param event The event to handle.
   */
  onDrop(event: DragEvent) {
    this.defaultHandleDragEvent(event);
    this.isHover.set(false);
    // load files
    if (event.dataTransfer) {
      const files = Array.from(event.dataTransfer.files);
      if (files.length !== 0) {
        this.dwvAppService.loadFiles(files);
      }
    }
  }

  /**
   * Handle a an input[type:file] change event.
   * @param event The event to handle.
   */
  onInputFile(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target && target.files) {
      const files = Array.from(target.files);
      this.dwvAppService.loadFiles(files);
    }
  }

  // drag and drop [end] -------------------------------------------------------

}
