import { test, describe, mock } from "node:test";
import { strict as assert } from "node:assert";
import workerHandler from "../src/index.ts";
import type { Location } from "../src/fetchBart.ts";
import type { Trip } from "../src/bartDirections.ts";
import type { Env } from "../src/env.ts";
import { testStations, testRoutes } from "./testData.ts";

const LEGACY_URL = "https://bart2.rgoldfinger.com";

const mockEnv: Env = {
  BART_CACHE: {
    get: mock.fn(() => Promise.resolve(null)), // Always cache miss to force fresh API calls
    put: mock.fn(() => Promise.resolve()),
  } as any
};

const mockContext: ExecutionContext = {
  waitUntil: () => {},
  passThroughOnException: () => {},
};

async function compareResponses(endpoint: string, body: any): Promise<void> {
  const requestBody = JSON.stringify(body);

  // Request to the workers server
  const request = new Request(`http://localhost${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: requestBody,
  });

  const workerResponse = await workerHandler.fetch(request, mockEnv, mockContext);
  const workerData = await workerResponse.json();

  // Request to the legacy server
  const legacyResponse = await fetch(LEGACY_URL + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: requestBody,
  });

  const legacyData = await legacyResponse.text();
  
  // Try to parse as JSON, handle HTML errors
  let parsedLegacyData: any;
  try {
    parsedLegacyData = JSON.parse(legacyData);
  } catch (error) {
    if (legacyData.includes("<!DOCTYPE html>")) {
      // Legacy API returned HTML error, check if current API returned empty array
      assert.deepStrictEqual(workerData, []);
      return;
    }
    throw new Error(`Failed to parse legacy response: ${error}. Body: ${legacyData}`);
  }

  // Compare responses
  assert.deepStrictEqual(workerData, parsedLegacyData);
}

describe("Legacy Comparison Tests", () => {
  describe("BART Handler", () => {
    test("Downtown SF", async () => {
      const location: Location = { lat: 37.7833, lng: -122.4167 };
      await compareResponses("/bart", location);
    });

    test("Walnut Creek", async () => {
      const location: Location = { lat: 37.906, lng: -122.065 };
      await compareResponses("/bart", location);
    });

    test("Far from any station", async () => {
      // Sacramento - far from any BART station
      const location: Location = { lat: 38.5816, lng: -121.4944 };
      await compareResponses("/bart", location);
    });
  });

  describe("Directions Handler", () => {
    test("Short trip", async () => {
      const trips: Trip[] = [
        { startCode: "EMBR", endCode: "MONT" },
      ];
      await compareResponses("/directions", trips);
    });

    test("Long trip with transfer", async () => {
      const trips: Trip[] = [
        { startCode: "MLBR", endCode: "DUBL" },
      ];
      await compareResponses("/directions", trips);
    });

    // Commented out like in the Go version
    // test("Invalid station code", async () => {
    //   const trips: Trip[] = [
    //     { startCode: "INVALID", endCode: "MONT" },
    //   ];
    //   await compareResponses("/directions", trips);
    // });
  });
});