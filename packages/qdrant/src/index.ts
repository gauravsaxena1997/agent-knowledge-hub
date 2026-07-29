import { QdrantClient } from "@qdrant/js-client-rest";
import { createHash } from "node:crypto";
import type {
  EmbeddingVector,
  KnowledgeChunk,
  VectorSearchFilter,
  VectorSearchHit,
  VectorStore,
} from "@agent-knowledge-hub/core";

export interface QdrantVectorStoreOptions {
  url: string;
  apiKey?: string;
  collection: string;
  dimensions: number;
  client?: QdrantClient;
}

type QdrantPayloadValue = string | number | boolean | string[] | null;

interface ChunkPayload {
  id: string;
  nodeId: string;
  text: string;
  order: number;
  contentHash: string;
  tags: string[];
  metadataJson: string;
}

function chunkToPayload(chunk: KnowledgeChunk): Record<string, QdrantPayloadValue> {
  return {
    id: chunk.id,
    nodeId: chunk.nodeId,
    text: chunk.text,
    order: chunk.order,
    contentHash: chunk.contentHash,
    tags: chunk.tags,
    metadataJson: JSON.stringify(chunk.metadata),
  };
}

function pointIdForChunkId(chunkId: string): string {
  const hash = createHash("sha256").update(chunkId).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function payloadToChunk(payload: Record<string, unknown> | null | undefined): KnowledgeChunk {
  const raw = (payload ?? {}) as Partial<ChunkPayload>;
  return {
    id: String(raw.id),
    nodeId: String(raw.nodeId),
    text: String(raw.text),
    order: typeof raw.order === "number" ? raw.order : 0,
    contentHash: String(raw.contentHash),
    tags: Array.isArray(raw.tags) ? raw.tags.filter((tag): tag is string => typeof tag === "string") : [],
    metadata: {},
  };
}

function buildFilter(filter?: VectorSearchFilter): object | undefined {
  const must: object[] = [];
  if (filter?.nodeIds?.length) {
    must.push({ key: "nodeId", match: { any: filter.nodeIds } });
  }
  if (filter?.tags?.length) {
    must.push({ key: "tags", match: { any: filter.tags } });
  }
  return must.length > 0 ? { must } : undefined;
}

export class QdrantVectorStore implements VectorStore {
  private readonly client: QdrantClient;
  private readonly collection: string;
  private readonly dimensions: number;

  constructor(options: QdrantVectorStoreOptions) {
    this.client = options.client ?? new QdrantClient({
      url: options.url,
      ...(options.apiKey ? { apiKey: options.apiKey } : {}),
    });
    this.collection = options.collection;
    this.dimensions = options.dimensions;
  }

  async ensureCollection(): Promise<void> {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some((collection) => collection.name === this.collection);
    if (exists) return;
    await this.client.createCollection(this.collection, {
      vectors: { size: this.dimensions, distance: "Cosine" },
    });
  }

  async upsertChunk(chunk: KnowledgeChunk, vector: EmbeddingVector): Promise<void> {
    await this.ensureCollection();
    await this.client.upsert(this.collection, {
      wait: true,
      points: [{
        id: pointIdForChunkId(chunk.id),
        vector,
        payload: chunkToPayload(chunk),
      }],
    });
  }

  async deleteChunksByNode(nodeId: string): Promise<void> {
    await this.ensureCollection();
    await this.client.delete(this.collection, {
      wait: true,
      filter: { must: [{ key: "nodeId", match: { value: nodeId } }] },
    });
  }

  async search(vector: EmbeddingVector, limit: number, filter?: VectorSearchFilter): Promise<VectorSearchHit[]> {
    await this.ensureCollection();
    const qdrantFilter = buildFilter(filter);
    const results = await this.client.search(this.collection, {
      vector,
      limit,
      with_payload: true,
      ...(qdrantFilter ? { filter: qdrantFilter } : {}),
    });
    return results.map((result) => ({
      chunk: payloadToChunk(result.payload as Record<string, unknown> | null | undefined),
      score: result.score,
    }));
  }
}
