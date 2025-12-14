import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { UrlParamsService } from './url-params.service';
import { UrlParamsRouteDirective } from './url-params-route.directive';

@Component({ standalone: true, imports: [UrlParamsRouteDirective], template: `<div urlParamsRoute></div>` })
class HostComponent {}

describe('UrlParamsRouteDirective', () => {
  let service: UrlParamsService;
  let routeStub: ActivatedRoute;

  beforeEach(() => {
    routeStub = {
      snapshot: { queryParams: { x: 'y' } },
      queryParams: { subscribe: (fn: any) => fn({ x: 'y' }) },
    } as any as ActivatedRoute;

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [UrlParamsService, { provide: ActivatedRoute, useValue: routeStub }],
    });

    service = TestBed.inject(UrlParamsService);
  });

  it('registers the route when directive is instantiated', () => {
    // Create the directive via component instantiation
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    // The service should now have merged the route snapshot params
    expect(service.getParam('x')).toBe('y');
  });
});
