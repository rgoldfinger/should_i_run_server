export const stationAbbrSynonyms: { [key: string]: string } = {
  // TODO check if this works during the daytime
  SFIA: "MLBR",
};

export function getCanonicalAbbr(abbr: string): string {
  return stationAbbrSynonyms[abbr] || abbr;
}
