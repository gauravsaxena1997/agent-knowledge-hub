import { chunksForNode, type ChunkTextOptions } from "./chunking.js";
import type { EmbedText, GraphStore, KnowledgeIndexer, VectorStore } from "./contracts.js";
import type { KnowledgeChunk, KnowledgeNode } from "./schema.js";

export interface DefaultKnowledgeIndexerOptions {
  graphStore: GraphStore;
  vectorStore: VectorStore;
  embedText: EmbedText;
  chunking?: ChunkTextOptions;
}

export class DefaultKnowledgeIndexer implements KnowledgeIndexer {
  private readonly graphStore: GraphStore;
  private readonly vectorStore: VectorStore;
  private readonly embedText: EmbedText;
  private readonly chunking: ChunkTextOptions | undefined;

  constructor(options: DefaultKnowledgeIndexerOptions) {
    this.graphStore = options.graphStore;
    this.vectorStore = options.vectorStore;
    this.embedText = options.embedText;
    this.chunking = options.chunking;
  }

  async indexNode(node: KnowledgeNode): Promise<KnowledgeChunk[]> {
    const saved = await this.graphStore.upsertNode(node);
    const chunks = chunksForNode(saved, this.chunking);
    await this.vectorStore.deleteChunksByNode(saved.id);
    for (const chunk of chunks) {
      const vector = await this.embedText(chunk.text);
      await this.vectorStore.upsertChunk(chunk, vector);
    }
    return chunks;
  }

  async removeNode(nodeId: string): Promise<void> {
    await this.vectorStore.deleteChunksByNode(nodeId);
    await this.graphStore.deleteNode(nodeId);
  }
}
