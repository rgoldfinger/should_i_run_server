import { type Env } from "./env.ts";
import { stations } from "./stations.ts";

export type Location = { lat: number; lng: number };

export type Estimate = {
  direction: string;
  hexcolor: string;
  length: string;
  minutes: number;
  platform: string;
};

export type Line = {
  abbreviation: string;
  destination: string;
  estimates: Estimate[];
};

export type Departure = {
  estimate: Estimate;
  line: Line;
};

export type Station = {
  abbr: string;
  name: string;
  lines?: Line[];
  entrances?: Location[];
  gtfs_latitude: number;
  gtfs_longitude: number;
  //   closestEntranceLoc: Location;
  //   walkingDirections: WalkingDirections;
  departures?: Departure[];
};

export function getDistance(loc1: Location, loc2: Location): number {
  return Math.sqrt(
    Math.pow(loc1.lat - loc2.lat, 2) + Math.pow(loc1.lng - loc2.lng, 2)
  );
}

export function getClosestStations(loc: Location): Station[] {
  return stations
    .map((s) => {
      return {
        ...s,
        distance: getDistance(
          { lat: s.gtfs_latitude, lng: s.gtfs_longitude },
          loc
        ),
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2);
}

interface RawETDS {
  destination: string;
  abbreviation: string;
  estimate: Array<{
    minutes: string;
    platform: string;
    direction: string;
    length: string;
    color: string;
    hexcolor: string;
    bikeflag: string;
    delay: string;
    cancelflag: string;
    dynamicflag: string;
  }>;
}

export async function getDeparturesForStation(
  station: Station
): Promise<Station> {
  // TODO cache, current cache is 15 seconds
  const url = `http://api.bart.gov/api/etd.aspx?cmd=etd&orig=${station.abbr}&key=MW9S-E7SL-26DU-VV8V&json=y`;
  const response = await fetch(url);
  const responseJSON = await response.json();

  const etds: RawETDS[] = responseJSON.root.station[0].etd;
  const lines: Line[] = etds.map((e): Line => {
    return {
      abbreviation: e.abbreviation,
      destination: e.destination,
      estimates: e.estimate.map((est) => ({
        direction: est.direction,
        hexcolor: est.hexcolor,
        length: est.length,
        minutes:
          String(est.minutes) === "Leaving"
            ? 0
            : parseInt(String(est.minutes), 10),
        platform: est.platform,
      })),
    };
  });
  return {
    ...station,
    lines,
  };
}

export async function fetchBart(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const location: Location = JSON.parse(await request.text());
  const closestStations = getClosestStations(location);
  const stationsWithDeparturetimes = await Promise.all(
    closestStations.map(getDeparturesForStation)
  );
  const data: Station[] = stationsWithDeparturetimes;
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
}
