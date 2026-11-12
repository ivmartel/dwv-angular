import { Injectable, inject, signal } from '@angular/core';
import {
  Annotation,
  AnnotationGroupFactory,
  DicomWriter,
  DrawController,
  getUID
} from 'dwv';

import { DwvAppService } from './dwv-app.service';

/**
 * Annotation quantification value.
 */
export interface QuantificationValue {
  value?: number;
  unit?: string;
}

/**
 * Annotation state: plain data, do not modify.
 */
export interface AnnotationItemState {
  /** The annotation tracking UID. */
  id: string;
  /** The annotation tracking id. */
  label: string;
  /** The annotation colour as hex string. */
  colour: string;
  /** The annotation factory name, 'unknown' if not known. */
  factoryName: string;
  /** True if the annotation can be viewed (it has a view controller). */
  canView: boolean;
  /** True if the annotation is shown. */
  visible: boolean;
  /** The annotation quantification. */
  quantification: Record<string, QuantificationValue | undefined> | undefined;
}

/**
 * Annotation group state: plain data, do not modify.
 */
export interface AnnotationGroupState {
  /** The annotation group data id. */
  dataId: string;
  /** True if the group is editable. */
  editable: boolean;
  /** True if the labels are shown. */
  labelsVisible: boolean;
  /** The annotations. */
  annotations: AnnotationItemState[];
}

/**
 * Annotation selection.
 */
export interface AnnotationSelection {
  /** The annotation group data id. */
  dataId: string;
  /** The annotation tracking UID. */
  annotationId: string;
}

/**
 * Annotation service state: immutable, a new object is created
 *   on each change and unchanged parts keep their identity.
 */
export interface AnnotationState {
  /** The annotation groups, in order of addition. */
  groups: AnnotationGroupState[];
  /** The selected annotation. */
  selected: AnnotationSelection | undefined;
}

/**
 * DWV app event details, as dispatched by the dwv service.
 */
interface DwvEventDetail {
  dataid: string;
  data?: unknown;
  annotationid?: string;
}

/**
 * DWV service event.
 */
type DwvAppServiceEvent = CustomEvent<DwvEventDetail>;

/**
 * Get the state of an annotation.
 *
 * @param annotation The annotation.
 * @param visible The annotation visibility.
 * @returns The annotation state.
 */
function getAnnotationItemState(
  annotation: Annotation, visible: boolean): AnnotationItemState {
  const factory = annotation.getFactory() as
    { getName(): string } | undefined;
  return {
    id: annotation.trackingUid,
    label: annotation.trackingId,
    colour: annotation.colour,
    factoryName: factory?.getName() ?? 'unknown',
    canView: annotation.canView(),
    visible,
    quantification: annotation.quantification as
      Record<string, QuantificationValue | undefined> | undefined
  };
}

/**
 * Annotation service: annotation logic and state on top of the
 *   dwv service, exposed as a signal. Actions are keyed by
 *   data id and annotation id; dwv objects are not exposed.
 *
 * Events: `error`, dispatched as a `CustomEvent` with the `Error`
 *   as `detail` when an action fails.
 *
 * Adapted from the dwv-simplistic `annotationService.js`.
 */
@Injectable({providedIn: 'root'})
export class AnnotationService extends EventTarget {

  readonly #dwvAppService = inject(DwvAppService);

  /**
   * The group states indexed by data id (in order of addition).
   */
  readonly #groups = new Map<string, AnnotationGroupState>();

  /**
   * The editable change listeners indexed by data id.
   */
  readonly #editableListeners = new Map<string, (event: {data: boolean}) => void>();

  /**
   * The selected annotation.
   */
  #selected: AnnotationSelection | undefined;

  /**
   * The state.
   */
  readonly #state = signal<AnnotationState>({groups: [], selected: undefined});
  readonly state = this.#state.asReadonly();

  /**
   * The dwv service event handlers.
   */
  readonly #handlers: Record<string, (event: DwvAppServiceEvent) => void> = {
    dataadd: (event) => this.#onDataAdd(event),
    dataremove: (event) => this.#onDataRemove(event),
    drawlayeradd: (event) => this.#onDrawLayerAdd(event),
    annotationadd: (event) => this.#onAnnotationAdd(event),
    annotationupdate: (event) => this.#onAnnotationUpdate(event),
    annotationremove: (event) => this.#onAnnotationRemove(event),
    annotationselect: (event) => this.#onAnnotationSelect(event)
  };

  constructor() {
    super();
    // both services live as long as the app: no need to remove the listeners
    for (const [type, handler] of Object.entries(this.#handlers)) {
      this.#dwvAppService.addEventListener(type,
        (event) => handler(event as DwvAppServiceEvent));
    }
  }

  // actions

  /**
   * Add an annotation group on the active view layer of the main
   *   layer group. The group appears in the state once loaded by the app.
   *
   * @returns False if no reference was found.
   */
  addAnnotationGroup() {
    return this.#dwvAppService.addAnnotationGroup();
  }

  /**
   * Change an annotation colour (undoable).
   *
   * @param dataId The annotation group data id.
   * @param annotationId The annotation tracking UID.
   * @param colour The new colour as hex string.
   */
  changeAnnotationColour(dataId: string, annotationId: string, colour: string) {
    const annotationGroup = this.#getAnnotationGroup(dataId);
    // get annotation from the group (the group can replace it on update)
    const annotation = annotationGroup?.find(annotationId);
    if (annotation === undefined || colour === annotation.colour) {
      return;
    }
    const drawController = new DrawController(annotationGroup);
    drawController.updateAnnotationWithCommand(
      annotationId,
      {colour: annotation.colour},
      {colour},
      this.#dwvAppService.addToUndoStack
    );
  }

  /**
   * Delete an annotation (undoable).
   *
   * @param dataId The annotation group data id.
   * @param annotationId The annotation tracking UID.
   */
  deleteAnnotation(dataId: string, annotationId: string) {
    const annotationGroup = this.#getAnnotationGroup(dataId);
    if (annotationGroup === undefined) {
      return;
    }
    const drawController = new DrawController(annotationGroup);
    drawController.removeAnnotationWithCommand(
      annotationId,
      this.#dwvAppService.addToUndoStack
    );
  }

  /**
   * Set an annotation visibility.
   *
   * @param dataId The annotation group data id.
   * @param annotationId The annotation tracking UID.
   * @param visible True to show the annotation.
   */
  setAnnotationVisibility(dataId: string, annotationId: string, visible: boolean) {
    const drawLayers = this.#dwvAppService.getDrawLayersByDataId(dataId);
    for (const layer of drawLayers) {
      layer.setAnnotationVisibility(annotationId, visible);
    }
    this.#updateAnnotation(dataId, annotationId,
      (item) => ({...item, visible}));
  }

  /**
   * Set an annotation group labels visibility.
   *
   * @param dataId The annotation group data id.
   * @param visible True to show the labels.
   * @returns False if no draw layer was found.
   */
  setLabelsVisibility(dataId: string, visible: boolean) {
    const drawLayer = this.#dwvAppService.getDrawLayersByDataId(dataId)[0];
    if (drawLayer === undefined) {
      console.warn(`Cannot find draw layer with id ${dataId}`);
      return false;
    }
    drawLayer.setLabelsVisibility(visible);
    this.#updateGroup(dataId, (group) => ({...group, labelsVisible: visible}));
    return true;
  }

  /**
   * Set an annotation group editability.
   *
   * @param dataId The annotation group data id.
   * @param editable True to make the group editable.
   */
  setAnnotationGroupEditable(dataId: string, editable: boolean) {
    // state is updated by the group editable change listener
    this.#getAnnotationGroup(dataId)?.setEditable(editable);
  }

  /**
   * Go to an annotation: set the view position to its centroid.
   *
   * @param dataId The annotation group data id.
   * @param annotationId The annotation tracking UID.
   */
  gotoAnnotation(dataId: string, annotationId: string) {
    const annotation = this.#getAnnotationGroup(dataId)?.find(annotationId);
    const annotCentroid = annotation?.getCentroid();
    if (annotCentroid === undefined) {
      console.warn('No centroid for annotation');
      return;
    }
    const drawLayers = this.#dwvAppService.getDrawLayersByDataId(dataId);
    for (const layer of drawLayers) {
      layer.setCurrentPosition(annotCentroid);
    }
  }

  /**
   * Select an annotation.
   *
   * @param dataId The annotation group data id.
   * @param annotationId The annotation tracking UID.
   * @returns False if the annotation was not found.
   */
  selectAnnotation(dataId: string, annotationId: string) {
    const exists = this.#groups.get(dataId)?.annotations
      .some((item) => item.id === annotationId);
    if (!exists) {
      return false;
    }
    if (this.#selected?.dataId !== dataId ||
      this.#selected?.annotationId !== annotationId) {
      this.#selected = {dataId, annotationId};
      this.#emit();
    }
    return true;
  }

  /**
   * Clear the annotation selection.
   */
  clearSelection() {
    if (this.#selected !== undefined) {
      this.#selected = undefined;
      this.#emit();
    }
  }

  /**
   * Get an annotation group as a DICOM SR blob.
   *
   * @param dataId The annotation group data id.
   * @returns The DICOM SR blob, or undefined if the group is not found
   *   or the writing fails, in which case an `error` event is dispatched.
   */
  getAnnotationGroupAsDicom(dataId: string): Blob | undefined {
    try {
      return this.#getAnnotationGroupAsDicom(dataId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(err);
      this.dispatchEvent(new CustomEvent('error', {detail: err}));
      return undefined;
    }
  }

  // internals

  /**
   * Get an annotation group as a DICOM SR blob.
   *
   * @param dataId The annotation group data id.
   * @returns The DICOM SR blob.
   * @throws {Error} If the group is not found or the writing fails.
   */
  #getAnnotationGroupAsDicom(dataId: string) {
    const annotationGroup = this.#getAnnotationGroup(dataId);
    if (annotationGroup === undefined) {
      throw new Error(`Cannot find annotation group with id ${dataId}`);
    }
    const factory = new AnnotationGroupFactory();
    const sopUID = getUID('SOPInstanceUID');
    const extraTags = {
      MediaStorageSOPInstanceUID: sopUID,
      SOPInstanceUID: sopUID,
      InstanceNumber: 123,
      SeriesInstanceUID: getUID('SeriesInstanceUID'),
      SeriesNumber: 123,
      SeriesDescription: 'Annnotation made with dwv',
    };
    const dicomElements = factory.toDicom(annotationGroup, extraTags);
    const writer = new DicomWriter();
    const dicomBuffer = writer.getBuffer(dicomElements);
    return new Blob([dicomBuffer], {type: 'application/dicom'});
  }

  /**
   * Get an annotation group from the app.
   *
   * @param dataId The annotation group data id.
   * @returns The annotation group.
   */
  #getAnnotationGroup(dataId: string) {
    return this.#dwvAppService.getAnnotationGroup(dataId);
  }

  /**
   * Set a new state from the internal maps.
   */
  #emit() {
    this.#state.set({
      groups: Array.from(this.#groups.values()),
      selected: this.#selected
    });
  }

  /**
   * Update a group state.
   *
   * @param dataId The annotation group data id.
   * @param update Function taking the old group state
   *   and returning the new one.
   */
  #updateGroup(dataId: string,
    update: (group: AnnotationGroupState) => AnnotationGroupState) {
    const group = this.#groups.get(dataId);
    if (group === undefined) {
      return;
    }
    this.#groups.set(dataId, update(group));
    this.#emit();
  }

  /**
   * Update an annotation state.
   *
   * @param dataId The annotation group data id.
   * @param annotationId The annotation tracking UID.
   * @param update Function taking the old annotation state
   *   and returning the new one.
   */
  #updateAnnotation(dataId: string, annotationId: string,
    update: (item: AnnotationItemState) => AnnotationItemState) {
    this.#updateGroup(dataId, (group) => ({
      ...group,
      annotations: group.annotations.map((item) =>
        item.id === annotationId ? update(item) : item)
    }));
  }

  /**
   * Remove the editable change listener of a group.
   *
   * @param dataId The annotation group data id.
   */
  #removeEditableListener(dataId: string) {
    const listener = this.#editableListeners.get(dataId);
    if (listener !== undefined) {
      // the data can already be removed from the app
      this.#getAnnotationGroup(dataId)?.removeEventListener(
        'annotationgroupeditablechange', listener);
      this.#editableListeners.delete(dataId);
    }
  }

  /**
   * Handle 'dataadd' event: add the group state if the data
   *   has an annotation group.
   *
   * @param event The event.
   */
  #onDataAdd(event: DwvAppServiceEvent) {
    const dataId = event.detail.dataid;
    const annotationGroup = this.#getAnnotationGroup(dataId);
    if (annotationGroup === undefined) {
      return;
    }
    const listener = (editEvent: {data: boolean}) => {
      this.#updateGroup(dataId,
        (group) => ({...group, editable: editEvent.data}));
    };
    annotationGroup.addEventListener(
      'annotationgroupeditablechange', listener);
    this.#editableListeners.set(dataId, listener);

    this.#groups.set(dataId, {
      dataId,
      editable: annotationGroup.isEditable(),
      labelsVisible: true,
      annotations: annotationGroup.getList().map(
        (annotation) => getAnnotationItemState(annotation, true))
    });
    this.#emit();
  }

  /**
   * Handle 'dataremove' event: remove the group state
   *   if the data was an annotation group.
   *
   * @param event The event.
   */
  #onDataRemove(event: DwvAppServiceEvent) {
    const dataId = event.detail.dataid;
    if (!this.#groups.has(dataId)) {
      return;
    }
    this.#removeEditableListener(dataId);
    this.#groups.delete(dataId);
    if (this.#selected?.dataId === dataId) {
      this.#selected = undefined;
    }
    this.#emit();
  }

  /**
   * Handle 'drawlayeradd' event: refresh the annotations states
   *   (view controller and quantification are set by the draw layer).
   *
   * @param event The event.
   */
  #onDrawLayerAdd(event: DwvAppServiceEvent) {
    const dataId = event.detail.dataid;
    const annotationGroup = this.#getAnnotationGroup(dataId);
    if (annotationGroup === undefined) {
      return;
    }
    this.#updateGroup(dataId, (group) => ({
      ...group,
      annotations: annotationGroup.getList().map((annotation) => {
        const old = group.annotations.find(
          (item) => item.id === annotation.trackingUid);
        return getAnnotationItemState(annotation, old?.visible ?? true);
      })
    }));
  }

  /**
   * Handle 'annotationadd' event.
   *
   * @param event The event.
   */
  #onAnnotationAdd(event: DwvAppServiceEvent) {
    const annotation = event.detail.data as Annotation;
    // reset selection
    this.#selected = undefined;
    this.#updateGroup(event.detail.dataid, (group) => ({
      ...group,
      annotations: [
        ...group.annotations,
        getAnnotationItemState(annotation, true)
      ]
    }));
  }

  /**
   * Handle 'annotationupdate' event.
   *
   * @param event The event.
   */
  #onAnnotationUpdate(event: DwvAppServiceEvent) {
    const annotation = event.detail.data as Annotation;
    this.#updateAnnotation(event.detail.dataid, annotation.trackingUid,
      (item) => getAnnotationItemState(annotation, item.visible));
  }

  /**
   * Handle 'annotationremove' event.
   *
   * @param event The event.
   */
  #onAnnotationRemove(event: DwvAppServiceEvent) {
    const dataId = event.detail.dataid;
    const annotationId = (event.detail.data as Annotation).trackingUid;
    if (this.#selected?.dataId === dataId &&
      this.#selected?.annotationId === annotationId) {
      this.#selected = undefined;
    }
    this.#updateGroup(dataId, (group) => ({
      ...group,
      annotations: group.annotations.filter(
        (item) => item.id !== annotationId)
    }));
  }

  /**
   * Handle 'annotationselect' event.
   *
   * @param event The event.
   */
  #onAnnotationSelect(event: DwvAppServiceEvent) {
    if (event.detail.annotationid !== undefined) {
      this.selectAnnotation(event.detail.dataid, event.detail.annotationid);
    }
  }

}
