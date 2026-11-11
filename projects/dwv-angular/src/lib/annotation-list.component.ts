import {
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import {
  AnnotationGroupState,
  AnnotationItemState,
  AnnotationService
} from '../services/annotation.service';

import { getShapeIcon } from './shape-icons';
import { getQuantificationGroups } from './quantification';

/**
 * Annotation list component: renders the annotation service state.
 *
 * Adapted from the dwv viewer `viewer.ui.annot.js`.
 */

@Component({
  selector: 'dwv-annotation-list',
  imports: [
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './annotation-list.component.html',
  styleUrls: ['./annotation-list.component.scss']
})

export class DwvAnnotationListComponent {

  private readonly annotService = inject(AnnotationService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly state = this.annotService.state;

  readonly getShapeIcon = getShapeIcon;
  readonly getQuantificationGroups = getQuantificationGroups;

  /**
   * Keys of the annotations with open quantification details
   *   (view only state).
   */
  readonly openDetails = signal(new Set<string>());

  constructor() {
    // scroll the selected annotation into view
    afterRenderEffect(() => {
      const selected = this.state().selected;
      if (selected === undefined) {
        return;
      }
      const id = this.getAnnotationDivId(selected.dataId, selected.annotationId);
      this.host.nativeElement.querySelector(`[id="${CSS.escape(id)}"]`)
        ?.scrollIntoView({block: 'nearest'});
    });
  }

  /**
   * Get the annotation div id.
   *
   * @param dataId The annotation group data id.
   * @param annotationId The annotation tracking UID.
   * @returns The div id.
   */
  getAnnotationDivId(dataId: string, annotationId: string) {
    return `annotationgroup${dataId}-annotation${annotationId}`;
  }

  /**
   * Check if an annotation is selected.
   *
   * @param dataId The annotation group data id.
   * @param annotationId The annotation tracking UID.
   * @returns True if selected.
   */
  isSelected(dataId: string, annotationId: string) {
    const selected = this.state().selected;
    return selected?.dataId === dataId &&
      selected?.annotationId === annotationId;
  }

  /**
   * Check if an annotation details are open.
   *
   * @param dataId The annotation group data id.
   * @param annotationId The annotation tracking UID.
   * @returns True if open.
   */
  isDetailsOpen(dataId: string, annotationId: string) {
    return this.openDetails().has(this.getAnnotationDivId(dataId, annotationId));
  }

  // actions

  /**
   * Toggle a group editability.
   *
   * @param group The group state.
   */
  toggleLock(group: AnnotationGroupState) {
    this.annotService.setAnnotationGroupEditable(group.dataId, !group.editable);
  }

  /**
   * Toggle a group labels visibility.
   *
   * @param group The group state.
   */
  toggleLabels(group: AnnotationGroupState) {
    this.annotService.setLabelsVisibility(group.dataId, !group.labelsVisible);
  }

  /**
   * Save an annotation group as DICOM SR.
   *
   * @param dataId The annotation group data id.
   */
  saveAnnotationGroup(dataId: string) {
    // errors are dispatched as service events
    const blob = this.annotService.getAnnotationGroupAsDicom(dataId);
    if (blob === undefined) {
      return;
    }
    // temporary link to download
    const element = document.createElement('a');
    element.href = URL.createObjectURL(blob);
    element.download = `dicom-sr-${dataId}.dcm`;
    element.click();
    URL.revokeObjectURL(element.href);
  }

  /**
   * Select and go to an annotation.
   *
   * @param dataId The annotation group data id.
   * @param annotation The annotation state.
   */
  gotoAnnotation(dataId: string, annotation: AnnotationItemState) {
    this.annotService.selectAnnotation(dataId, annotation.id);
    this.annotService.gotoAnnotation(dataId, annotation.id);
  }

  /**
   * Toggle an annotation quantification details.
   *
   * @param dataId The annotation group data id.
   * @param annotation The annotation state.
   */
  toggleDetails(dataId: string, annotation: AnnotationItemState) {
    const divId = this.getAnnotationDivId(dataId, annotation.id);
    this.openDetails.update((set) => {
      const res = new Set(set);
      if (!res.delete(divId)) {
        res.add(divId);
      }
      return res;
    });
  }

  /**
   * Change an annotation colour.
   *
   * @param dataId The annotation group data id.
   * @param annotation The annotation state.
   * @param event The input change event.
   */
  changeColour(dataId: string, annotation: AnnotationItemState, event: Event) {
    const colour = (event.target as HTMLInputElement).value;
    this.annotService.changeAnnotationColour(dataId, annotation.id, colour);
  }

  /**
   * Toggle an annotation visibility.
   *
   * @param dataId The annotation group data id.
   * @param annotation The annotation state.
   */
  toggleVisibility(dataId: string, annotation: AnnotationItemState) {
    this.annotService.setAnnotationVisibility(
      dataId, annotation.id, !annotation.visible);
  }

  /**
   * Delete an annotation.
   *
   * @param dataId The annotation group data id.
   * @param annotation The annotation state.
   */
  deleteAnnotation(dataId: string, annotation: AnnotationItemState) {
    this.annotService.deleteAnnotation(dataId, annotation.id);
  }

}
