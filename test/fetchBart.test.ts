import { test, describe, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { getDistance, getClosestStations, type Location } from '../src/fetchBart.ts';
import { testStations } from './testData.ts';

// Mock environment for testing
const mockEnv = {
  BART_CACHE: {
    get: mock.fn(() => Promise.resolve(JSON.stringify(testStations))),
    put: mock.fn(() => Promise.resolve()),
  },
  ANALYTICS: {
    writeDataPoint: mock.fn(() => {}),
  }
} as any;

describe('Distance Calculation & Station Filtering', () => {
  test('should calculate distance between two coordinates', () => {
    const loc1: Location = { lat: 37.803768, lng: -122.27145 };
    const loc2: Location = { lat: 37.765062, lng: -122.419694 };
    
    const distance = getDistance(loc1, loc2);
    assert.ok(distance > 0);
    assert.ok(typeof distance === 'number');
  });

  test('should return 0 distance for same location', () => {
    const loc: Location = { lat: 37.803768, lng: -122.27145 };
    const distance = getDistance(loc, loc);
    assert.strictEqual(distance, 0);
  });

  test('should return exactly 2 closest stations', async () => {
    const userLocation: Location = { lat: 37.8, lng: -122.27 };
    const closest = await getClosestStations(userLocation, mockEnv);
    
    assert.strictEqual(closest.length, 2);
  });

  test('should return stations ordered by distance', async () => {
    const userLocation: Location = { lat: 37.803768, lng: -122.27145 }; // Near 12TH station
    const closest = await getClosestStations(userLocation, mockEnv);
    
    assert.strictEqual(closest[0]?.abbr, '12TH');
    assert.ok(closest[0]?.distance! < closest[1]?.distance!);
  });
});