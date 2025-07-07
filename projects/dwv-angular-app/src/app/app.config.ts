import { ApplicationConfig, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker'
// needed for the tags-dialog
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
