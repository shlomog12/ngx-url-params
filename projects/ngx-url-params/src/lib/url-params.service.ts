import { isPlatformBrowser } from '@angular/common';
import { Injectable, Inject, Injector, OnDestroy, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, map, Observable, Subscription } from 'rxjs';

/**
 * Service to manage URL query parameters with reactive APIs.
 * - Queue-based synchronization for reliable updates
 * - Safe for SSR (no Router/ActivatedRoute usage on the server)
 * - Small, well-typed public surface for library consumers
 */
@Injectable({ providedIn: 'root' })
export class UrlParamsService implements OnDestroy {

  /** Internal subject holding the current query params state */
  private paramsState$ = new BehaviorSubject<Record<string, any>>({});
  
  /** Queue-based update system */
  private updateQueue: Array<() => void> = [];
  private isProcessing: boolean = false;
  
  private router: Router | null = null;
  private route: ActivatedRoute | null = null;
  private initialized = false;
  private routeQuerySub: Subscription | null = null;
  private paramsChangeSub: Subscription | null = null;
  private routeRegistered$ = new BehaviorSubject<boolean>(false);

  /** Injector is used to lazily resolve Router/ActivatedRoute so consumers don't need to pass them. */
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private injector: Injector
  ) {
    // Try to auto-initialize when running in the browser and when Router is available
    // This keeps the public API ergonomic: consumers do not need to call `init(router, route)`.
    // We keep `init(router, route)` for backward compatibility.
    if (isPlatformBrowser(this.platformId)) {
      this.tryAutoInit();
    }
  }

  /**
   * Initialize the service.
   *
   * Both parameters are optional for backward compatibility. When omitted the
   * service will attempt to resolve `Router` and `ActivatedRoute` from the
   * application's injector (if available).
   *
   * @deprecated Use `registerRoute()` or the `urlParamsRoute` directive /
   * `URL_PARAMS_REGISTER_ROUTE_PROVIDER` instead. `init()` will remain for
   * backwards compatibility but may be removed in a future major release.
   * @since 1.0.0
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for backward compatibility
  init(router?: Router | null, route?: ActivatedRoute | null): void {
    if (this.initialized) return;

    // Accept explicit router/route (backwards compatible), otherwise resolve lazily
    this.router = router ?? this.tryGet(Router);
    this.route = route ?? this.tryGet(ActivatedRoute);

    // Only wire routing in a browser environment
    if (!isPlatformBrowser(this.platformId) || !this.route) {
      this.initialized = true;
      return;
    }
    this.initializeWith(this.router as any, this.route as any);
  }

  /**
   * Internal initialization routine that wires route snapshot sync and
   * subscriptions when a `Router` and `ActivatedRoute` are available and
   * the app is running in the browser.
   */
  private initializeWith(router: Router, route: ActivatedRoute): void {
    if (this.initialized) return;

    // Keep references on the instance so later calls (eg. syncFromRoute)
    // can access the currently-registered route/router.
    this.router = router;
    this.route = route;

    // Initialize state from current route snapshot (no navigation triggered)
    this.syncFromRoute();

    // Subscribe to route changes so the service follows external navigation (back/forward)
    this.routeQuerySub = route.queryParams.subscribe(qp => {
      const cleaned = qp || {};
      const merged = { ...this.paramsState$.value, ...cleaned };
      if (JSON.stringify(merged) !== JSON.stringify(this.paramsState$.value)) {
        // Update internal state directly to avoid triggering a navigation loop
        this.paramsState$.next(merged);
      }
    });

    // Mark that a route context is now registered
    this.routeRegistered$.next(true);

    // Subscribe to internal param changes and write them to the URL
    this.paramsChangeSub = this.onParamsChange()
      .pipe(distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(params => {
        if (!router || !route) return;
        router.navigate([], {
          relativeTo: route,
          queryParams: params,
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });

    this.initialized = true;
  }

  /**
   * Convenience helper to register a component-local `ActivatedRoute` with
   * the service. This is non-breaking and preferred over removing `init()` —
   * it allows components to opt into a specific route context without
   * needing to provide a `Router` instance.
   */
  public registerRoute(route: ActivatedRoute): void {
    this.route = route;
    // Merge the current route snapshot into internal state immediately
    // (safe on server and browser) so components see the params right away.
    this.syncFromRoute();

    // Ensure the router is resolved (lazy) and initialize subscriptions
    if (!this.router) {
      this.router = this.tryGet(Router);
    }

    // Only set up full routing subscriptions if possible (router + route available)
    if (this.router && this.route && isPlatformBrowser(this.platformId)) {
      this.initializeWith(this.router as any, this.route as any);
    }

    // Notify listeners the component registered its route
    this.routeRegistered$.next(true);
  }

  /**
   * Returns an observable that emits when a route context has been registered.
   * Consumers can subscribe to this to detect when `registerRoute()` has been
   * called and the service has synchronized params from a route snapshot.
   */
  public onRouteRegistered(): Observable<boolean> {
    return this.routeRegistered$.asObservable();
  }

  /**
   * Clean up any active subscriptions when the service is destroyed.
   */
  public ngOnDestroy(): void {
    this.routeQuerySub?.unsubscribe();
    this.paramsChangeSub?.unsubscribe();
    this.routeRegistered$.complete();
  }

  /** Process the update queue in FIFO order */
  private processQueue(): void {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const operation = this.updateQueue.shift();

    if (operation) {
      operation();
    }

    this.isProcessing = false;

    // Continue processing if there are more items in the queue
    if (this.updateQueue.length > 0) {
      this.processQueue();
    }
  }

  /** Enqueue an update operation */
  private enqueueUpdate(operation: () => void): void {
    this.updateQueue.push(operation);
    this.processQueue();
  }

  // ========================
  // GETTERS / CHECKS
  // ========================

  /** Returns the full params object with non-null values */
  public getParams(): Record<string, any> {
    return Object.fromEntries(
      Object.entries(this.paramsState$.value).filter(([_, value]) => value !== null)
    );
  }

  /** Returns a specific param by key, or null if not set */
  public getParam<T = any>(key: string): T | null {
    return this.paramsState$.value[key] ?? null;
  }

  /** Returns a param or a default value if null */
  public getParamOrDefault<T>(key: string, fallback: T): T {
    const value = this.getParam<T>(key);
    return value === null ? fallback : value;
  }

  /** Returns a required param, throws if missing */
  public requireParam<T>(key: string): T {
    const value = this.getParam<T>(key);
    if (value == null) throw new Error(`Missing required query param: ${key}`);
    return value;
  }

  /** Checks if a param exists */
  public hasParam(key: string): boolean {
    return key in this.paramsState$.value;
  }

  /** Returns all non-null keys */
  public getParamKeys(): string[] {
    return Object.keys(this.paramsState$.value).filter(k => this.paramsState$.value[k] != null);
  }

  // ========================
  // SETTERS / UPDATES
  // ========================

  /** Sets a single param */
  public setParam(key: string, value: any): void {
    this.setParams({ [key]: value });
  }

  /** Sets multiple params at once */
  public setParams(params: Record<string, any>): void {
    this.enqueueUpdate(() => {
      const updated = { ...this.paramsState$.value, ...params };
      this.paramsState$.next(updated);
    });
  }

  /** Sets a param only if it does not already exist */
  public setParamIfNotExists(key: string, value: any): void {
    if (!this.hasParam(key)) {
      this.setParam(key, value);
    }
  }

  /** Sets a number param */
  public setNumberParam(key: string, value: any): void {
    this.setParam(key, Number(value));
  }

  /** Sets a param as nullable (empty string converts to null) */
  public setNullableParam(key: string, value: any): void {
    this.setParam(key, value === '' ? null : value);
  }

  // ========================
  // REMOVE / CLEAR
  // ========================

  /** Removes a param by setting it to null */
  public removeParam(key: string): void {
    this.setParam(key, null);
  }

  /** Clears all params by setting them to null */
  public clearParams(): void {
    const keys = this.getParamKeys();
    const cleared: Record<string, any> = {};
    for (const k of keys) {
      cleared[k] = null;
    }
    this.setParams(cleared);
  }

  /** Removes a param if it satisfies a predicate */
  public removeParamIf(key: string, predicate: (value: any) => boolean): void {
    const value = this.getParam(key);
    if (predicate(value)) {
      this.removeParam(key);
    }
  }

  /** Removes multiple params satisfying a predicate */
  public removeParamsIf(predicate: (key: string, value: any) => boolean): void {
    const keys = this.getParamKeys();
    const toRemove: Record<string, any> = {};
    for (const key of keys) {
      const value = this.getParam(key);
      if (predicate(key, value)) {
        toRemove[key] = null;
      }
    }
    this.setParams(toRemove);
  }

  // ========================
  // TOGGLE / CYCLE / LIST MANIPULATIONS
  // ========================

  /** Toggle between two values for a param */
  public toggleParam(key: string, valueA: any, valueB: any): void {
    const currentValue = this.getParam(key);
    const newValue = currentValue === valueA ? valueB : valueA;
    this.setParam(key, newValue);
  }

  /** Toggles a boolean param */
  public toggleBoolean(key: string): void {
    const val = this.getParam(key);
    this.setParam(key, !val);
  }

  /** Cycles a param through a list of values */
  public cycleParam(key: string, values: any[]): void {
    const current = this.getParam(key);
    const index = values.indexOf(current);
    const next = index >= 0 ? values[(index + 1) % values.length] : values[0];
    this.setParam(key, next);
  }

  /** Appends an item to a list-type param */
  public appendToListParam(key: string, item: any): void {
    const list = this.getParam<any[]>(key) || [];
    this.setParam(key, [...list, item]);
  }

  /** Removes an item from a list-type param */
  public removeFromListParam(key: string, item: any): void {
    const list = this.getParam<any[]>(key) || [];
    this.setParam(key, list.filter(i => i !== item));
  }

  // ========================
  // OBSERVABLES / SYNC
  // ========================

  /** Returns an observable of all params changes */
  public onParamsChange(): Observable<Record<string, any>> {
    return this.paramsState$.asObservable();
  }

  /** Returns an observable for a single param's changes (distinct until changed) */
  public onParamChange<T>(key: string): Observable<T | undefined> {
    return this.onParamsChange().pipe(
      map(params => params[key]),
      distinctUntilChanged()
    );
  }

  /** Synchronizes params from the current route snapshot */
  public syncFromRoute(): void {
    const currentParams = this.route?.snapshot?.queryParams;
    if (currentParams) {
      // Update internal state directly (no navigation) and normalize empty strings to null
      const cleaned = Object.fromEntries(
        Object.entries(currentParams).map(([k, v]) => [k, v === '' ? null : v])
      );
      const merged = { ...this.paramsState$.value, ...cleaned };
      this.paramsState$.next(merged);
      // console.debug('paramsStateAfter:', this.paramsState$.value);
    }
  }

  /** Attempt to resolve a token from the injector without throwing (compat friendly). */
  private tryGet<T>(token: any): T | null {
    try {
      // Injector.get supports a fallback value in newer Angular versions but
      // to remain compatible with older versions we catch errors.
      return (this.injector as Injector).get(token as any, null as any) as T | null;
    } catch {
      return null;
    }
  }

  /** Try to auto-initialize shortly after construction when Router is available */
  private tryAutoInit(): void {
    const router = this.tryGet(Router);
    const route = this.tryGet(ActivatedRoute);
    if (router && route && isPlatformBrowser(this.platformId)) {
      // Use `any` to avoid narrow typing issues from `Injector.get` overloads
      this.initializeWith(router as any, route as any);
    }
  }
}