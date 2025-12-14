import { Directive } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UrlParamsService } from './url-params.service';

/**
 * Directive that registers the host component's `ActivatedRoute` with
 * `UrlParamsService` when applied.
 *
 * Example:
 * <div urlParamsRoute>...</div>
 */
@Directive({ selector: '[urlParamsRoute]' })
export class UrlParamsRouteDirective {
  constructor(route: ActivatedRoute, urlParams: UrlParamsService) {
    // Register the route immediately so the service merges the snapshot
    // query params into its internal state and starts route-aware sync.
    urlParams.registerRoute(route);
  }
}
