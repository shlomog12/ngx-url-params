import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, Provider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UrlParamsService } from './url-params.service';
import { URL_PARAMS_REGISTER_ROUTE_PROVIDER } from './url-params.providers';

@Component({ template: '', providers: [URL_PARAMS_REGISTER_ROUTE_PROVIDER] })
class HostComponent {}

describe('URL_PARAMS_REGISTER_ROUTE_PROVIDER', () => {
  beforeEach(() => {
    const routeStub = {
      snapshot: { queryParams: { providerKey: 'ok' } },
      queryParams: { subscribe: (fn: any) => fn({ providerKey: 'ok' }) },
    } as unknown as ActivatedRoute;

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [UrlParamsService, { provide: ActivatedRoute, useValue: routeStub }],
    });
  });

  it('registers the route via DI provider', async () => {
    const svc = TestBed.inject(UrlParamsService);

    // The provider runs during component DI; create component to trigger it
    TestBed.createComponent(HostComponent);

    const flag = await firstValueFrom(svc.onRouteRegistered());
    expect(flag).toBe(true);
    expect(svc.getParam('providerKey')).toBe('ok');
  });
});
