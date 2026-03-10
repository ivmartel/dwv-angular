import {
  Component,
  Input,
  OnInit,
  inject
} from '@angular/core';

import { DwvService } from '../services/dwv.service';

import { DwvHeaderComponent } from './header.component';
import { DwvContentComponent } from './content.component';
import { DwvFooterComponent } from './footer.component';

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
    DwvHeaderComponent,
    DwvContentComponent,
    DwvFooterComponent
  ],
  templateUrl: './dwv-angular.component.html',
  styleUrls: ['./dwv-angular.component.scss']
})

export class DwvComponent implements OnInit {

  @Input() showLegend = false;
  @Input() uri!: string;
  @Input() urls!: string[];

  private readonly dwvService = inject(DwvService);

  ngOnInit() {
    // load or dropbox
    if (this.uri !== undefined) {
      this.dwvService.loadFromUri(this.uri);
    } else if (this.urls !== undefined) {
      this.dwvService.loadURLs(this.urls);
    }
  }

}
