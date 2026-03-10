import {
  Component,
  inject,
  effect,
  model,
  untracked
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DwvService } from '../services/dwv.service';

import { TagsDialogComponent } from './tags-dialog.component';

/**
 * Header component.
 */

@Component({
  selector: 'dwv-header',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule
],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class DwvHeaderComponent {
  dialog = inject(MatDialog);

  private readonly dwvService = inject(DwvService);
  public toolNames = this.dwvService.getToolNames();
  public shapeNames = this.dwvService.getShapeNames();
  // dwvService signals
  public loadProgress = this.dwvService.loadProgress;
  public dataReady = this.dwvService.dataReady;
  public dataLoaded = this.dwvService.dataLoaded;
  public presetNames = this.dwvService.presetNames;
  public isManualPreset = this.dwvService.isManualPreset;

  readonly selectedTool = model<string>('');
  readonly selectedShape = model(this.shapeNames[0]);
  readonly selectedPreset = model<string>('');

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

}
