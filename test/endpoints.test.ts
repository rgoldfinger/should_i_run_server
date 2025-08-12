import { test, describe, mock } from "node:test";
import { strict as assert } from "node:assert";
import worker from "../src/index.ts";
import { testStations, testRoutes } from "./testData.ts";

const mockEnv = {
  BART_CACHE: {
    get: mock.fn((key: string) => {
      if (key === "stations") {
        return Promise.resolve(JSON.stringify(testStations));
      }
      if (key === "routes") {
        return Promise.resolve(JSON.stringify(testRoutes));
      }
      return Promise.resolve(null);
    }),
    put: mock.fn(() => Promise.resolve()),
  } as any
};
const mockCtx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
};

describe("HTTP Method & Route Handling", () => {
  test("should return 404 for GET on /bart", async () => {
    const request = new Request("http://localhost/bart", { method: "GET" });
    const response = await worker.fetch(
      request,
      mockEnv as any,
      mockCtx as any
    );

    assert.strictEqual(response.status, 404);
    assert.strictEqual(await response.text(), "404");
  });

  test("should return 404 for unsupported endpoints", async () => {
    const request = new Request("http://localhost/unknown", { method: "POST" });
    const response = await worker.fetch(
      request,
      mockEnv as any,
      mockCtx as any
    );

    assert.strictEqual(response.status, 404);
    assert.strictEqual(await response.text(), "404");
  });
});

describe("POST /bart Endpoint", () => {
  test("should handle valid location input", async () => {
    const originalFetch = global.fetch;
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
    global.fetch = mock.fn(() => Promise.resolve(mockApiResponse as any));

    try {
      const location = { lat: 37.803768, lng: -122.27145 };
      const request = new Request("http://localhost/bart", {
        method: "POST",
        body: JSON.stringify(location),
      });

      const response = await worker.fetch(
        request,
        mockEnv as any,
        mockCtx as any
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(
        response.headers.get("content-type"),
        "application/json;charset=UTF-8"
      );

      const data = await response.json();
      assert.ok(Array.isArray(data));
      assert.strictEqual(data.length, 2); // Should return 2 closest stations
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("should handle invalid JSON in request body", async () => {
    const request = new Request("http://localhost/bart", {
      method: "POST",
      body: "invalid json",
    });

    await assert.rejects(
      () => worker.fetch(request, mockEnv as any, mockCtx as any),
      SyntaxError
    );
  });
});

describe("POST /directions Endpoint", () => {
  test("should handle valid trip array input", async () => {
    const originalFetch = global.fetch;
    const mockApiResponse = {
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
    global.fetch = mock.fn(() => Promise.resolve(mockApiResponse as any));

    try {
      const trips = [{ startCode: "DUBL", endCode: "DALY" }];
      const request = new Request("http://localhost/directions", {
        method: "POST",
        body: JSON.stringify(trips),
      });

      const response = await worker.fetch(
        request,
        mockEnv as any,
        mockCtx as any
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(
        response.headers.get("content-type"),
        "application/json;charset=UTF-8"
      );

      const data = await response.json();
      assert.ok(Array.isArray(data));
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe("GET /stations Endpoint", () => {
  test("should return station names in the correct format", async () => {
    const request = new Request("http://localhost/stations", { method: "GET" });
    const response = await worker.fetch(
      request,
      mockEnv as any,
      mockCtx as any
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.headers.get("content-type"),
      "application/json;charset=UTF-8"
    );

    const data = await response.json();
    assert.ok(typeof data === "object");
    assert.strictEqual(data["12TH"], "12th St. Oakland City Center");
    assert.strictEqual(data["16TH"], "16th St. Mission");
    assert.strictEqual(data["19TH"], "19th St. Oakland");
    assert.strictEqual(data["ASHB"], "Ashby");
    assert.strictEqual(data["WCRK"], "Walnut Creek");
  });
});
