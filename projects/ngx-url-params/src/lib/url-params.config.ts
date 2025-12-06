import { InjectionToken } from '@angular/core';

export const URL_PARAMS_DEBOUNCE_MS = new InjectionToken<number>(
  'URL_PARAMS_DEBOUNCE_MS',
  {
    providedIn: 'root',
    factory: () => 50 // default value
  }
);
