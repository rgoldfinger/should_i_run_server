import { test, describe, mock } from "node:test";
import { strict as assert } from "node:assert";
import { sendAnalytics, extractAnalyticsFromHeaders, type AnalyticsData } from "../src/analytics.ts";

describe("Analytics Service", () => {
  test("should extract analytics data from valid headers", () => {
    const request = new Request("http://localhost/test", {
      headers: {
        "X-User-ID": "user123",
        "X-Session-ID": "session456"
      }
    });

    const analytics = extractAnalyticsFromHeaders(request);
    
    assert.strictEqual(analytics?.userId, "user123");
    assert.strictEqual(analytics?.sessionId, "session456");
  });

  test("should return null for request without analytics headers", () => {
    const request = new Request("http://localhost/test");

    const analytics = extractAnalyticsFromHeaders(request);
    
    assert.strictEqual(analytics, null);
  });

  test("should return null for missing X-User-ID header", () => {
    const request = new Request("http://localhost/test", {
      headers: {
        "X-Session-ID": "session456"
      }
    });

    const analytics = extractAnalyticsFromHeaders(request);
    
    assert.strictEqual(analytics, null);
  });

  test("should return null for missing X-Session-ID header", () => {
    const request = new Request("http://localhost/test", {
      headers: {
        "X-User-ID": "user123"
      }
    });

    const analytics = extractAnalyticsFromHeaders(request);
    
    assert.strictEqual(analytics, null);
  });

  test("should send analytics data to Analytics Engine", async () => {
    const mockWriteDataPoint = mock.fn();
    const mockEnv = {
      ANALYTICS: {
        writeDataPoint: mockWriteDataPoint
      }
    } as any;

    const analyticsData: AnalyticsData = {
      userId: "user123",
      sessionId: "session456"
    };

    await sendAnalytics(mockEnv, "/bart", analyticsData);

    assert.strictEqual(mockWriteDataPoint.mock.callCount(), 1);
    const call = mockWriteDataPoint.mock.calls[0];
    const dataPoint = call.arguments[0];
    
    assert.deepStrictEqual(dataPoint.blobs, ["/bart", "user123", "session456"]);
    assert.strictEqual(dataPoint.doubles.length, 1);
    assert.ok(typeof dataPoint.doubles[0] === "number");
    assert.deepStrictEqual(dataPoint.indexes, ["/bart"]);
  });
});