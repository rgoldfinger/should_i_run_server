import type { Env } from "./env.ts";

const BART_API_KEY = "MW9S-E7SL-26DU-VV8V";
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
const STATIONS_CACHE_KEY = "stations";
const ROUTES_CACHE_KEY = "routes";

interface Location {
  lat: number;
  lng: number;
}

interface BartStationResponse {
  name: string;
  abbr: string;
  gtfs_latitude: string;
  gtfs_longitude: string;
  address: string;
  city: string;
  county: string;
  state: string;
  zipcode: string;
}

interface BartStationsAPIResponse {
  root: {
    stations: {
      station: BartStationResponse[];
    };
  };
}

interface BartRouteResponse {
  name: string;
  abbr: string;
  routeID: string;
  number: string;
  hexcolor: string;
  color: string;
}

interface BartRoutesAPIResponse {
  root: {
    routes: {
      route: BartRouteResponse[];
    };
  };
}

interface Station {
  name: string;
  abbr: string;
  gtfs_latitude: number;
  gtfs_longitude: number;
  address: string;
  city: string;
  county: string;
  state: string;
  zipcode: string;
  entrances?: Location[];
}

interface Route {
  name: string;
  abbr: string;
  trainOriginAbbr: string;
  trainHeadAbbr: string;
  routeID: string;
  number: string;
  hexcolor: string;
  color: string;
  direction: string;
}

// Station entrances data that doesn't come from the API
const entrances: Record<string, Location[]> = {
  "12TH": [
    { lat: 37.804501, lng: -122.271252 },
    { lat: 37.804238, lng: -122.270772 },
    { lat: 37.803252, lng: -122.271736 },
    { lat: 37.803375, lng: -122.271966 },
    { lat: 37.802357, lng: -122.272301 },
    { lat: 37.802454, lng: -122.272535 },
    { lat: 37.803941, lng: -122.271312 },
  ],
  "19TH": [
    { lat: 37.808964, lng: -122.267841 },
    { lat: 37.808841, lng: -122.268503 },
    { lat: 37.808427, lng: -122.268512 },
    { lat: 37.80749, lng: -122.269092 },
    { lat: 37.806899, lng: -122.269464 },
    { lat: 37.807358, lng: -122.270033 },
  ],
  EMBR: [
    { lat: 37.793536, lng: -122.39584 },
    { lat: 37.793682, lng: -122.396025 },
    { lat: 37.792788, lng: -122.396789 },
    { lat: 37.792901, lng: -122.396995 },
    { lat: 37.792046, lng: -122.397729 },
    { lat: 37.792184, lng: -122.397928 },
  ],
  MCAR: [{ lat: 37.829356, lng: -122.266669 }],
  MONT: [
    { lat: 37.789378, lng: -122.401114 },
    { lat: 37.78919, lng: -122.401759 },
    { lat: 37.788489, lng: -122.402242 },
    { lat: 37.790529, lng: -122.400708 },
  ],
  POWL: [
    { lat: 37.786136, lng: -122.40559 },
    { lat: 37.786045, lng: -122.405405 },
    { lat: 37.785439, lng: -122.406469 },
    { lat: 37.785294, lng: -122.406331 },
    { lat: 37.78442, lng: -122.407399 },
    { lat: 37.7845, lng: -122.407643 },
    { lat: 37.783877, lng: -122.408595 },
    { lat: 37.783712, lng: -122.408359 },
  ],
};

async function fetchStationsFromAPI(): Promise<Station[]> {
  const url = `http://api.bart.gov/api/stn.aspx?cmd=stns&key=${BART_API_KEY}&json=y`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch stations: ${response.status}`);
  }

  const data: BartStationsAPIResponse = await response.json();

  return data.root.stations.station.map((s) => {
    const station: Station = {
      name: s.name,
      abbr: s.abbr,
      gtfs_latitude: parseFloat(s.gtfs_latitude),
      gtfs_longitude: parseFloat(s.gtfs_longitude),
      address: s.address,
      city: s.city,
      county: s.county,
      state: s.state,
      zipcode: s.zipcode,
    };

    // Add entrances data if available
    if (entrances[s.abbr]) {
      station.entrances = entrances[s.abbr];
    }

    return station;
  });
}

async function fetchRoutesFromAPI(): Promise<Route[]> {
  const url = `http://api.bart.gov/api/route.aspx?cmd=routes&key=${BART_API_KEY}&json=y`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch routes: ${response.status}`);
  }

  const data: BartRoutesAPIResponse = await response.json();

  return data.root.routes.route.map((r) => {
    const parts = r.abbr.split("-");
    const trainOriginAbbr = parts[0];
    const trainHeadAbbr = parts[1];

    return {
      name: r.name,
      abbr: r.abbr,
      trainOriginAbbr,
      trainHeadAbbr,
      routeID: r.routeID,
      number: r.number,
      hexcolor: r.hexcolor,
      color: r.color,
      direction: trainOriginAbbr < trainHeadAbbr ? "North" : "South", // Simple heuristic
    };
  });
}

export async function getStations(env: Env): Promise<Station[]> {
  // Try to get from cache first
  const cached = await env.BART_CACHE.get(STATIONS_CACHE_KEY);
  if (cached) {
    const cachedData = JSON.parse(cached);
    return cachedData;
  }

  // Fetch from API and cache
  const stations = await fetchStationsFromAPI();

  // Store in cache with TTL
  await env.BART_CACHE.put(STATIONS_CACHE_KEY, JSON.stringify(stations), {
    expirationTtl: CACHE_TTL,
  });

  return stations;
}

export async function getRoutes(env: Env): Promise<Route[]> {
  // Try to get from cache first
  const cached = await env.BART_CACHE.get(ROUTES_CACHE_KEY);
  if (cached) {
    const cachedData = JSON.parse(cached);
    return cachedData;
  }

  // Fetch from API and cache
  const routes = await fetchRoutesFromAPI();

  // Store in cache with TTL
  await env.BART_CACHE.put(ROUTES_CACHE_KEY, JSON.stringify(routes), {
    expirationTtl: CACHE_TTL,
  });

  return routes;
}
