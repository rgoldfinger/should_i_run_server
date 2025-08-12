import { type Env } from "./env.ts";
import { getRoutes } from "./bartApi.ts";

export interface Trip {
  startCode: string;
  endCode: string;
}

export async function fetchTrip(trip: Trip, env: Env) {
  const url = `http://api.bart.gov/api/sched.aspx?cmd=depart&json=y&date=now&orig=${trip.startCode}&dest=${trip.endCode}&key=MW9S-E7SL-26DU-VV8V`;
  const response = await fetch(url);
  const rawResponse = await response.text();

  const responseBody: any = JSON.parse(rawResponse.replaceAll("@", ""));
  const tripData = responseBody.root.schedule.request.trip;
  const routes = await getRoutes(env);

  return tripData.map((t: any) => {
    return {
      ...t,
      fares: null,
      leg: t.leg.map((l: any) => {
        return {
          ...l,
          trainHeadAbbr: routes.find((r) => r.routeID == l.line)?.trainHeadAbbr,
        };
      }),
    };
  });
}

export async function fetchDirections(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const trips: Trip[] = JSON.parse(await request.text());
  const directions = await Promise.all(
    trips.map((trip) => fetchTrip(trip, env))
  );
  return new Response(JSON.stringify(directions), {
    status: 200,
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
}
