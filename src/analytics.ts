import { type Env } from "./env.ts";

function generateHash(input: string): string {
  // Simple hash function for fallback IDs - using a basic string hash since crypto.subtle is async
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, "0").substring(0, 16);
}

export function sendAnalytics(
  env: Env,
  endpoint: string,
  request: Request
): void {
  // Extract explicit IDs from headers
  const explicitUserId = request.headers.get("X-User-ID");
  const explicitSessionId = request.headers.get("X-Session-ID");

  // Extract client information for fallback IDs
  const userAgent = request.headers.get("User-Agent") || "";
  const clientIp =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0] ||
    "";

  // Generate fallback identifiers
  const fallbackUserId = generateHash(`${clientIp}:${userAgent}`);
  const fallbackSessionId = generateHash(
    `${clientIp}:${userAgent}:${Math.floor(Date.now() / (30 * 60 * 1000))}`
  ); // 30-min sessions

  const timestamp = Math.floor(Date.now() / 1000); // timestamp in Unix seconds for time-based queries
  const identificationMethod =
    explicitUserId && explicitSessionId ? "explicit" : "fallback";

  // Store data optimized for querying
  const dataPoint = {
    blobs: [
      endpoint, // blob1: endpoint for filtering/grouping
      explicitUserId, // blob2: userId for unique user counts (empty if using fallback)
      explicitSessionId, // blob3: sessionId for unique session counts (empty if using fallback)
      identificationMethod, // blob4: identification method for filtering
      fallbackSessionId, // blob5: fallback user ID
      fallbackUserId, // blob6: fallback user ID
    ],
    doubles: [
      timestamp, // double1: timestamp in Unix seconds for time-based queries
    ],
    indexes: [
      endpoint, // index1: endpoint for efficient filtering
      identificationMethod, // index2: identification method for efficient filtering
    ],
  };

  try {
    env.ANALYTICS.writeDataPoint(dataPoint);
  } catch (error) {
    console.error("Failed to write analytics data point:", error);
  }
}
