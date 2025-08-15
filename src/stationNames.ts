import { type Env } from "./env.ts";
import { getStationNames } from "./bartApi.ts";
import { sendAnalytics, extractAnalyticsFromHeaders } from "./analytics.ts";

export async function fetchStationNames(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const analytics = extractAnalyticsFromHeaders(request);
  if (analytics) {
    ctx.waitUntil(sendAnalytics(env, "/stations", analytics));
  }
  
  const stationNames = await getStationNames(env);
  
  return new Response(JSON.stringify(stationNames), {
    status: 200,
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
}