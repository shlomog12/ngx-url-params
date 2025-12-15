import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UrlParamsService, URL_PARAMS_REGISTER_ROUTE_PROVIDER } from 'ngx-url-params';
import { debounceTime, take } from 'rxjs';

/**
 * Demo component showcasing the main APIs of `ngx-url-params`.
 * - Calls `init(router, route)` once to connect the service to the application's Router.
 * - Shows live params via `onParamsChange()`.
 * - Provides simple controls to set / toggle / remove params.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  // providers: [URL_PARAMS_REGISTER_ROUTE_PROVIDER],
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  key = 'page';
  value = '1';
  params: Record<string, any> = {};
  beforeParams: Record<string, any> | null = null;
  afterParams: Record<string, any> | null = null;
  beforeQuery = '';
  afterQuery = '';
  routeRegistered = false;

  constructor(
    private urlParams: UrlParamsService,
  ) {}

  ngOnInit(): void {
    // this.urlParams.init(this.router, this.route);
    // Initialize the service with Router + ActivatedRoute so it can synchronize state
    // to the URL. This is required in apps where you want the library to update query params.

    // Subscribe to changes and reflect them in the UI
    this.urlParams.onParamsChange().subscribe(params => (this.params = params));

  }

  set() {
    this.urlParams.setParam(this.key, this.value);
  }

  remove() {
    this.urlParams.removeParam(this.key);
  }

  toggleBool() {
    this.urlParams.toggleBoolean('flag');
  }

  cycleTheme() {
    // cycle through 'light' | 'dark' | 'auto'
    this.urlParams.cycleParam('theme_C', ['light', 'dark', 'auto']);
  }

  appendToList() {
    this.urlParams.appendToListParam('tags', `t${Math.floor(Math.random() * 100)}`);
  }

  /**
   * Demonstrates performing multiple param updates in quick succession.
   * We capture the 'before' state, perform several calls to the library API
   * (each updating a different key) and then wait for a stable emission
   * from `onParamsChange()` (debounced) to capture the final combined state.
   * This proves that updates are composable and do not overwrite each other.
   */
  updateMultiple() {
    // Snapshot before state
    this.beforeParams = this.urlParams.getParams();
    this.beforeQuery = window.location.search;

    // Perform several updates "in parallel" (synchronously one after another)
    // The service's internal queue ensures they are applied safely and merged.
    this.urlParams.setParam('alpha', 'one');
    this.urlParams.setParam('beta', 'two');
    this.urlParams.setNumberParam('page', 3);
    this.urlParams.appendToListParam('tags1', 'multi');

    // Wait briefly for a stable emission (debounceTime(0)) then record the final state
    this.urlParams.onParamsChange().pipe(debounceTime(0), take(1)).subscribe(params => {
      this.afterParams = params;
      this.afterQuery = window.location.search;
    });
  }

  clear() {
    this.urlParams.clearParams();
  }
}
