# ngx-url-params

Lightweight Angular service for managing and synchronizing URL query parameters with a concise, reactive API.

## Overview

`ngx-url-params` is designed for modern Angular applications that need **reliable, predictable, and composable**
URL query parameter management.

The service exposes a small, well-typed reactive API while handling the hard parts for you:
state synchronization, browser safety (SSR), and — most importantly — **conflict‑free updates**.

At its core, `ngx-url-params` uses an **internal queue-based update engine** to guarantee deterministic behavior,
even when multiple components update query parameters at the same time.

## Installation

```bash
npm install ngx-url-params
```

## Quick start

Inject `UrlParamsService` and register a route context where `ActivatedRoute` is available.

```ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UrlParamsService } from 'ngx-url-params';

@Component({ selector: 'app-demo', template: '' })
export class DemoComponent implements OnInit {
  constructor(
    private readonly urlParams: UrlParamsService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.urlParams.registerRoute(this.route);
    this.urlParams.setParam('view', 'list');
  }
}
```

If no route context is registered, the service still works as a local reactive store
(get / set / observe) without touching the URL.

---

## Why queue-based updates matter 🚦

In real applications, URL parameters are often updated from **multiple sources**:

- UI components
- Effects or signals
- RxJS subscriptions
- Route guards or resolvers

Without coordination, these updates can easily **race** with each other:

- later updates overwrite earlier ones
- partial state is written to the URL
- navigation loops or flickering URLs occur

### The ngx-url-params solution

Every mutation (`setParam`, `setParams`, `removeParam`, `toggleParam`, etc.) is routed through an
**internal FIFO queue**:

- ✅ Updates are **serialized**, never executed concurrently
- ✅ Each operation sees the **latest resolved state**
- ✅ Bursts of synchronous updates are applied in a **stable, predictable order**
- ✅ Consumers never need to debounce, lock, or manually merge params

This guarantees that **what you set is exactly what ends up in the URL**, regardless of timing.

> Think of it as a transaction-safe layer for query parameters.

---

## Route registration options (preferred over `init()`)

`init()` is deprecated and will be removed in a future major release.

Use one of the following alternatives:

### Directive (recommended)

```html
<div urlParamsRoute>
  <!-- child content can safely use UrlParamsService -->
</div>
```

### Provider (DI-first style)

```ts
@Component({
  providers: [URL_PARAMS_REGISTER_ROUTE_PROVIDER]
})
export class MyComponent {}
```

### Imperative registration

```ts
@Component({ /* ... */ })
export class ExplicitComponent implements OnInit {
  constructor(
    private urlParams: UrlParamsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.urlParams.registerRoute(this.route);
  }
}
```

---

## Public API (summary)

- `registerRoute(route: ActivatedRoute): void`
- `onRouteRegistered(): Observable<boolean>`
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

---

## Behavior notes

- Internal state is stored in a single `BehaviorSubject` (single source of truth)
- **All write operations are serialized through an internal queue**
- URL writes occur only when a route context is registered and only in the browser (SSR-safe)
- Back/forward navigation is automatically synchronized
- Navigation writes are optimized using change comparison to avoid unnecessary updates

---

## Examples

```ts
urlParams.appendToListParam('tags', 'beta');
urlParams.removeFromListParam('tags', 'beta');

urlParams.removeParamIf('page', v => Number(v) === 1);

urlParams.onParamsChange().subscribe(params => {
  // react to param changes
});
```

---

## Contributing

Contributions welcome. Open issues and PRs with tests and clear rationale.

## License

MIT
