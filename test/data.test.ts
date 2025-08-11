import { test, describe } from "node:test";
import { strict as assert } from "node:assert";
import { testStations, testRoutes } from "./testData.ts";

describe("Data Validation", () => {
  test("should have correct Ashby station data", () => {
    const ashbyStation = testStations.find(s => s.abbr === "ASHB");
    
    assert.ok(ashbyStation, "Ashby station should exist");
    assert.strictEqual(ashbyStation.name, "Ashby", "The station should have the right name");
    assert.strictEqual(ashbyStation.city, "Berkeley", "The station should have the right city");
  });

  test("should have correct route 12 data", () => {
    const route12 = testRoutes.find(r => r.number === "12");
    
    assert.ok(route12, "Route 12 should exist");
    assert.strictEqual(route12.name, "Daly City to Dublin/Pleasanton", "The route should have the right name");
    assert.strictEqual(route12.color, "BLUE", "The route should have the right color");
    assert.strictEqual(route12.trainOriginAbbr, "DALY", "The route should have the right TrainOriginAbbr");
    assert.strictEqual(route12.trainHeadAbbr, "DUBL", "The route should have the right TrainHeadAbbr");
  });
});