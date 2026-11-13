import { InjectionToken, Provider } from '@angular/core';

/**
 * Id of a viewer (`<dwv-angular>` instance), shared with its services
 *   and child components to build unique HTML element ids
 *   (for example `dwv-0-layerGroup`).
 */
export const DWV_VIEWER_ID = new InjectionToken<string>('DWV_VIEWER_ID');

/**
 * Number of created viewer ids.
 */
let viewerCount = 0;

/**
 * Provide a new viewer id: to add to the providers of the viewer
 *   component so that each instance gets its own id.
 *
 * Note: the counter is per copy of this library, ids could clash
 *   if several copies are loaded on the same page.
 *
 * @returns The viewer id provider.
 */
export function provideViewerId(): Provider {
  return {
    provide: DWV_VIEWER_ID,
    useFactory: () => 'dwv-' + viewerCount++
  };
}
