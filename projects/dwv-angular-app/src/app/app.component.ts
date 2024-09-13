import { Component } from '@angular/core';
import { DwvComponent } from 'dwv-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    DwvComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'dwv-angular-app';
}
