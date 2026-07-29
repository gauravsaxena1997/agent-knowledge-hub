import type {
  GraphSnapshot,
  KnowledgeChunk,
  KnowledgeEdge,
  KnowledgeNode,
  RetrievalHit,
  RetrievalRequest,
  SourceRef,
} from "./schema.js";

export type EmbeddingVector = number[];

export type EmbedText = (text: string) => Promise<EmbeddingVector>;

export interface GraphStore {
  upsertNode(node: KnowledgeNode): Promise<KnowledgeNode>;
  upsertEdge(edge: KnowledgeEdge): Promise<KnowledgeEdge>;
  upsertSource(source: SourceRef): Promise<SourceRef>;
  getNode(id: string): Promise<KnowledgeNode | null>;
  listNodes(): Promise<KnowledgeNode[]>;
  listEdges(): Promise<KnowledgeEdge[]>;
  listSources(): Promise<SourceRef[]>;
  neighborhood(nodeId: string, depth: number): Promise<GraphSnapshot>;
  deleteNode(id: string): Promise<void>;
}

export interface VectorSearchFilter {
  tags?: string[];
  nodeIds?: string[];
  nodeKinds?: string[];
}

export interface VectorSearchHit {
  chunk: KnowledgeChunk;
  score: number;
}

export interface VectorStore {
  upsertChunk(chunk: KnowledgeChunk, vector: EmbeddingVector): Promise<void>;
  deleteChunksByNode(nodeId: string): Promise<void>;
  search(vector: EmbeddingVector, limit: number, filter?: VectorSearchFilter): Promise<VectorSearchHit[]>;
}

export interface KnowledgeIndexer {
  indexNode(node: KnowledgeNode): Promise<KnowledgeChunk[]>;
  removeNode(nodeId: string): Promise<void>;
}

export interface KnowledgeRetriever {
  retrieve(request: RetrievalRequest): Promise<RetrievalHit[]>;
}
