import { isPlatformBrowser } from '@angular/common';
import { Injectable, Inject, Optional, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, distinctUntilChanged, map, Observable } from 'rxjs';

/**
 * Service to manage URL query parameters with reactive APIs.
 * - Debounced writes to the URL
 * - Safe for SSR (no Router/ActivatedRoute usage on the server)
 * - Small, well-typed public surface for library consumers
 */
@Injectable({ providedIn: 'root' })
export class UrlParamsService {

  /** Internal subject holding the current query params state */
  private paramsState$ = new BehaviorSubject<Record<string, any>>({});
  private debounceMs: number = 50;
 private router: Router | null = null;
  private route: ActivatedRoute | null = null;

  constructor() {}

  init(router: Router, route: ActivatedRoute): void {
    this.router = router;
    this.route = route;
    // Initialize the state from the current URL
    this.syncFromRoute();
    // Listen to changes (debounced) and update URL
    this.listenToRoute();
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
    console.log("setParam");
    this.setParams({ [key]: value });
  }

  /** Sets multiple params at once */
  public setParams(params: Record<string, any>): void {
    const updated = { ...this.paramsState$.value, ...params };
    this.paramsState$.next(updated);
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

  /** Returns an observable of all params changes (debounced) */
  public onParamsChange(): Observable<Record<string, any>> {
    return this.paramsState$.pipe(debounceTime(this.debounceMs));
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
      this.setParams(currentParams);
    }
  }
}