import { Component, OnInit } from '@angular/core';
import { DwvComponent } from 'dwv-angular';

@Component({
  selector: 'app-root',
  imports: [
    DwvComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'dwv-angular-app';
  uri!: string;

  ngOnInit() {
    // pass window location if there are search parameters
    if (window.location.search !== '') {
      this.uri = window.location.href;
    }
  }
}
