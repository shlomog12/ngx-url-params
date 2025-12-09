import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { UrlParamsService } from './url-params.service';

describe('UrlParamsService', () => {
  let service: UrlParamsService;
  let routerSpy: Router;
  let routeStub: ActivatedRoute;

  beforeEach(() => {
    // Mock router
    routerSpy = {
      navigate: vi.fn(),
    } as any as Router;

    // Mock route with snapshot and queryParams observable
    routeStub = {
      snapshot: {
        queryParams: { foo: 'bar', num: '5' },
      },
      queryParams: { subscribe: vi.fn((fn: any) => fn({ foo: 'bar', num: '5' })) } as any,
    } as unknown as ActivatedRoute;

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        UrlParamsService,
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    });

    service = TestBed.inject(UrlParamsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get and set single param', () => {
    service.setParam('test', 123);
    expect(service.getParam('test')).toBe(123);
  });

  it('should get param or default when missing', () => {
    expect(service.getParamOrDefault('missing', 10)).toBe(10);
  });

  it('should return existing param value over default', () => {
    service.setParam('existing', 20);
    expect(service.getParamOrDefault('existing', 10)).toBe(20);
  });

  it('should require param and return value', () => {
    service.setParam('required', 'value');
    expect(service.requireParam('required')).toBe('value');
  });

  it('should throw error when required param is missing', () => {
    expect(() => service.requireParam('missing')).toThrow('Missing required query param: missing');
  });

  it('should check if param exists', () => {
    service.setParam('exists', 1);
    expect(service.hasParam('exists')).toBe(true);
    expect(service.hasParam('missing')).toBe(false);
  });

  it('should get non-null keys only', () => {
    service.setParam('a', 1);
    service.setParam('b', null);
    const keys = service.getParamKeys();
    expect(keys).toContain('a');
    expect(keys).not.toContain('b');
  });

  it('should set multiple params', () => {
    service.setParams({ x: 1, y: 2 });
    expect(service.getParam('x')).toBe(1);
    expect(service.getParam('y')).toBe(2);
  });

  it('should set param only if not exists', () => {
    service.setParam('key', 'original');
    service.setParamIfNotExists('key', 'new');
    expect(service.getParam('key')).toBe('original');
    service.setParamIfNotExists('newKey', 'value');
    expect(service.getParam('newKey')).toBe('value');
  });

  it('should set number param', () => {
    service.setNumberParam('num', '42');
    expect(service.getParam('num')).toBe(42);
  });

  it('should set nullable param (empty string as null)', () => {
    service.setNullableParam('empty', '');
    expect(service.getParam('empty')).toBeNull();
    service.setNullableParam('value', 'test');
    expect(service.getParam('value')).toBe('test');
  });

  it('should remove param by setting to null', () => {
    service.setParam('toRemove', 'value');
    service.removeParam('toRemove');
    expect(service.getParam('toRemove')).toBeNull();
  });

  it('should clear all params', () => {
    service.setParams({ a: 1, b: 2, c: 3 });
    service.clearParams();
    expect(service.getParams()).toEqual({});
  });

  it('should remove param if predicate matches', () => {
    service.setParam('num', 5);
    service.removeParamIf('num', (v) => v === 5);
    expect(service.getParam('num')).toBeNull();
  });

  it('should remove multiple params if predicate matches', () => {
    service.setParams({ a: 1, b: 2, c: 3 });
    service.removeParamsIf((k, v) => v > 1);
    expect(service.getParam('a')).toBe(1);
    expect(service.getParam('b')).toBeNull();
    expect(service.getParam('c')).toBeNull();
  });

  it('should toggle param between two values', () => {
    service.setParam('toggle', 'a');
    service.toggleParam('toggle', 'a', 'b');
    expect(service.getParam('toggle')).toBe('b');
    service.toggleParam('toggle', 'a', 'b');
    expect(service.getParam('toggle')).toBe('a');
  });

  it('should toggle boolean param', () => {
    service.setParam('bool', true);
    service.toggleBoolean('bool');
    expect(service.getParam('bool')).toBe(false);
    service.toggleBoolean('bool');
    expect(service.getParam('bool')).toBe(true);
  });

  it('should cycle param through values', () => {
    service.setParam('cycle', 'x');
    service.cycleParam('cycle', ['x', 'y', 'z']);
    expect(service.getParam('cycle')).toBe('y');
    service.cycleParam('cycle', ['x', 'y', 'z']);
    expect(service.getParam('cycle')).toBe('z');
    service.cycleParam('cycle', ['x', 'y', 'z']);
    expect(service.getParam('cycle')).toBe('x');
  });

  it('should cycle param starting from beginning if not in list', () => {
    service.setParam('cycle', 'unknown');
    service.cycleParam('cycle', ['a', 'b', 'c']);
    expect(service.getParam('cycle')).toBe('a');
  });

  it('should append items to list param', () => {
    service.appendToListParam('list', 1);
    service.appendToListParam('list', 2);
    expect(service.getParam('list')).toEqual([1, 2]);
  });

  it('should remove items from list param', () => {
    service.setParam('list', [1, 2, 3]);
    service.removeFromListParam('list', 2);
    expect(service.getParam('list')).toEqual([1, 3]);
  });

  it('should get all params excluding null values', () => {
    service.setParams({ a: 1, b: null, c: 3 });
    const params = service.getParams();
    expect(params).toEqual({ a: 1, c: 3 });
    expect(params).not.toHaveProperty('b');
  });

  it('should observe single param changes (distinct)', async () => {
    let emittedValue: any = undefined;
    const subscription = service.onParamChange('tracked').subscribe((value) => {
      emittedValue = value;
    });
    
    service.setParam('tracked', 'first');
    
    // Wait for debounce and verify the value changed
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(emittedValue).toBe('first');
    
    service.setParam('tracked', 'second');
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(emittedValue).toBe('second');
    
    subscription.unsubscribe();
  });

  it('should sync from route snapshot', () => {
    service.init(routerSpy, routeStub);
    (routeStub.snapshot as any).queryParams = { foo: 'updated', num: '100' };
    service.syncFromRoute();
    expect(service.getParam('foo')).toBe('updated');
    expect(service.getParam('num')).toBe('100');
  });

  it('should initialize and sync with router and route', () => {
    service.init(routerSpy, routeStub);
    expect(service.getParam('foo')).toBe('bar');
  });
});