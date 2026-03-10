import {
  Component,
  inject,
} from '@angular/core';
import { VERSION } from '@angular/core';
import { DwvService } from './dwv.service';

/**
 * Footer component.
 */

@Component({
  selector: 'dwv-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})

export class DwvFooterComponent {

  private readonly dwvService = inject(DwvService);

  public versions = {
    dwv: this.dwvService.getDwvVersion(),
    angular: VERSION.full
  };

}
