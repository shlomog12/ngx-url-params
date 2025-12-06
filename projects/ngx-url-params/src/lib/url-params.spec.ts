import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { UrlParamsService } from './url-params.service';
import { URL_PARAMS_DEBOUNCE_MS } from './url-params.config';

// Define a simple type for the mocked navigate function, which includes the mock methods.
// We use the basic Mock<T> structure for the function itself, avoiding complex constraints on the variable.
type NavigateMockFunction = ((commands: readonly any[], extras?: NavigationExtras) => Promise<boolean>) & {
    mockClear: () => void;
    toHaveBeenCalled: (number?: number) => boolean;
    toHaveBeenCalledTimes: (number: number) => boolean;
    // Add other necessary spy properties if needed (e.g., mock)
    mock: any;
};

// Define the Router spy type
type RouterSpy = Router & { navigate: NavigateMockFunction };

describe('UrlParamsService', () => {
  let service: UrlParamsService;
  let routerSpy: RouterSpy; 
  let routeStub: ActivatedRoute;
  const DEBOUNCE_TIME = 10;

  beforeEach(() => {
    // 1. Mock router, explicitly asserting the function type
    routerSpy = {
      // Create the spy and assert its type to include mockClear
      navigate: vi.fn() as unknown as NavigateMockFunction,
    } as unknown as RouterSpy;

    // 2. Mock route with snapshot
    routeStub = {
      snapshot: {
        queryParams: { foo: 'bar', num: '5' }
      }
    } as unknown as ActivatedRoute;

    // 3. Configure the Angular testing module
    TestBed.configureTestingModule({
      providers: [
        UrlParamsService,
        { provide: URL_PARAMS_DEBOUNCE_MS, useValue: DEBOUNCE_TIME },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeStub }
      ],
    });

    // 6. Inject the service within the TestBed context
    service = TestBed.inject(UrlParamsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- Tests ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize params from route snapshot', () => {
    expect(service.getParam('foo')).toBe('bar');
    expect(service.getParam('num')).toBe('5');
  });

  it('should get and set single param', () => {
    service.setParam('test', 123);
    expect(service.getParam('test')).toBe(123);
  });

  it('should get param or default', () => {
    expect(service.getParamOrDefault('missing', 10)).toBe(10);
    service.setParam('existing', 20);
    expect(service.getParamOrDefault('existing', 10)).toBe(20);
  });

  it('should require param or throw', () => {
    service.setParam('must', 'value');
    expect(service.requireParam('must')).toBe('value');
    expect(() => service.requireParam('missing')).toThrow();
  });

  it('should check if param exists', () => {
    service.setParam('exists', 1);
    expect(service.hasParam('exists')).toBe(true);
    expect(service.hasParam('missing')).toBe(false);
  });

  it('should get non-null keys', () => {
    service.setParam('a', 1);
    service.setParam('b', null);
    expect(service.getParamKeys()).toContain('a');
    expect(service.getParamKeys()).not.toContain('b');
  });

  it('should set multiple params', () => {
    service.setParams({ x: 1, y: 2 });
    expect(service.getParam('x')).toBe(1);
    expect(service.getParam('y')).toBe(2);
  });

  it('should toggle boolean', () => {
    service.setParam('bool', true);
    service.toggleBoolean('bool');
    expect(service.getParam('bool')).toBe(false);
  });

  it('should cycle param values', () => {
    service.setParam('cycle', 'x');
    service.cycleParam('cycle', ['x', 'y', 'z']);
    expect(service.getParam('cycle')).toBe('y');
    service.cycleParam('cycle', ['x', 'y', 'z']);
    expect(service.getParam('cycle')).toBe('z');
    service.cycleParam('cycle', ['x', 'y', 'z']);
    expect(service.getParam('cycle')).toBe('x');
  });

  it('should append and remove items from list param', () => {
    service.appendToListParam('list', 1);
    service.appendToListParam('list', 2);
    expect(service.getParam('list')).toEqual([1, 2]);
    service.removeFromListParam('list', 1);
    expect(service.getParam('list')).toEqual([2]);
  });

  it('should sync from route snapshot', () => {
    (routeStub.snapshot as any).queryParams = { foo: 'new', num: '10' };
    service.syncFromRoute();
    expect(service.getParam('foo')).toBe('new');
    expect(service.getParam('num')).toBe('10');
  });

  it('should call router.navigate on params change (debounced)', async () => {
    routerSpy.navigate.mockClear(); 

    service.setParam('debounceTest', 'value');
    
    expect(routerSpy.navigate).not.toHaveBeenCalled(); 

    // Wait longer than the DEBOUNCE_TIME
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_TIME + 10)); 
    
    expect(routerSpy.navigate).toHaveBeenCalledTimes(1); 
    expect(routerSpy.navigate).toHaveBeenCalledWith([], {
        relativeTo: routeStub,
        queryParams: expect.objectContaining({ debounceTest: 'value' }),
        queryParamsHandling: 'merge',
        replaceUrl: true
    });
  });
});
