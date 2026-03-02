import { Injectable, signal } from '@angular/core';
import {
  App,
  AppOptions,
  DataElement,
  ViewConfig,
  ToolConfig,
  getDwvVersion
} from 'dwv';
import { overlayConfig } from './overlays';

/**
 * DWV event.
 */
class DwvEvent {
  dataid!: string;
  value!: (number|string)[];
}

/**
 * DWV service.
 */
@Injectable({providedIn: 'root'})
export class DwvService {
  /**
   * List of annotation shape names.
   */
  #shapeNames = [
    'Ruler',
    'Arrow',
    'Rectangle',
    'Circle',
    'Ellipse',
    'Protractor',
    'Roi'
  ];

  /**
   * List of tools.
   */
  #tools = {
    Scroll: new ToolConfig(),
    ZoomAndPan: new ToolConfig(),
    WindowLevel: new ToolConfig(),
    Draw: new ToolConfig(this.#shapeNames),
  };
  /**
   * List of tool names.
   */
  #toolNames: string[] = Object.keys(this.#tools);

  /**
   * Can scroll flag.
   */
  #canScroll = false;
  /**
   * Can window level flag.
   */
  #canWindowLevel = false;

  /**
   * Orientation name.
   */
  #orientation!: string;

  /**
   * Name of the main layer group.
   */
  #layerGroupName!: string;

  /**
   * DWV app.
   */
  readonly #dwvApp = new App();

  /**
   * Meta data of the loaded data.
   */
  #metaData!: Record<string, DataElement>;

  // signals

  /**
   * Load progress: [0, 100].
   */
  readonly #loadProgress = signal(0);
  readonly loadProgress = this.#loadProgress.asReadonly();
  /**
   * Data ready flag: set to true after first render.
   */
  readonly #dataReady = signal(false);
  readonly dataReady = this.#dataReady.asReadonly();
  /**
   * Data loaded flag: set to true after load ok event.
   */
  readonly #dataLoaded = signal(false);
  readonly dataLoaded = this.#dataLoaded.asReadonly();
  /**
   * List of preset names: set after first render.
   */
  readonly #presetNames = signal<string[]>([]);
  readonly presetNames = this.#presetNames.asReadonly();
  /**
   * Is the latest wl change a manual one.
   */
  readonly #isManualPreset = signal(false);
  readonly isManualPreset = this.#isManualPreset.asReadonly();

  constructor() {
    // initialise app
    this.#layerGroupName = 'layerGroup0';
    const viewConfig0 = new ViewConfig(this.#layerGroupName);
    const viewConfigs = {'*': [viewConfig0]};
    const appOptions = new AppOptions(viewConfigs);
    appOptions.tools = this.#tools;
    appOptions.overlayConfig = overlayConfig;
    this.#dwvApp.init(appOptions);
    // setup listeners
    this.#setupLoadListeners();
    this.#setupListeners();
  }

  /**
   * Get the DWV version.
   *
   * @returns The version.
   */
  getDwvVersion() {
    return getDwvVersion();
  }

  /**
   * Get the list of tool names.
   *
   * @returns The list of names.
   */
  getToolNames() {
    return this.#toolNames;
  }

  /**
   * Get the list of annotation shape names.
   *
   * @returns The list of names.
   */
  getShapeNames() {
    return this.#shapeNames;
  }

  /**
   * Get the meta data of the loaded data.
   *
   * @returns The meta data.
   */
  getMetaData() {
    return this.#metaData;
  }

  /**
   * Setup the DWV app load listeners.
   */
  #setupLoadListeners() {
    // handle load events
    let nReceivedLoadError = 0;
    let nReceivedLoadAbort = 0;
    let isFirstRender = false;
    this.#dwvApp.addEventListener('loadstart', (/*event*/) => {
      // reset flags
      this.#dataReady.set(false);
      this.#dataLoaded.set(false);
      nReceivedLoadError = 0;
      nReceivedLoadAbort = 0;
      isFirstRender = true;
    });
    this.#dwvApp.addEventListener('loadprogress', (event: ProgressEvent) => {
      this.#loadProgress.set(event.loaded);
    });
    this.#dwvApp.addEventListener('renderend', (event: DwvEvent) => {
      if (isFirstRender) {
        isFirstRender = false;
        const vl = this.#dwvApp.getViewLayersByDataId(event.dataid)[0];
        const vc = vl.getViewController();
        // available tools
        this.#canScroll = vc.canScroll();
        this.#canWindowLevel = vc.isMonochrome();
        // get window level presets
        this.#presetNames.set(vc.getWindowLevelPresetsNames());
        // set data ready flag
        this.#dataReady.set(true);
      }
    });
    this.#dwvApp.addEventListener('load', (event: DwvEvent) => {
      // set dicom tags
      this.#metaData = this.#dwvApp.getMetaData(event.dataid) as Record<string, DataElement>;
      // force progress
      this.#loadProgress.set(100);
      // set data loaded flag
      this.#dataLoaded.set(true);
    });
    this.#dwvApp.addEventListener('loadend', (/*event*/) => {
      if (nReceivedLoadError) {
        this.#loadProgress.set(0);
        alert('Received errors during load. Check log for details.');
      }
      if (nReceivedLoadAbort) {
        this.#loadProgress.set(0);
        alert('Load was aborted.');
      }
    });
    this.#dwvApp.addEventListener('loaderror', (event: ErrorEvent) => {
      console.error(event.error);
      ++nReceivedLoadError;
    });
    this.#dwvApp.addEventListener('loadabort', (/*event*/) => {
      ++nReceivedLoadAbort;
    });
  }

  /**
   * Setup the DWV app generic listeners.
   */
  #setupListeners() {
    // listen to 'wlchange' to flag a manual change
    // and update the presets if necessary
    this.#dwvApp.addEventListener('wlchange', (event: DwvEvent) => {
      // value: [center, width, name]
      const manualStr = 'manual';
      if (event.value[2] === manualStr) {
        if (!this.presetNames().includes(manualStr)) {
          this.#presetNames.update(values => [...values, manualStr]);
        }
        this.#isManualPreset.set(true);
      } else {
        this.#isManualPreset.set(false);
      }
    });

    // handle key events
    this.#dwvApp.addEventListener('keydown', (event: KeyboardEvent) => {
      this.#dwvApp.defaultOnKeydown(event);
    });
    // handle window resize
    window.addEventListener('resize', this.#dwvApp.onResize);
  }

  /**
   * Load a list of urls.
   *
   * @param urls The urls.
   */
  loadURLs(urls: string[]) {
    this.#dwvApp.loadURLs(urls);
  }

  /**
   * Load a from uri.
   *
   * @param uri The uri.
   */
  loadFromUri(uri: string) {
    this.#dwvApp.loadFromUri(uri);
  }

  /**
   * Load a list of files.
   *
   * @param files The files.
   */
  loadFiles(files: File[]) {
    this.#dwvApp.loadFiles(files);
  }

  /**
   * Check if a tool can be run.
   *
   * @param toolName The tool name.
   * @returns True if the tool can be run, undefined if unknown.
   */
  canRunTool(toolName: string) {
    let res;
    if (toolName === 'Scroll') {
      res = this.#canScroll;
    } else if (toolName === 'WindowLevel') {
      res = this.#canWindowLevel;
    } else if (this.#toolNames.includes(toolName)) {
      res = true;
    } else {
      console.log('Unknwon tool', toolName);
    }
    return res;
  }

  /**
   * Get the first runnable tool name from the list of tools.
   *
   * @returns The tool name.
   */
  getFirstRunnableTool() {
    return this.#toolNames.find((item) => this.canRunTool(item));
  }

  /**
   * Apply a tool: set it to dwv.
   *
   * @param toolName The tool name.
   * @param features Optional tool features.
   */
  applyTool(toolName: string, features?: object) {
    this.#dwvApp.setTool(toolName);
    if (features !== undefined) {
      this.#dwvApp.setToolFeatures(features);
    }

    const lg = this.#dwvApp.getActiveLayerGroup();
    if (toolName === 'Draw') {
      // reuse created draw layer
      if (lg !== undefined && lg.getNumberOfLayers() > 1) {
        lg?.setActiveLayer(1);
      }
    } else {
      // if draw was created, active is now a draw layer...
      // reset to view layer
      lg?.setActiveLayer(0);
    }
  }

  /**
   * Apply a window level preset: set it to dwv.
   *
   * @param presetName The preset name.
   */
  applyPreset(presetName: string) {
    const lg = this.#dwvApp.getActiveLayerGroup();
    if (lg !== undefined) {
      const vl = lg.getViewLayersFromActive()[0];
      const vc = vl.getViewController();
      vc.setWindowLevelPreset(presetName);
    }
  }

  /**
   * Toogle between possible orientations.
   */
  toggleOrientation() {
    if (typeof this.#orientation !== 'undefined') {
      if (this.#orientation === 'axial') {
        this.#orientation = 'coronal';
      } else if (this.#orientation === 'coronal') {
        this.#orientation = 'sagittal';
      } else if (this.#orientation === 'sagittal') {
        this.#orientation = 'axial';
      }
    } else {
      // default is most probably axial
      this.#orientation = 'coronal';
    }
    // update data view config
    const viewConfig0 = new ViewConfig(this.#layerGroupName);
    viewConfig0.orientation = this.#orientation;
    const viewConfigs = {'*': [viewConfig0]};
    this.#dwvApp.setDataViewConfigs(viewConfigs);
    // render data
    const dataIds = this.#dwvApp.getDataIds();
    for (const dataId of dataIds) {
      this.#dwvApp.render(dataId);
    }
  }

  /**
   * Reset the layout.
   */
  reset() {
    this.#dwvApp.resetLayout();
  }
}
