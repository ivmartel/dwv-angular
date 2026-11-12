import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Foldable and resizable right panel component.
 */

@Component({
  selector: 'dwv-right-panel',
  imports: [
    NgTemplateOutlet,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './right-panel.component.html',
  styleUrls: ['./right-panel.component.scss']
})

export class DwvRightPanelComponent {

  readonly #injector = inject(Injector);

  /**
   * The toggle button: there is one when closed (over the image)
   *   and one when open (in the panel header).
   */
  private readonly toggleButton =
    viewChild('toggleRef', {read: ElementRef<HTMLButtonElement>});

  /**
   * Minimum panel width, in pixels.
   */
  readonly minWidth = 200;
  /**
   * Keyboard resize step, in pixels.
   */
  readonly #keyStep = 20;

  /**
   * Panel open flag.
   */
  readonly isOpen = signal(false);
  /**
   * Panel width when open, in pixels.
   */
  readonly width = signal(300);
  /**
   * Resize drag in progress flag.
   */
  readonly isResizing = signal(false);

  /**
   * Drag start pointer x position and panel width.
   */
  #dragStart: {x: number, width: number} | undefined;

  /**
   * Toggle the panel.
   */
  toggle() {
    this.isOpen.update(value => !value);
    // the toggle button is re-created: keep the focus on it
    afterNextRender(() => {
      this.toggleButton()?.nativeElement.focus();
    }, {injector: this.#injector});
  }

  /**
   * Get the maximum panel width: leave room for the view.
   *
   * @returns The width, in pixels.
   */
  maxWidth() {
    return Math.max(this.minWidth, Math.round(window.innerWidth * 0.5));
  }

  /**
   * Set the panel width, clamped to [min, max].
   *
   * @param width The width, in pixels.
   */
  #setWidth(width: number) {
    this.width.set(
      Math.min(this.maxWidth(), Math.max(this.minWidth, Math.round(width))));
  }

  /**
   * Handle a resize handle pointer down: start the drag.
   *
   * @param event The pointer event.
   */
  onResizeStart(event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.#dragStart = {x: event.clientX, width: this.width()};
    this.isResizing.set(true);
  }

  /**
   * Handle a resize handle pointer move: resize while dragging.
   *
   * @param event The pointer event.
   */
  onResizeMove(event: PointerEvent) {
    if (this.#dragStart === undefined) {
      return;
    }
    // the panel is on the right: moving left makes it wider
    this.#setWidth(this.#dragStart.width + this.#dragStart.x - event.clientX);
  }

  /**
   * Handle a resize handle pointer up or cancel: end the drag.
   *
   * @param event The pointer event.
   */
  onResizeEnd(event: PointerEvent) {
    if (this.#dragStart === undefined) {
      return;
    }
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    this.#dragStart = undefined;
    this.isResizing.set(false);
  }

  /**
   * Handle a resize handle key down: arrows resize, home/end
   *   go to the min/max width.
   *
   * @param event The keyboard event.
   */
  onResizeKeydown(event: KeyboardEvent) {
    const width = this.width();
    const sizes: Record<string, number> = {
      ArrowLeft: width + this.#keyStep,
      ArrowRight: width - this.#keyStep,
      Home: this.minWidth,
      End: this.maxWidth()
    };
    const size = sizes[event.key];
    if (size !== undefined) {
      event.preventDefault();
      this.#setWidth(size);
    }
  }

}
