import { test, describe, mock } from "node:test";
import { strict as assert } from "node:assert";
import { fetchTrip, type Trip } from "../src/bartDirections.ts";

describe("Trip Planning API Integration", () => {
  test("should handle successful API response with route enrichment", async () => {
    const mockResponse = {
      text: () =>
        Promise.resolve(
          JSON.stringify({
            root: {
              schedule: {
                request: {
                  trip: [
                    {
                      leg: [
                        {
                          line: "ROUTE 11",
                          origin: "DUBL",
                          destination: "DALY",
                        },
                      ],
                    },
                  ],
                },
              },
            },
          })
        ),
    };

    const originalFetch = global.fetch;
    global.fetch = mock.fn(() => Promise.resolve(mockResponse as any));

    try {
      const trip: Trip = { startCode: "DUBL", endCode: "DALY" };
      const result = await fetchTrip(trip);

      assert.ok(Array.isArray(result));
      assert.ok(result.length > 0);
      assert.strictEqual(result[0].fares, null);
      assert.ok(result[0].leg);
      assert.strictEqual(result[0].leg[0].trainHeadAbbr, "DALY");
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("should handle malformed API response", async () => {
    const mockResponse = {
      text: () => Promise.resolve("invalid json"),
    };

    const originalFetch = global.fetch;
    global.fetch = mock.fn(() => Promise.resolve(mockResponse as any));

    try {
      const trip: Trip = { startCode: "DUBL", endCode: "DALY" };
      await assert.rejects(() => fetchTrip(trip), SyntaxError);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
