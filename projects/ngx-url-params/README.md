# ngx-url-params

Lightweight Angular service for managing and synchronizing URL query parameters with a concise, reactive API.

## Overview

`ngx-url-params` provides a focused service to read, update and observe URL query parameters. The service maintains an internal state (a `BehaviorSubject`) and can be synchronized with Angular's `Router` / `ActivatedRoute` by calling `init(router, route)`.

## Installation

```bash
npm install ngx-url-params
```

## Quick start

Inject `UrlParamsService` in a component or service and call `init(router, route)` where both `Router` and `ActivatedRoute` are available.

```ts
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UrlParamsService } from 'ngx-url-params';

@Component({ selector: 'app-demo', template: '' })
export class DemoComponent implements OnInit {
  constructor(
    private readonly urlParams: UrlParamsService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.urlParams.init(this.router, this.route);
    this.urlParams.setParam('view', 'list');
  }
}
```

If `init` is not called the service still offers the local reactive API (get/set/observe) but will not write to the URL. In modern apps the service will auto-initialize when a `Router` and `ActivatedRoute` are available.

You can register a component-local route using `registerRoute(route)` or by adding the `urlParamsRoute` directive to a host element (preferred when you want a declarative API). This is useful for component-relative navigation (child routes / lazy modules).

Deprecation note: `init()` is deprecated and will be removed in a future major release. Prefer `registerRoute()`, the `urlParamsRoute` directive, or the `URL_PARAMS_REGISTER_ROUTE_PROVIDER`. See the [CHANGELOG](./CHANGELOG.md) for details and migration guidance.

**Migration**

- **Before (using `init`)**

```ts
// Component that calls init(router, route)
@Component({ /* ... */ })
export class OldComponent implements OnInit {
  constructor(private urlParams: UrlParamsService, private router: Router, private route: ActivatedRoute) {}
  ngOnInit(): void {
    // Deprecated approach
    this.urlParams.init(this.router, this.route);
    this.urlParams.setParam('view', 'list');
  }
}
```

- **After (preferred: directive in template)**

```html
<!-- template.html -->
<div urlParamsRoute>
  <!-- child components or template code can use UrlParamsService -->
</div>
```

```ts
@Component({ /* standalone imports include the directive if needed */ })
export class NewComponent {
  constructor(private urlParams: UrlParamsService) {}
  // No explicit init needed; the directive registers the route
}
```

- **After (alternative: provider for DI-first style)**

```ts
@Component({
  providers: [URL_PARAMS_REGISTER_ROUTE_PROVIDER]
})
export class ProviderRegisteredComponent {
  constructor(private urlParams: UrlParamsService) {
    // Route registered during DI; no init() call required
  }
}
```

- **After (alternative: imperative registerRoute)**

```ts
@Component({ /* ... */ })
export class ExplicitComponent implements OnInit {
  constructor(private urlParams: UrlParamsService, private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.urlParams.registerRoute(this.route);
  }
}
```

These replacements are functionally equivalent and avoid the deprecated `init()` API.

Example (directive):

```html
<!-- In your component template -->
<div urlParamsRoute>
  <!-- child content can use UrlParamsService and will be registered to this route -->
</div>
```

Example (provider):

```ts
@Component({
  providers: [URL_PARAMS_REGISTER_ROUTE_PROVIDER]
})
export class MyComponent {}
```

The provider approach is convenient when you prefer a DI-first style or do not want to add attributes to templates.


## Public API (summary)

- `init(router: Router, route: ActivatedRoute): void` (deprecated — prefer `registerRoute` / directive / provider)
- `registerRoute(route: ActivatedRoute): void` — register a component-local route context
- `onRouteRegistered(): Observable<boolean>` — emits when a route context has been registered
- `getParams(): Record<string, any>`
- `getParam<T = any>(key: string): T | null`
- `getParamOrDefault<T>(key: string, fallback: T): T`
- `requireParam<T>(key: string): T`
- `hasParam(key: string): boolean`
- `getParamKeys(): string[]`
- `setParam(key: string, value: any): void`
- `setParams(params: Record<string, any>): void`
- `setParamIfNotExists(key: string, value: any): void`
- `setNumberParam(key: string, value: any): void`
- `setNullableParam(key: string, value: any): void`
- `removeParam(key: string): void`
- `clearParams(): void`
- `removeParamIf(key: string, predicate: (value: any) => boolean): void`
- `removeParamsIf(predicate: (key: string, value: any) => boolean): void`
- `toggleParam(key: string, valueA: any, valueB: any): void`
- `toggleBoolean(key: string): void`
- `cycleParam(key: string, values: any[]): void`
- `appendToListParam<T = any>(key: string, item: T): void`
- `removeFromListParam<T = any>(key: string, item: T): void`
- `onParamsChange(): Observable<Record<string, any>>`
- `onParamChange<T>(key: string): Observable<T | undefined>`
- `UrlParamsRouteDirective` (attribute directive to register host route)
- `URL_PARAMS_REGISTER_ROUTE_PROVIDER` (provider for DI-first registration)

## Behavior notes

- The service keeps an internal `BehaviorSubject` as the single source of param state and exposes observables to read changes.
- URL writes only occur when a `Router` and `ActivatedRoute` are available and the service has been initialized (via `init()`, `registerRoute()`, the `urlParamsRoute` directive, or the `URL_PARAMS_REGISTER_ROUTE_PROVIDER`). Writes are performed only in the browser (SSR-safe).
- When initialized with a route context the service:
  - synchronizes state from `ActivatedRoute.snapshot.queryParams` (merging into the internal state);
  - subscribes to `route.queryParams` to keep internal state in sync with navigation (back/forward);
  - persists internal state changes to the URL using `router.navigate([], { relativeTo: route, queryParams, queryParamsHandling: 'merge', replaceUrl: true })`.
- To avoid unnecessary navigations, the service uses change-comparison (`distinctUntilChanged` over serialized params) before writing to the router.


## Examples

```ts
urlParams.appendToListParam('tags', 'beta');
urlParams.removeFromListParam('tags', 'beta');

urlParams.removeParamIf('page', v => Number(v) === 1);

urlParams.onParamsChange().subscribe(params => {
  // react to param changes
});
```

## Contributing

Contributions welcome. Open issues/PRs with tests and clear rationale.

## License

MIT
