import {
  Component,
  inject,
} from '@angular/core';
import { VERSION } from '@angular/core';

import { DwvAppService } from '../services/dwv-app.service';

/**
 * Footer component.
 */

@Component({
  selector: 'dwv-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})

export class DwvFooterComponent {

  private readonly dwvAppService = inject(DwvAppService);

  public versions = {
    dwv: this.dwvAppService.getDwvVersion(),
    angular: VERSION.full
  };

}
