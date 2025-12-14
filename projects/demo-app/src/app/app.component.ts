import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UrlParamsService } from 'ngx-url-params';

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
      <button (click)="clear()">Clear All</button>
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

  clear() {
    this.urlParams.clearParams();
  }
}
