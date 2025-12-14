import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UrlParamsService } from 'ngx-url-params';
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
  imports: [CommonModule, FormsModule],
  template: `
  <h1>ngx-url-params — Demo</h1>
  <div class="panel">
    <div class="row">
      <label>Key:</label>
      <input [(ngModel)]="key" placeholder="e.g. page" />
      <label>Value:</label>
      <input [(ngModel)]="value" placeholder="e.g. 1" />
      <button (click)="set()">Set</button>
      <button (click)="remove()">Remove</button>
    </div>

    <div class="row">
      <button (click)="toggleBool()">Toggle Boolean</button>
      <button (click)="cycleTheme()">Cycle Theme</button>
      <button (click)="appendToList()">Append To List</button>
      <button (click)="updateMultiple()">Update URL Params</button>
      <button (click)="clear()">Clear All</button>
    </div>

    <h3>Batch Update Demo</h3>
    <div class="row">
      <button (click)="updateMultiple()">Update URL Params (parallel)</button>
      <div style="margin-left:12px">
        <div><strong>Before params:</strong> <span class="kbd">{{ beforeParams | json }}</span></div>
        <div><strong>After params:</strong> <span class="kbd">{{ afterParams | json }}</span></div>
        <div><strong>Before URL:</strong> <span class="kbd">{{ beforeQuery }}</span></div>
        <div><strong>After URL:</strong> <span class="kbd">{{ afterQuery }}</span></div>
      </div>
    </div>

    <h3>Current Params</h3>
    <pre>{{ params | json }}</pre>
  </div>
  `,
  styles: [``]
})
export class AppComponent implements OnInit {
  key = 'page';
  value = '1';
  params: Record<string, any> = {};
  beforeParams: Record<string, any> | null = null;
  afterParams: Record<string, any> | null = null;
  beforeQuery = '';
  afterQuery = '';

  constructor(
    private urlParams: UrlParamsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Initialize the service with Router + ActivatedRoute so it can synchronize state
    // to the URL. This is required in apps where you want the library to update query params.
    this.urlParams.init(this.router, this.route);

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
    this.urlParams.cycleParam('theme', ['light', 'dark', 'auto']);
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
