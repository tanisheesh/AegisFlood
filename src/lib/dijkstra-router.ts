import {
  type ComputedEvacuationRoute,
  NEAR_FLOOD_BUFFER_M,
  NEAR_FLOOD_WEIGHT_PENALTY,
  ROAD_EDGES,
  type RoadEdge,
  WAYPOINTS,
  type WaypointNode,
} from "@/lib/basin-config";

export interface RoadEdgeStatus extends RoadEdge {
  isSubmerged: boolean;
  isNearFlood: boolean;
  effectiveWeightKm: number;
}

export interface DijkstraEvacuationResult {
  routes: ComputedEvacuationRoute[];
  edgeStatuses: RoadEdgeStatus[];
}

export function computeDijkstraEvacuation(
  nodeLevels: Record<string, number>,
  waypoints: Record<string, WaypointNode> = WAYPOINTS,
  edges: RoadEdge[] = ROAD_EDGES,
): DijkstraEvacuationResult {
  const adj: Record<
    string,
    Array<{ to: string; weight: number; roadName: string; isSubmerged: boolean }>
  > = {};

  const waypointIds = Object.keys(waypoints);
  for (const id of waypointIds) {
    adj[id] = [];
  }

  const edgeStatuses: RoadEdgeStatus[] = edges.map((edge) => {
    const level = edge.monitoredByNode !== null ? (nodeLevels[edge.monitoredByNode] ?? 0) : 0;
    const isSubmerged = edge.monitoredByNode !== null && level >= edge.submergeLevelM;
    const isNearFlood =
      !isSubmerged &&
      edge.monitoredByNode !== null &&
      level >= edge.submergeLevelM - NEAR_FLOOD_BUFFER_M;

    const penalty = isSubmerged ? Infinity : isNearFlood ? NEAR_FLOOD_WEIGHT_PENALTY : 1.0;
    const effectiveWeightKm = isSubmerged
      ? Infinity
      : Number((edge.distanceKm * penalty).toFixed(2));

    if (adj[edge.from] && adj[edge.to]) {
      adj[edge.from].push({
        to: edge.to,
        weight: effectiveWeightKm,
        roadName: edge.name,
        isSubmerged,
      });
      adj[edge.to].push({
        to: edge.from,
        weight: effectiveWeightKm,
        roadName: edge.name,
        isSubmerged,
      });
    }

    return {
      ...edge,
      isSubmerged,
      isNearFlood,
      effectiveWeightKm,
    };
  });

  const shelters = Object.values(waypoints)
    .filter((w) => w.type === "shelter")
    .map((w) => w.id);
  const villages = Object.values(waypoints).filter((w) => w.type === "village");

  const routes: ComputedEvacuationRoute[] = villages.map((village) => {
    const dist: Record<string, number> = {};
    const prev: Record<string, { parent: string; road: string } | null> = {};
    const visited = new Set<string>();

    for (const id of waypointIds) {
      dist[id] = Infinity;
      prev[id] = null;
    }
    dist[village.id] = 0;

    while (visited.size < waypointIds.length) {
      let current: string | null = null;
      let bestDist = Infinity;
      for (const id of waypointIds) {
        if (!visited.has(id) && dist[id] < bestDist) {
          bestDist = dist[id];
          current = id;
        }
      }
      if (current === null || bestDist === Infinity) {
        break;
      }
      visited.add(current);

      for (const neighbor of adj[current]) {
        if (neighbor.isSubmerged || neighbor.weight === Infinity) {
          continue;
        }
        const candidate = dist[current] + neighbor.weight;
        if (candidate < dist[neighbor.to]) {
          dist[neighbor.to] = candidate;
          prev[neighbor.to] = { parent: current, road: neighbor.roadName };
        }
      }
    }

    let bestShelter = shelters[0] ?? "";
    for (const shelterId of shelters) {
      if (dist[shelterId] < dist[bestShelter]) {
        bestShelter = shelterId;
      }
    }

    const reachable = bestShelter !== "" && Number.isFinite(dist[bestShelter]);
    const pathNodes: string[] = [];
    const roadNames: string[] = [];

    if (reachable) {
      let cursor: string | null = bestShelter;
      while (cursor !== null) {
        pathNodes.unshift(cursor);
        const step: { parent: string; road: string } | null = prev[cursor];
        if (step !== null) {
          roadNames.unshift(step.road);
          cursor = step.parent;
        } else {
          cursor = null;
        }
      }
    }

    const directEdgeSubmerged = edgeStatuses.some(
      (e) => (e.from === village.id || e.to === village.id) && (e.isSubmerged || e.isNearFlood),
    );

    return {
      villageId: village.id,
      villageName: village.name,
      population: village.population ?? 2000,
      shelterId: reachable ? bestShelter : "UNREACHABLE",
      shelterName: reachable ? waypoints[bestShelter].name : "NO PASSABLE ROAD // AIRLIFT",
      pathNodes,
      roadNames,
      effectiveCostKm: reachable ? Number(dist[bestShelter].toFixed(2)) : Infinity,
      rerouted: directEdgeSubmerged,
      reachable,
      status: !reachable
        ? "ISOLATED // AIRLIFT REQUIRED"
        : directEdgeSubmerged
          ? "REROUTED // HIGH-GROUND BYPASS"
          : "NOMINAL // SHORTEST PATH",
    };
  });

  return { routes, edgeStatuses };
}
