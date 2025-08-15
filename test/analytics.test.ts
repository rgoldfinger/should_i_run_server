import { test, describe, mock } from "node:test";
import { strict as assert } from "node:assert";
import { sendAnalytics } from "../src/analytics.ts";

describe("Analytics Service", () => {
  test("should send analytics data with explicit IDs to Analytics Engine", async () => {
    const mockWriteDataPoint = mock.fn();
    const mockEnv = {
      ANALYTICS: {
        writeDataPoint: mockWriteDataPoint,
      },
    } as any;

    const request = new Request("https://example.com", {
      headers: {
        "X-User-ID": "user123",
        "X-Session-ID": "session456",
        "User-Agent": "Mozilla/5.0",
        "CF-Connecting-IP": "192.168.1.1",
      },
    });

    sendAnalytics(mockEnv, "/bart", request);

    assert.strictEqual(mockWriteDataPoint.mock.callCount(), 1);
    const call = mockWriteDataPoint.mock.calls[0];
    const dataPoint = call.arguments[0];

    // Should have 6 blobs: endpoint, explicitUserId, explicitSessionId, identificationMethod, fallbackSessionId, fallbackUserId
    assert.strictEqual(dataPoint.blobs.length, 6);
    assert.strictEqual(dataPoint.blobs[0], "/bart"); // endpoint
    assert.strictEqual(dataPoint.blobs[1], "user123"); // explicitUserId
    assert.strictEqual(dataPoint.blobs[2], "session456"); // explicitSessionId
    assert.strictEqual(dataPoint.blobs[3], "explicit"); // identificationMethod
    assert.ok(dataPoint.blobs[4].length === 16); // fallbackSessionId (16-char hash)
    assert.ok(dataPoint.blobs[5].length === 16); // fallbackUserId (16-char hash)

    assert.strictEqual(dataPoint.doubles.length, 1);
    assert.ok(typeof dataPoint.doubles[0] === "number");

    // Should have 1 index: endpoint (Analytics Engine max: 1 index)
    assert.deepStrictEqual(dataPoint.indexes, ["/bart"]);
  });

  test("should send analytics data with fallback IDs when headers missing", async () => {
    const mockWriteDataPoint = mock.fn();
    const mockEnv = {
      ANALYTICS: {
        writeDataPoint: mockWriteDataPoint,
      },
    } as any;

    const request = new Request("https://example.com", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "CF-Connecting-IP": "192.168.1.1",
      },
    });

    sendAnalytics(mockEnv, "/bart", request);

    assert.strictEqual(mockWriteDataPoint.mock.callCount(), 1);
    const call = mockWriteDataPoint.mock.calls[0];
    const dataPoint = call.arguments[0];

    // Should have 6 blobs
    assert.strictEqual(dataPoint.blobs.length, 6);
    assert.strictEqual(dataPoint.blobs[0], "/bart"); // endpoint
    assert.strictEqual(dataPoint.blobs[1], null); // explicitUserId (null when using fallback)
    assert.strictEqual(dataPoint.blobs[2], null); // explicitSessionId (null when using fallback)
    assert.strictEqual(dataPoint.blobs[3], "fallback"); // identificationMethod
    assert.ok(dataPoint.blobs[4].length === 16); // fallbackSessionId (16-char hash)
    assert.ok(dataPoint.blobs[5].length === 16); // fallbackUserId (16-char hash)

    // Should have 1 index: endpoint
    assert.deepStrictEqual(dataPoint.indexes, ["/bart"]);
  });

  test("should generate consistent fallback user IDs for same IP and User-Agent", async () => {
    const mockWriteDataPoint = mock.fn();
    const mockEnv = {
      ANALYTICS: {
        writeDataPoint: mockWriteDataPoint,
      },
    } as any;

    const headers = {
      "User-Agent": "Mozilla/5.0",
      "CF-Connecting-IP": "192.168.1.1",
    };

    // Make two requests with same headers
    const request1 = new Request("https://example.com", { headers });
    const request2 = new Request("https://example.com", { headers });

    sendAnalytics(mockEnv, "/bart", request1);
    sendAnalytics(mockEnv, "/bart", request2);

    assert.strictEqual(mockWriteDataPoint.mock.callCount(), 2);

    const dataPoint1 = mockWriteDataPoint.mock.calls[0].arguments[0];
    const dataPoint2 = mockWriteDataPoint.mock.calls[1].arguments[0];

    // Fallback user IDs should be the same (blob5 = fallbackUserId)  
    assert.strictEqual(dataPoint1.blobs[5], dataPoint2.blobs[5]);
    // Fallback session IDs should be the same within the 30-min window (blob4 = fallbackSessionId)
    assert.strictEqual(dataPoint1.blobs[4], dataPoint2.blobs[4]);
  });

  test("should generate different fallback user IDs for different IPs", async () => {
    const mockWriteDataPoint = mock.fn();
    const mockEnv = {
      ANALYTICS: {
        writeDataPoint: mockWriteDataPoint,
      },
    } as any;

    const request1 = new Request("https://example.com", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "CF-Connecting-IP": "192.168.1.1",
      },
    });

    const request2 = new Request("https://example.com", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "CF-Connecting-IP": "192.168.1.2",
      },
    });

    sendAnalytics(mockEnv, "/bart", request1);
    sendAnalytics(mockEnv, "/bart", request2);

    assert.strictEqual(mockWriteDataPoint.mock.callCount(), 2);

    const dataPoint1 = mockWriteDataPoint.mock.calls[0].arguments[0];
    const dataPoint2 = mockWriteDataPoint.mock.calls[1].arguments[0];

    // Fallback user IDs should be different (blob5 = fallbackUserId)
    assert.notStrictEqual(dataPoint1.blobs[5], dataPoint2.blobs[5]);
    // Fallback session IDs should also be different
    assert.notStrictEqual(dataPoint1.blobs[4], dataPoint2.blobs[4]);
  });

  test("should use X-Forwarded-For when CF-Connecting-IP not available", async () => {
    const mockWriteDataPoint = mock.fn();
    const mockEnv = {
      ANALYTICS: {
        writeDataPoint: mockWriteDataPoint,
      },
    } as any;

    const request = new Request("https://example.com", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "X-Forwarded-For": "192.168.1.1, 10.0.0.1",
      },
    });

    sendAnalytics(mockEnv, "/bart", request);

    assert.strictEqual(mockWriteDataPoint.mock.callCount(), 1);
    const call = mockWriteDataPoint.mock.calls[0];
    const dataPoint = call.arguments[0];

    // Should use first IP from X-Forwarded-For and generate fallback IDs
    assert.strictEqual(dataPoint.blobs[3], "fallback");
    assert.ok(dataPoint.blobs[5].length === 16); // Should generate fallback user hash
    assert.ok(dataPoint.blobs[4].length === 16); // Should generate fallback session hash
  });
});
