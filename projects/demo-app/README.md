# ngx-url-params — Demo App

This minimal demo shows how to use the `ngx-url-params` package inside an Angular application.

Quick start

1. From the repository root run:

```bash
npm install
npm run start:demo
```

2. Open http://localhost:4200

What the demo shows

- The demo bootstraps a simple standalone `AppComponent` that calls `urlParams.init(router, route)`.
- You can set, remove, toggle and clear query params from the UI; URL is kept in sync.
- The component subscribes to `onParamsChange()` to display current params.
- Use the **Update URL Params** button to trigger several param updates in quick succession; the demo shows the before/after params and URL so you can verify they are merged correctly.
