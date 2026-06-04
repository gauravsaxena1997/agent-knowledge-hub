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
      id: "person:owner",
      kind: KnowledgeNodeKind.ENTITY,
      label: "Example Engineer",
      body: "Senior full-stack engineer focused on retrieval systems and TypeScript.",
      tags: ["engineering"],
      metadata: {},
      sourceIds: ["source:team-notes"],
      confidence: ConfidenceLevel.USER_CONFIRMED,
      freshness: "fresh",
      embeddingState: "pending",
    });

    await indexer.indexNode({
      id: "company:highlevel",
      kind: KnowledgeNodeKind.ENTITY,
      label: "Northstar Cloud",
      body: "Cloud software company evaluating agent-ready knowledge infrastructure.",
      tags: ["company"],
      metadata: {},
      sourceIds: [],
      confidence: ConfidenceLevel.IMPORTED,
      freshness: "fresh",
      embeddingState: "pending",
    });

    await graphStore.upsertEdge({
      id: "edge:owner-applied-highlevel",
      fromId: "person:owner",
      toId: "company:highlevel",
      kind: KnowledgeEdgeKind.APPLIED_TO,
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
    expect(hits[0]?.relatedEdges.some((edge) => edge.kind === KnowledgeEdgeKind.APPLIED_TO)).toBe(true);
  });
});
