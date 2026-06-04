import type { EmbeddingVector, VectorSearchFilter, VectorSearchHit, VectorStore } from "./contracts.js";
import type { KnowledgeChunk } from "./schema.js";

interface StoredVector {
  chunk: KnowledgeChunk;
  vector: EmbeddingVector;
}

function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < length; index += 1) {
    const av = a[index] ?? 0;
    const bv = b[index] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function passesFilter(chunk: KnowledgeChunk, filter?: VectorSearchFilter): boolean {
  if (!filter) return true;
  if (filter.nodeIds && !filter.nodeIds.includes(chunk.nodeId)) return false;
  if (filter.tags && !filter.tags.some((tag) => chunk.tags.includes(tag))) return false;
  return true;
}

export class InMemoryVectorStore implements VectorStore {
  private readonly vectors = new Map<string, StoredVector>();

  async upsertChunk(chunk: KnowledgeChunk, vector: EmbeddingVector): Promise<void> {
    this.vectors.set(chunk.id, { chunk, vector });
  }

  async deleteChunksByNode(nodeId: string): Promise<void> {
    for (const [id, item] of this.vectors.entries()) {
      if (item.chunk.nodeId === nodeId) this.vectors.delete(id);
    }
  }

  async search(vector: EmbeddingVector, limit: number, filter?: VectorSearchFilter): Promise<VectorSearchHit[]> {
    return Array.from(this.vectors.values())
      .filter((item) => passesFilter(item.chunk, filter))
      .map((item) => ({ chunk: item.chunk, score: cosineSimilarity(vector, item.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
