import { type Env } from "./env.ts";
import { getRoutes } from "./bartApi.ts";
import { sendAnalytics } from "./analytics.ts";
import { getCanonicalAbbr } from "./bartAbbr.ts";

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
  // console.log(routes);

  return tripData.map((t: any) => {
    return {
      ...t,
      fares: null,
      leg: t.leg.map((l: any) => {
        // console.log("line: ", l.line);
        const trainHeadAbbr = routes.find(
          (r) => r.routeID == l.line
        )?.trainHeadAbbr;
        // console.log({ trainHeadAbbr });
        return {
          ...l,
          trainHeadAbbr: trainHeadAbbr,
          // ? getCanonicalAbbr(trainHeadAbbr)
          // : undefined,
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

  sendAnalytics(env, "/directions", request);

  const directions = await Promise.all(
    trips.map((trip) => fetchTrip(trip, env))
  );
  // console.log("directions");
  // console.log(directions[1][0]);
  return new Response(JSON.stringify(directions), {
    status: 200,
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
}
