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

If `init` is not called the service still offers the local reactive API (get/set/observe) but will not write to the URL.

## Public API (summary)

- `init(router: Router, route: ActivatedRoute): void`
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

## Behavior notes

- The service keeps an internal `BehaviorSubject` and provides debounced observables of param changes.
- When `init(router, route)` is called the service:
  - initializes state from `ActivatedRoute.snapshot.queryParams`;
  - subscribes to `route.queryParams` to keep internal state in sync;
  - persists state changes to the URL using `router.navigate([], { relativeTo: route, queryParams, queryParamsHandling: 'merge', replaceUrl: true })`.

## Examples

```ts
urlParams.appendToListParam('tags', 'beta');
urlParams.removeFromListParam('tags', 'beta');

urlParams.removeParamIf('page', v => Number(v) === 1);

urlParams.onParamsChange().subscribe(params => {
  // react to param changes
});
```

## Demo

A minimal demo app is included at `projects/demo-app`. From the repository root run:

```bash
npm install
npm run start:demo
```

Open http://localhost:4200 and try the UI to see query param synchronization in action.

## Contributing

Contributions welcome. Open issues/PRs with tests and clear rationale.

## License

MIT
