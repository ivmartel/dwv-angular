import {
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DwvAppService } from '../services/dwv-app.service';
import { AnnotationService } from '../services/annotation.service';
import { provideViewerId } from '../services/viewer-id';

import { DwvHeaderComponent } from './header.component';
import { DwvContentComponent } from './content.component';
import { DwvFooterComponent } from './footer.component';

/**
 * DWV component: display DICOM data using DWV (DICOM Web Viewer).
 *
 * The data inputs are checked in order: uri, urls then
 * loadFromWindowLocation; the first one that is set is used. They are only
 * read on init. A dropbox to load local data is shown if no data is loaded.
 *
 * ref: {@link https://github.com/ivmartel/dwv}.
 *
 * Usage example:
 * @example
 * <dwv-angular [showLegend]="true"></dwv-angular>
 * @example
 * <dwv-angular
 *   uri="https://www.demo.com/index.html?input=file.dcm">
 * </dwv-angular>
 * @example
 * <dwv-angular
 *   [urls]="[
 *     'https://www.demo.com/file0.dcm',
 *     'https://www.demo.com/file1.dcm'
 *   ]">
 * </dwv-angular>
 * @example
 * <dwv-angular [loadFromWindowLocation]="true"></dwv-angular>
 */

@Component({
  selector: 'dwv-angular',
  imports: [
    DwvHeaderComponent,
    DwvContentComponent,
    DwvFooterComponent
  ],
  // one id and service instance per viewer
  providers: [provideViewerId(), DwvAppService, AnnotationService],
  templateUrl: './dwv-angular.component.html',
  styleUrls: ['./dwv-angular.component.scss']
})

export class DwvComponent implements OnInit {

  /**
   * Show the footer legend ("Powered by" dwv and Angular, with their
   * versions), defaults to false.
   */
  @Input() showLegend = false;
  /**
   * URI with search arguments describing the data to load, for example
   * `https://www.demo.com/index.html?input=file.dcm`
   * (see the dwv `App.loadFromUri` method).
   */
  @Input() uri!: string;
  /**
   * List of urls of the data to load.
   */
  @Input() urls!: string[];
  /**
   * Use the window location as input URI if it contains search arguments,
   * defaults to false.
   */
  @Input() loadFromWindowLocation = false;

  private readonly dwvAppService = inject(DwvAppService);
  private readonly annotService = inject(AnnotationService);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    // notify the user of service problems
    const onLoadError = () => {
      this.snackBar.open(
        'Received errors during load. Check log for details.', 'Close');
    };
    const onLoadAbort = () => {
      this.snackBar.open('Load was aborted.', 'Close', {duration: 5000});
    };
    const onAnnotationError = (event: Event) => {
      const error = (event as CustomEvent<Error>).detail;
      this.snackBar.open(error.message, 'Close');
    };
    this.dwvAppService.addEventListener('loaderror', onLoadError);
    this.dwvAppService.addEventListener('loadabort', onLoadAbort);
    this.annotService.addEventListener('error', onAnnotationError);
    inject(DestroyRef).onDestroy(() => {
      this.dwvAppService.removeEventListener('loaderror', onLoadError);
      this.dwvAppService.removeEventListener('loadabort', onLoadAbort);
      this.annotService.removeEventListener('error', onAnnotationError);
    });
  }

  ngOnInit() {
    // load or dropbox
    if (this.uri !== undefined) {
      this.dwvAppService.loadFromUri(this.uri);
    } else if (this.urls !== undefined) {
      this.dwvAppService.loadURLs(this.urls);
    } else if (this.loadFromWindowLocation &&
      window.location.search !== '') {
      this.dwvAppService.loadFromUri(window.location.href);
    }
  }

}
