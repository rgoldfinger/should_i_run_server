/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { fetchDirections } from "./bartDirections.ts";
import { type Env } from "./env.ts";
import { fetchBart } from "./fetchBart.ts";
import { fetchStationNames } from "./stationNames.ts";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (request.method === "POST") {
      if (request.url.endsWith("/bart")) {
        return fetchBart(request, env, ctx);
      } else if (request.url.endsWith("/directions")) {
        return fetchDirections(request, env, ctx);
      }
    } else if (request.method === "GET") {
      if (request.url.endsWith("/stations")) {
        return fetchStationNames(request, env, ctx);
      }
    }
    return new Response("404", { status: 404 });
  },
};
