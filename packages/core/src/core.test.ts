import { describe, expect, it } from "vitest";
import {
  ConfidenceLevel,
  DefaultKnowledgeIndexer,
  DefaultKnowledgeRetriever,
  InMemoryGraphStore,
  InMemoryVectorStore,
  KnowledgeEdgeKind,
  KnowledgeNodeKind,
  deterministicTestEmbedding,
} from "./index.js";

describe("Agent Knowledge Hub", () => {
  it("indexes knowledge and expands graph context", async () => {
    const graphStore = new InMemoryGraphStore();
    const vectorStore = new InMemoryVectorStore();
    const indexer = new DefaultKnowledgeIndexer({
      graphStore,
      vectorStore,
      embedText: deterministicTestEmbedding,
    });
    const retriever = new DefaultKnowledgeRetriever({
      graphStore,
      vectorStore,
      embedText: deterministicTestEmbedding,
    });

    await indexer.indexNode({
      id: "team:platform",
      kind: KnowledgeNodeKind.ENTITY,
      label: "Platform Team",
      body: "Team responsible for durable retrieval infrastructure and TypeScript services.",
      tags: ["team", "engineering"],
      metadata: {},
      sourceIds: ["source:team-notes"],
      confidence: ConfidenceLevel.USER_CONFIRMED,
      freshness: "fresh",
      embeddingState: "pending",
    });

    await indexer.indexNode({
      id: "product:atlas",
      kind: KnowledgeNodeKind.ENTITY,
      label: "Atlas Platform",
      body: "Sample product that uses source-backed knowledge infrastructure.",
      tags: ["product"],
      metadata: {},
      sourceIds: [],
      confidence: ConfidenceLevel.IMPORTED,
      freshness: "fresh",
      embeddingState: "pending",
    });

    await graphStore.upsertEdge({
      id: "edge:platform-supports-atlas",
      fromId: "team:platform",
      toId: "product:atlas",
      kind: KnowledgeEdgeKind.SUPPORTS,
      metadata: {},
      sourceIds: [],
      confidence: ConfidenceLevel.IMPORTED,
    });

    const hits = await retriever.retrieve({
      query: "retrieval TypeScript engineering",
      limit: 3,
      expandDepth: 1,
    });

    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.relatedEdges.some((edge) => edge.kind === KnowledgeEdgeKind.SUPPORTS)).toBe(true);
  });
});
