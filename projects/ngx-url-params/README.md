# ngx-url-params

A lightweight Angular service for managing and synchronizing URL query parameters.
Supports **debounced updates**, **toggle/cycle values**, **list manipulation**, and **reactive observables**.

---

## Features

* Get, set, and remove query parameters easily
* Set parameters only if they don't exist
* Toggle between values or boolean states
* Cycle through a list of predefined values
* Append/remove items in list-type parameters
* Observe all query parameter changes (debounced)
* Observe changes to individual query parameters
* Sync state from the current route snapshot

---

## Installation

```bash
npm install ngx-url-params
```

---

## Usage

Import the service in your Angular components or services:

```ts
import { Component } from '@angular/core';
import { UrlParamsService } from 'ngx-url-params';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html'
})
export class DemoComponent {
  constructor(private urlParams: urlParamsService) {}

  ngOnInit() {
    // Get a query param
    const foo = this.urlParams.getParam('foo');

    // Set a query param
    this.urlParams.setParam('foo', 'bar');

    // Toggle a boolean param
    this.urlParams.toggleBoolean('isVisible');

    // Cycle a param through multiple values
    this.urlParams.cycleParam('mode', ['light', 'dark', 'auto']);

    // Observe changes
    this.urlParams.onParamChange('foo').subscribe(value => {
      console.log('foo changed:', value);
    });
  }
}
```

---

## API

### Getters

* `getParams(): Record<string, any>` – Returns all non-null params
* `getParam<T>(key: string): T | null` – Get a single param
* `getParamOrDefault<T>(key: string, fallback: T): T` – Get a param or fallback
* `requireParam<T>(key: string): T` – Throws if the param is missing
* `hasParam(key: string): boolean` – Checks if param exists
* `getParamKeys(): string[]` – Returns all non-null keys

### Setters

* `setParam(key: string, value: any)` – Set a single param
* `setParams(params: Record<string, any>)` – Set multiple params
* `setParamIfNotExists(key: string, value: any)` – Set if missing
* `setNumberParam(key: string, value: any)` – Convert value to number
* `setNullableParam(key: string, value: any)` – Convert empty string to `null`

### Removal

* `removeParam(key: string)` – Remove a single param
* `clearParams()` – Clear all params
* `removeParamIf(key: string, predicate: (value: any) => boolean)`
* `removeParamsIf(predicate: (key: string, value: any) => boolean)`

### Toggle / Cycle / List

* `toggleParam(key: string, valueA: any, valueB: any)` – Toggle between two values
* `toggleBoolean(key: string)` – Toggle boolean
* `cycleParam(key: string, values: any[])` – Cycle through a list
* `appendToListParam(key: string, item: any)` – Add to list param
* `removeFromListParam(key: string, item: any)` – Remove from list param

### Observables

* `onParamsChange(): Observable<Record<string, any>>` – Debounced changes
* `onParamChange<T>(key: string): Observable<T | undefined>` – Observe a single param

### Sync

* `syncFromRoute(): void` – Sync state from the current route snapshot

---

## Configuration

You can configure the debounce time by providing a value for the `URL_PARAMS_DEBOUNCE_MS` injection token:

```ts
import { NgModule } from '@angular/core';
import { URL_PARAMS_DEBOUNCE_MS } from 'ngx-url-params';

@NgModule({
  providers: [
    { provide: URL_PARAMS_DEBOUNCE_MS, useValue: 100 }
  ]
})
export class AppModule {}
```

Default debounce is **50ms**.

---

## License

MIT
