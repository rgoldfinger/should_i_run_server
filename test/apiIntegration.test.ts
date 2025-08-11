import { test, describe, mock } from "node:test";
import { strict as assert } from "node:assert";
import { getDeparturesForStation, type Station } from "../src/fetchBart.ts";

const mockStation: Station = {
  abbr: "12TH",
  name: "12th St. Oakland City Center",
  gtfs_latitude: 37.803768,
  gtfs_longitude: -122.27145,
};

describe("BART ETD API Integration", () => {
  test('should handle successful API response and parse "Leaving" vs numeric minutes', async () => {
    const mockApiResponse = {
      json: () =>
        Promise.resolve({
          root: {
            station: [
              {
                etd: [
                  {
                    destination: "San Francisco",
                    abbreviation: "SF",
                    estimate: [
                      {
                        minutes: "Leaving",
                        platform: "1",
                        direction: "North",
                        length: "10",
                        hexcolor: "#FF0000",
                      },
                      {
                        minutes: "5",
                        platform: "2",
                        direction: "North",
                        length: "10",
                        hexcolor: "#FF0000",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }),
    };

    const originalFetch = global.fetch;
    global.fetch = mock.fn(() => Promise.resolve(mockApiResponse as any));

    try {
      const result = await getDeparturesForStation(mockStation);

      assert.strictEqual(result.abbr, "12TH");
      assert.ok(result.lines);
      assert.strictEqual(result.lines.length, 1);
      assert.strictEqual(result.lines[0].estimates.length, 2);
      assert.strictEqual(result.lines[0].estimates[0].minutes, 0); // "Leaving" -> 0
      assert.strictEqual(result.lines[0].estimates[1].minutes, 5); // "5" -> 5
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("should handle API failures gracefully", async () => {
    const originalFetch = global.fetch;
    global.fetch = mock.fn(() => Promise.reject(new Error("Network error")));

    try {
      await assert.rejects(() => getDeparturesForStation(mockStation), Error);
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("should handle malformed API response", async () => {
    const mockApiResponse = {
      json: () => Promise.resolve({ invalid: "response" }),
    };

    const originalFetch = global.fetch;
    global.fetch = mock.fn(() => Promise.resolve(mockApiResponse as any));

    try {
      await assert.rejects(
        () => getDeparturesForStation(mockStation),
        TypeError
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});
