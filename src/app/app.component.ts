import { Component } from '@angular/core';
import { VERSION } from '@angular/core';

import * as dwv from 'dwv';

// overrides (appgui.js)

// Progress
dwv.gui.displayProgress = function () {}
// Window
dwv.gui.getWindowSize = dwv.gui.base.getWindowSize
// get element
dwv.gui.getElement = dwv.gui.base.getElement

dwv.gui.refreshElement = dwv.gui.base.refreshElement;

// launch (applauncher.js)

// create app
var myapp = new dwv.App()

// initialise app
myapp.init({
  'containerDivId': 'dwv',
  'fitToWindow': true,
  'tools': ['WindowLevel', 'ZoomAndPan'],
  'shapes': ['Arrow', 'Ruler'],
  'isMobile': true
})

// load local dicom
myapp.loadURLs(['./assets/bbmri-53323131.dcm'])

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  legend = 'Powered by dwv ' + dwv.getVersion() + ' and Angular ' + VERSION.full;
  onClick = function (event) {
    myapp.onChangeTool(event);
  };
}
