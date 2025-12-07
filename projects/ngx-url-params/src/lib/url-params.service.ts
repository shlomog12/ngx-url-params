import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, distinctUntilChanged, map, Observable } from 'rxjs';

/**
 * Service for managing and synchronizing URL query parameters in Angular applications.
 * Supports debounced updates, toggling, cycling, and list manipulation.
 * SSR-compatible: gracefully handles server-side rendering without Router/ActivatedRoute.
 */
@Injectable()
export class UrlParamsService {

  /** Internal subject holding the current query params state */
  private paramsState$ = new BehaviorSubject<Record<string, any>>({});
  private debounceMs: number = 50;
  private initialized: boolean = false;
  router?: Router;
  route?: ActivatedRoute;

  constructor() {}

  init(router: Router, route: ActivatedRoute): void {
    this.router = router;
    this.route = route;
    this.ensureInitialized();
  }

  /**
   * Initialization hook — must be called once at app startup.
   * Safe for SSR because it checks platform before accessing Router/ActivatedRoute.
   */
  private ensureInitialized(): void {
    if (this.initialized) return;
    this.initialized = true;
    
    // Only initialize with Router/Route available
    if (this.router && this.route) {
      // Initialize the state from the current URL
      this.syncFromRoute();
      // Listen to changes (debounced) and update URL
      this.listenToRoute();
    }
  }

  private listenToRoute(): void {
    if ( !this.router || !this.route) return;

    this.onParamsChange().subscribe(params => {
      this.router!.navigate([], {
        relativeTo: this.route!,
        queryParams: params,
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  // ========================
  // GETTERS / CHECKS
  // ========================

  /** Returns the full params object with non-null values */
  public getParams(): Record<string, any> {
    this.ensureInitialized();
    return Object.fromEntries(
      Object.entries(this.paramsState$.value).filter(([_, value]) => value !== null)
    );
  }

  /** Returns a specific param by key, or null if not set */
  public getParam<T = any>(key: string): T | null {
    this.ensureInitialized();
    return this.paramsState$.value[key] ?? null;
  }

  /** Returns a param or a default value if null */
  public getParamOrDefault<T>(key: string, fallback: T): T {
    this.ensureInitialized();
    const value = this.getParam<T>(key);
    return value === null ? fallback : value;
  }

  /** Returns a required param, throws if missing */
  public requireParam<T>(key: string): T {
    this.ensureInitialized();
    const value = this.getParam<T>(key);
    if (value == null) throw new Error(`Missing required query param: ${key}`);
    return value;
  }

  /** Checks if a param exists */
  public hasParam(key: string): boolean {
    this.ensureInitialized();
    return key in this.paramsState$.value;
  }

  /** Returns all non-null keys */
  public getParamKeys(): string[] {
    this.ensureInitialized();
    return Object.keys(this.paramsState$.value).filter(k => this.paramsState$.value[k] != null);
  }

  // ========================
  // SETTERS / UPDATES
  // ========================

  /** Sets a single param */
  public setParam(key: string, value: any): void {
    this.ensureInitialized();
    this.setParams({ [key]: value });
  }

  /** Sets multiple params at once */
  public setParams(params: Record<string, any>): void {
    this.ensureInitialized();
    const updated = { ...this.paramsState$.value, ...params };
    this.paramsState$.next(updated);
  }

  /** Sets a param only if it does not already exist */
  public setParamIfNotExists(key: string, value: any): void {
    this.ensureInitialized();
    if (!this.hasParam(key)) {
      this.setParam(key, value);
    }
  }

  /** Sets a number param */
  public setNumberParam(key: string, value: any): void {
    this.ensureInitialized();
    this.setParam(key, Number(value));
  }

  /** Sets a param as nullable (empty string converts to null) */
  public setNullableParam(key: string, value: any): void {
    this.ensureInitialized();
    this.setParam(key, value === '' ? null : value);
  }

  // ========================
  // REMOVE / CLEAR
  // ========================

  /** Removes a param by setting it to null */
  public removeParam(key: string): void {
    this.ensureInitialized();
    this.setParam(key, null);
  }

  /** Clears all params by setting them to null */
  public clearParams(): void {
    this.ensureInitialized();
    const keys = this.getParamKeys();
    const cleared: Record<string, any> = {};
    for (const k of keys) {
      cleared[k] = null;
    }
    this.setParams(cleared);
  }

  /** Removes a param if it satisfies a predicate */
  public removeParamIf(key: string, predicate: (value: any) => boolean): void {
    this.ensureInitialized();
    const value = this.getParam(key);
    if (predicate(value)) {
      this.removeParam(key);
    }
  }

  /** Removes multiple params satisfying a predicate */
  public removeParamsIf(predicate: (key: string, value: any) => boolean): void {
    this.ensureInitialized();
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
    this.ensureInitialized();
    const currentValue = this.getParam(key);
    const newValue = currentValue === valueA ? valueB : valueA;
    this.setParam(key, newValue);
  }

  /** Toggles a boolean param */
  public toggleBoolean(key: string): void {
    this.ensureInitialized();
    const val = this.getParam(key);
    this.setParam(key, !val);
  }

  /** Cycles a param through a list of values */
  public cycleParam(key: string, values: any[]): void {
    this.ensureInitialized();
    const current = this.getParam(key);
    const index = values.indexOf(current);
    const next = index >= 0 ? values[(index + 1) % values.length] : values[0];
    this.setParam(key, next);
  }

  /** Appends an item to a list-type param */
  public appendToListParam(key: string, item: any): void {
    this.ensureInitialized();
    const list = this.getParam<any[]>(key) || [];
    this.setParam(key, [...list, item]);
  }

  /** Removes an item from a list-type param */
  public removeFromListParam(key: string, item: any): void {
    this.ensureInitialized();
    const list = this.getParam<any[]>(key) || [];
    this.setParam(key, list.filter(i => i !== item));
  }

  // ========================
  // OBSERVABLES / SYNC
  // ========================

  /** Returns an observable of all params changes (debounced) */
  public onParamsChange(): Observable<Record<string, any>> {
    this.ensureInitialized();
    return this.paramsState$.pipe(debounceTime(this.debounceMs));
  }

  /** Returns an observable for a single param's changes (distinct until changed) */
  public onParamChange<T>(key: string): Observable<T | undefined> {
    this.ensureInitialized();
    return this.onParamsChange().pipe(
      map(params => params[key]),
      distinctUntilChanged()
    );
  }

  /** Synchronizes params from the current route snapshot */
  public syncFromRoute(): void {

    
    const currentParams = this.route?.snapshot?.queryParams;
    if (currentParams) {
      this.setParams(currentParams);
    }
  }
}

// ========================
// FACTORY PROVIDER
// ========================

// ========================
// FACTORY PROVIDER
// ========================

/**
 * Factory function to create UrlParamsService with proper SSR support
 */
export function provideUrlParamsService() {
  return UrlParamsService;
}