/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { fetchDirections } from "./bartDirections";
import { Env } from "./env";
import { fetchBart } from "./fetchBart";

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
    }
    return new Response("404", { status: 404 });
  },
};
``;
