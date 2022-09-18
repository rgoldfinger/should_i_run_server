import { Env } from "./env";

interface Trip {
  startCode: string;
  endCode: string;
}

async function fetchTrip(trip: Trip) {
  const url = `http://api.bart.gov/api/sched.aspx?cmd=depart&json=y&date=now&orig=${trip.startCode}&dest=${trip.endCode}&key="MW9S-E7SL-26DU-VV8V"`;
  const response = await fetch(url);
  const rawResponse = await response.text();

  const responseBody: Record<string, unknown> = JSON.parse(
    rawResponse.replaceAll("@", "")
  );
  return responseBody.root.schedule.request.trip;
}

export async function fetchDirections(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // if (!request.body) {
  //     return new Response("400", {status: 400});
  // }
  const trips: Trip[] = JSON.parse(await request.text());
  console.log({ trips });
  const directions = await Promise.all(trips.map(fetchTrip));
  return new Response(JSON.stringify(directions), {
    status: 200,
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
}
