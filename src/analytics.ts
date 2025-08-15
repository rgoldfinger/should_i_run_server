import { type Env } from "./env.ts";

export interface AnalyticsData {
  userId: string;
  sessionId: string;
}

export interface AnalyticsEvent {
  endpoint: string;
  timestamp: number;
  userId: string;
  sessionId: string;
}

export async function sendAnalytics(
  env: Env,
  endpoint: string,
  analytics: AnalyticsData
): Promise<void> {
  const event: AnalyticsEvent = {
    endpoint,
    timestamp: Math.floor(Date.now() / 1000), // Convert milliseconds to seconds
    userId: analytics.userId,
    sessionId: analytics.sessionId,
  };

  // Store data optimized for querying
  env.ANALYTICS.writeDataPoint({
    blobs: [
      endpoint,           // blob1: endpoint for filtering/grouping
      analytics.userId,   // blob2: userId for unique user counts
      analytics.sessionId // blob3: sessionId for unique session counts
    ],
    doubles: [
      event.timestamp     // double1: timestamp in Unix seconds for time-based queries
    ],
    indexes: [
      endpoint            // index1: endpoint for efficient filtering
    ],
  });
}

export function extractAnalyticsFromHeaders(
  request: Request
): AnalyticsData | null {
  const userId = request.headers.get("X-User-ID");
  const sessionId = request.headers.get("X-Session-ID");

  if (userId && sessionId) {
    return { userId, sessionId };
  }
  return null;
}
