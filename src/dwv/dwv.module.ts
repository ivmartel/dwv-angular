import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DwvComponent } from './dwv.component';


@NgModule({
  declarations: [
    DwvComponent
  ],
  imports: [
    BrowserModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  providers: [],
  bootstrap: [DwvComponent]
})
export class DwvModule { }
