import { describe, expect, it, vi } from "vitest";
import { ConfidenceLevel, EmbeddingState, FreshnessState, KnowledgeNodeKind } from "@agent-knowledge-hub/core";
import { Neo4jGraphStore } from "./index.js";

describe("Neo4jGraphStore", () => {
  it("writes validated graph nodes through an injected driver", async () => {
    const run = vi.fn().mockResolvedValue({ records: [] });
    const close = vi.fn().mockResolvedValue(undefined);
    const driver = {
      session: vi.fn(() => ({
        executeWrite: (callback: (tx: { run: typeof run }) => Promise<unknown>) => callback({ run }),
        close,
      })),
    };
    const store = new Neo4jGraphStore({
      uri: "bolt://example.invalid:7687",
      username: "neo4j",
      password: "local-only",
      driver: driver as never,
    });

    const node = await store.upsertNode({
      id: "product:atlas",
      kind: KnowledgeNodeKind.ENTITY,
      label: "Atlas Platform",
      tags: ["product"],
      metadata: {},
      sourceIds: [],
      confidence: ConfidenceLevel.USER_CONFIRMED,
      freshness: FreshnessState.FRESH,
      embeddingState: EmbeddingState.PENDING,
    });

    expect(node.id).toBe("product:atlas");
    expect(run).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });
});
