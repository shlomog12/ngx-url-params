import { InjectionToken, Provider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UrlParamsService } from './url-params.service';

/**
 * Token used to register the component's `ActivatedRoute` via DI.
 * The provider registers the route on construction and returns `true`.
 */
export const URL_PARAMS_REGISTER_ROUTE = new InjectionToken<boolean>('URL_PARAMS_REGISTER_ROUTE');

/**
 * Provider object that can be added to a component's `providers` array to
 * automatically register the component's `ActivatedRoute` with
 * `UrlParamsService` during dependency injection.
 *
 * Usage:
 * @Component({
 *   providers: [URL_PARAMS_REGISTER_ROUTE_PROVIDER]
 * })
 */
export const URL_PARAMS_REGISTER_ROUTE_PROVIDER: Provider = {
  provide: URL_PARAMS_REGISTER_ROUTE,
  useFactory: (route: ActivatedRoute, urlParams: UrlParamsService) => {
    urlParams.registerRoute(route);
    return true;
  },
  deps: [ActivatedRoute, UrlParamsService],
};

export default URL_PARAMS_REGISTER_ROUTE_PROVIDER;
