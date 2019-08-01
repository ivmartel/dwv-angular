import { Component, OnInit } from '@angular/core';
import { VERSION } from '@angular/core';
import * as dwv from 'dwv';
import { MatDialog } from '@angular/material/dialog';
import { TagsDialogComponent } from './tags-dialog.component';

// gui overrides

// decode query
dwv.utils.decodeQuery = dwv.utils.base.decodeQuery;
// progress
dwv.gui.displayProgress = () => {};
// get element
dwv.gui.getElement = dwv.gui.base.getElement;
// refresh element
dwv.gui.refreshElement = dwv.gui.base.refreshElement;

// Image decoders (for web workers)
dwv.image.decoderScripts = {
    jpeg2000: 'assets/dwv/decoders/pdfjs/decode-jpeg2000.js',
    'jpeg-lossless': 'assets/dwv/decoders/rii-mango/decode-jpegloss.js',
    'jpeg-baseline': 'assets/dwv/decoders/pdfjs/decode-jpegbaseline.js',
    rle: 'assets/dwv/decoders/dwv/decode-rle.js'
};

@Component({
  selector: 'app-dwv',
  templateUrl: './dwv.component.html',
  styleUrls: ['./dwv.component.scss']
})

export class DwvComponent implements OnInit {
  public versions: any;
  public tools = ['Scroll', 'ZoomAndPan', 'WindowLevel', 'Draw'];
  public selectedTool = 'Select Tool';
  public loadProgress = 0;
  public dataLoaded = false;
  private dwvApp: any;
  private tags: any[];

  constructor(public dialog: MatDialog) {
    this.versions = {
      dwv: dwv.getVersion(),
      angular: VERSION.full
    };
  }

  ngOnInit() {
    // create app
    this.dwvApp = new dwv.App();
    // initialise app
    this.dwvApp.init({
      containerDivId: 'dwv',
      tools: this.tools,
      shapes: ['Ruler'],
      isMobile: true
    });
    // progress
    const self = this;
    this.dwvApp.addEventListener('load-progress', (event) => {
      self.loadProgress = event.loaded;
    });
    this.dwvApp.addEventListener('load-end', (event) => {
      // set data loaded flag
      self.dataLoaded = true;
      // set dicom tags
      self.tags = self.dwvApp.getTags();
      // set the selected tool
      if (self.dwvApp.isMonoSliceData() && self.dwvApp.getImage().getNumberOfFrames() === 1) {
        self.selectedTool = 'ZoomAndPan';
      } else {
        self.selectedTool = 'Scroll';
      }
    });
  }

  onChangeTool(tool): void {
    if ( this.dwvApp ) {
      this.selectedTool = tool;
      this.dwvApp.onChangeTool({ currentTarget: { value: tool } });
    }
  }

  onReset(): void {
    if ( this.dwvApp ) {
      this.dwvApp.onDisplayReset();
    }
  }

  openTagsDialog(): void {
    this.dialog.open(TagsDialogComponent,
      {
        width: '80%',
        height: '90%',
        data: { title: 'DICOM Tags', value: this.tags }
      }
    );
  }
}
