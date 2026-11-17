import { Component } from '@angular/core';
import { DwvViewerComponent } from '@ivmartel/dwv-angular';

@Component({
  selector: 'app-root',
  imports: [
    DwvViewerComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dwv-angular-app';
}
