import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material';

import { DwvComponent } from './dwv.component';


@NgModule({
  declarations: [
    DwvComponent
  ],
  imports: [
    BrowserModule,
    MatButtonModule
  ],
  providers: [],
  bootstrap: [DwvComponent]
})
export class DwvModule { }
