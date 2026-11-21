import { describe, expect, it } from "vitest";
import {
  computeDijkstraEvacuation,
  NEAR_FLOOD_WEIGHT_PENALTY,
  ROAD_EDGES,
  type RoadEdge,
  WAYPOINTS,
  type WaypointNode,
} from "@/lib/aegisflood-data";

describe("computeDijkstraEvacuation", () => {
  it("computes nominal shortest paths from all 4 floodplain zones to high-ground shelters", () => {
    const nominalLevels = {
      "NODE-01": 3.4,
      "NODE-02": 3.1,
      "NODE-03": 2.9,
      "NODE-04": 2.75,
      "NODE-05": 2.5,
    };

    const { routes, edgeStatuses } = computeDijkstraEvacuation(nominalLevels);

    expect(routes).toHaveLength(4);
    expect(edgeStatuses).toHaveLength(ROAD_EDGES.length);
    expect(edgeStatuses.every((e) => !e.isSubmerged && !e.isNearFlood)).toBe(true);

    const v1 = routes.find((r) => r.villageId === "V1");
    const v3 = routes.find((r) => r.villageId === "V3");
    expect(v1?.shelterId).toBe("S1");
    expect(v1?.pathNodes).toEqual(["V1", "J1", "S1"]);
    expect(v1?.effectiveCostKm).toBe(3.3);
    expect(v1?.rerouted).toBe(false);
    expect(v1?.reachable).toBe(true);

    expect(v3?.shelterId).toBe("S2");
    expect(v3?.pathNodes).toEqual(["V3", "J3", "S2"]);
    expect(v3?.effectiveCostKm).toBe(4.0);
  });

  it("applies the 3.2x proximity weight penalty within 0.65m of bridge submergence", () => {
    // E10 (V3 -> J3) submerges at 5.0m; at 4.5m E10 is near-flood while E11 (5.2m) is still clear
    const mid = computeDijkstraEvacuation({
      "NODE-01": 3.4,
      "NODE-02": 3.1,
      "NODE-03": 4.5,
      "NODE-04": 2.75,
    });

    const e10 = mid.edgeStatuses.find((e) => e.id === "E10");
    expect(e10?.isSubmerged).toBe(false);
    expect(e10?.isNearFlood).toBe(true);
    expect(e10?.effectiveWeightKm).toBe(Number((1.8 * NEAR_FLOOD_WEIGHT_PENALTY).toFixed(2)));

    const v3Mid = mid.routes.find((r) => r.villageId === "V3");
    expect(v3Mid?.rerouted).toBe(true);
    expect(v3Mid?.pathNodes).toEqual(["V3", "J5", "S2"]);
    expect(v3Mid?.effectiveCostKm).toBe(4.6);

    // At 4.6m both E10 (5.0m) and E11 (5.2m) incur the 3.2x penalty -> routes onto J4 elevated ramp
    const high = computeDijkstraEvacuation({
      "NODE-01": 3.4,
      "NODE-02": 3.1,
      "NODE-03": 4.6,
      "NODE-04": 2.75,
    });
    const v3High = high.routes.find((r) => r.villageId === "V3");
    expect(v3High?.rerouted).toBe(true);
    expect(v3High?.pathNodes).toEqual(["V3", "J4", "S2"]);
    expect(v3High?.effectiveCostKm).toBe(5.0);
  });

  it("prunes submerged bridges with infinite weight and reroutes onto elevated highway bypasses", () => {
    const severeLevels = {
      "NODE-01": 6.5,
      "NODE-02": 6.1,
      "NODE-03": 5.8,
      "NODE-04": 5.5,
    };

    const { routes, edgeStatuses } = computeDijkstraEvacuation(severeLevels);

    const submergedIds = edgeStatuses.filter((e) => e.isSubmerged).map((e) => e.id);
    expect(submergedIds).toEqual(
      expect.arrayContaining(["E01", "E02", "E05", "E06", "E07", "E10", "E11", "E13", "E14"]),
    );

    const v1 = routes.find((r) => r.villageId === "V1");
    const v2 = routes.find((r) => r.villageId === "V2");
    const v3 = routes.find((r) => r.villageId === "V3");
    const v4 = routes.find((r) => r.villageId === "V4");

    expect(v1?.pathNodes).toEqual(["V1", "J2", "S1"]);
    expect(v2?.pathNodes).toEqual(["V2", "J4", "S2"]);
    expect(v3?.pathNodes).toEqual(["V3", "J4", "S2"]);
    expect(v4?.pathNodes).toEqual(["V4", "J6", "S3"]);
    expect(routes.every((r) => r.rerouted && r.reachable)).toBe(true);
  });

  it("reports an isolated zone cleanly when all outbound bridges are submerged", () => {
    const isolatedWaypoints: Record<string, WaypointNode> = {
      V1: WAYPOINTS.V1,
      S1: WAYPOINTS.S1,
    };
    const singleFloodedEdge: RoadEdge[] = [
      {
        id: "E_ONLY",
        from: "V1",
        to: "S1",
        name: "Submerged Causeway",
        distanceKm: 1.5,
        monitoredByNode: "NODE-01",
        submergeLevelM: 4.0,
      },
    ];

    const { routes } = computeDijkstraEvacuation(
      { "NODE-01": 4.2 },
      isolatedWaypoints,
      singleFloodedEdge,
    );

    expect(routes).toHaveLength(1);
    expect(routes[0].reachable).toBe(false);
    expect(routes[0].effectiveCostKm).toBe(Infinity);
    expect(routes[0].pathNodes).toEqual([]);
    expect(routes[0].status).toContain("AIRLIFT");
  });
});
