export const routes = [
  {
    name: "Oakland Airport to Coliseum",
    abbr: "COLS-OAKL",
    trainOriginAbbr: "COLS",
    trainHeadAbbr: "OAKL",
    routeID: "ROUTE 19",
    number: "19",
    hexcolor: "#D5CFA3",
    color: "BEIGE",
    direction: "North",
  },
  {
    name: "Coliseum to Oakland Airport",
    abbr: "OAKL-COLS",
    trainOriginAbbr: "OAKL",
    trainHeadAbbr: "COLS",
    routeID: "ROUTE 20",
    number: "20",
    hexcolor: "#D5CFA3",
    color: "BEIGE",
    direction: "South",
  },
  {
    name: "Dublin/Pleasanton to Daly City",
    abbr: "DUBL-DALY",
    trainOriginAbbr: "DUBL",
    trainHeadAbbr: "DALY",
    routeID: "ROUTE 11",
    number: "11",
    hexcolor: "#0099CC",
    color: "BLUE",
    direction: "South",
  },
  {
    name: "Daly City to Dublin/Pleasanton",
    abbr: "DALY-DUBL",
    trainOriginAbbr: "DALY",
    trainHeadAbbr: "DUBL",
    routeID: "ROUTE 12",
    number: "12",
    hexcolor: "#0099CC",
    color: "BLUE",
    direction: "North",
  },
  {
    name: "Berryessa/North San Jose to Daly City",
    abbr: "BERY-DALY",
    trainOriginAbbr: "BERY",
    trainHeadAbbr: "DALY",
    routeID: "ROUTE 5",
    number: "5",
    hexcolor: "#339933",
    color: "GREEN",
    direction: "South",
  },
  {
    name: "Daly City to Berryessa/North San Jose",
    abbr: "DALY-BERY",
    trainOriginAbbr: "DALY",
    trainHeadAbbr: "BERY",
    routeID: "ROUTE 6",
    number: "6",
    hexcolor: "#339933",
    color: "GREEN",
    direction: "North",
  },
  {
    name: "Berryessa/North San Jose to Richmond",
    abbr: "BERY-RICH",
    trainOriginAbbr: "BERY",
    trainHeadAbbr: "RICH",
    routeID: "ROUTE 3",
    number: "3",
    hexcolor: "#FF9933",
    color: "ORANGE",
    direction: "North",
  },
  {
    name: "Richmond to Berryessa/North San Jose",
    abbr: "RICH-BERY",
    trainOriginAbbr: "RICH",
    trainHeadAbbr: "BERY",
    routeID: "ROUTE 4",
    number: "4",
    hexcolor: "#FF9933",
    color: "ORANGE",
    direction: "South",
  },
  {
    name: "Millbrae/Daly City to Richmond",
    abbr: "MLBR-RICH",
    trainOriginAbbr: "MLBR",
    trainHeadAbbr: "RICH",
    routeID: "ROUTE 8",
    number: "8",
    hexcolor: "#FF0000",
    color: "RED",
    direction: "North",
  },
  {
    name: "Richmond to Daly City/Millbrae",
    abbr: "RICH-MLBR",
    trainOriginAbbr: "RICH",
    trainHeadAbbr: "SFIA",
    // trainHeadAbbr: "MLBR", // This is what the API says, but the ETD api uses SFIA????
    routeID: "ROUTE 7",
    number: "7",
    hexcolor: "#FF0000",
    color: "RED",
    direction: "South",
  },
  {
    name: "Antioch to SFIA/Millbrae",
    abbr: "ANTC-SFIA",
    trainOriginAbbr: "ANTC",
    trainHeadAbbr: "SFIA",
    routeID: "ROUTE 1",
    number: "1",
    hexcolor: "#FFFF33",
    color: "YELLOW",
    direction: "South",
  },
  {
    name: "Millbrae/SFIA to Antioch",
    abbr: "SFIA-ANTC",
    trainOriginAbbr: "SFIA",
    trainHeadAbbr: "ANTC",
    routeID: "ROUTE 2",
    number: "2",
    hexcolor: "#FFFF33",
    color: "YELLOW",
    direction: "North",
  },
];
