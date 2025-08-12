import { type Env } from "./env.ts";
import { getStationNames } from "./bartApi.ts";

export async function fetchStationNames(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const stationNames = await getStationNames(env);
  
  return new Response(JSON.stringify(stationNames), {
    status: 200,
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
}