import {
  Component,
  signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Foldable right panel component.
 */

@Component({
  selector: 'dwv-right-panel',
  imports: [
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './right-panel.component.html',
  styleUrls: ['./right-panel.component.scss']
})

export class DwvRightPanelComponent {

  /**
   * Panel open flag.
   */
  readonly isOpen = signal(false);

  /**
   * Toggle the panel.
   */
  toggle() {
    this.isOpen.update(value => !value);
  }

}
