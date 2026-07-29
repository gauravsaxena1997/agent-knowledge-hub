import { describe, expect, it, vi } from "vitest";
import { QdrantVectorStore } from "./index.js";

describe("QdrantVectorStore", () => {
  it("creates a missing collection and writes a portable chunk through an injected client", async () => {
    const client = {
      getCollections: vi.fn().mockResolvedValue({ collections: [] }),
      createCollection: vi.fn().mockResolvedValue(undefined),
      upsert: vi.fn().mockResolvedValue(undefined),
    };
    const store = new QdrantVectorStore({
      url: "http://127.0.0.1:6333",
      collection: "agent_knowledge_hub_test",
      dimensions: 3,
      client: client as never,
    });

    await store.upsertChunk({
      id: "chunk:atlas:0",
      nodeId: "product:atlas",
      text: "Atlas is a synthetic product record.",
      order: 0,
      contentHash: "abc123",
      tags: ["product"],
      metadata: {},
    }, [0.1, 0.2, 0.3]);

    expect(client.createCollection).toHaveBeenCalledWith("agent_knowledge_hub_test", {
      vectors: { size: 3, distance: "Cosine" },
    });
    expect(client.upsert).toHaveBeenCalledOnce();
  });
});
