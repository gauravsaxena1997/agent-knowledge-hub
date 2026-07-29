import { describe, expect, it } from "vitest";
import { ConfidenceLevel, EmbeddingState, FreshnessState, KnowledgeNodeKind, type GraphSnapshot } from "@agent-knowledge-hub/core";
import { buildForceGraph3DData, buildGraph } from "./data.js";

const graph: GraphSnapshot = {
  sources: [],
  nodes: [{
    id: "product:atlas",
    kind: KnowledgeNodeKind.ENTITY,
    label: "Atlas Platform",
    tags: ["product"],
    metadata: {},
    sourceIds: [],
    confidence: ConfidenceLevel.USER_CONFIRMED,
    freshness: FreshnessState.FRESH,
    embeddingState: EmbeddingState.INDEXED,
  }],
  edges: [],
};

describe("React graph data", () => {
  it("builds safe 2D and 3D render inputs from a portable snapshot", () => {
    const twoDimensional = buildGraph(graph, () => "#ffffff");
    const threeDimensional = buildForceGraph3DData(graph);

    expect(twoDimensional.order).toBe(1);
    expect(threeDimensional.nodes).toHaveLength(1);
    expect(threeDimensional.nodes[0]?.id).toBe("product:atlas");
  });
});
