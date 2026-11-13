import { Component } from '@angular/core';
import { DwvComponent } from 'dwv-angular';

@Component({
  selector: 'app-root',
  imports: [
    DwvComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'dwv-angular-app';
}
