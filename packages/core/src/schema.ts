import { z } from "zod";

export const KnowledgeNodeKind = {
  KNOWLEDGE_ITEM: "knowledge_item",
  ENTITY: "entity",
  INTERACTION: "interaction",
  SOURCE: "source",
  CHUNK: "chunk",
} as const;

export const KnowledgeEdgeKind = {
  RELATED_TO: "related_to",
  MENTIONS: "mentions",
  DERIVED_FROM: "derived_from",
  SUPPORTS: "supports",
  CONTRADICTS: "contradicts",
  SUPERSEDES: "supersedes",
  WORKS_AT: "works_at",
  CONTACTED: "contacted",
  SENT_MESSAGE_TO: "sent_message_to",
  APPLIED_TO: "applied_to",
  BELONGS_TO: "belongs_to",
} as const;

export const ConfidenceLevel = {
  OBSERVED: "observed",
  INFERRED: "inferred",
  USER_CONFIRMED: "user_confirmed",
  IMPORTED: "imported",
} as const;

export const FreshnessState = {
  FRESH: "fresh",
  STALE: "stale",
  NEEDS_REVIEW: "needs_review",
  SUPERSEDED: "superseded",
} as const;

export const EmbeddingState = {
  NOT_INDEXED: "not_indexed",
  PENDING: "pending",
  INDEXED: "indexed",
  STALE: "stale",
  FAILED: "failed",
} as const;

export const knowledgeNodeKindZ = z.enum([
  KnowledgeNodeKind.KNOWLEDGE_ITEM,
  KnowledgeNodeKind.ENTITY,
  KnowledgeNodeKind.INTERACTION,
  KnowledgeNodeKind.SOURCE,
  KnowledgeNodeKind.CHUNK,
]);

export const knowledgeEdgeKindZ = z.enum([
  KnowledgeEdgeKind.RELATED_TO,
  KnowledgeEdgeKind.MENTIONS,
  KnowledgeEdgeKind.DERIVED_FROM,
  KnowledgeEdgeKind.SUPPORTS,
  KnowledgeEdgeKind.CONTRADICTS,
  KnowledgeEdgeKind.SUPERSEDES,
  KnowledgeEdgeKind.WORKS_AT,
  KnowledgeEdgeKind.CONTACTED,
  KnowledgeEdgeKind.SENT_MESSAGE_TO,
  KnowledgeEdgeKind.APPLIED_TO,
  KnowledgeEdgeKind.BELONGS_TO,
]);

export const confidenceLevelZ = z.enum([
  ConfidenceLevel.OBSERVED,
  ConfidenceLevel.INFERRED,
  ConfidenceLevel.USER_CONFIRMED,
  ConfidenceLevel.IMPORTED,
]);

export const freshnessStateZ = z.enum([
  FreshnessState.FRESH,
  FreshnessState.STALE,
  FreshnessState.NEEDS_REVIEW,
  FreshnessState.SUPERSEDED,
]);

export const embeddingStateZ = z.enum([
  EmbeddingState.NOT_INDEXED,
  EmbeddingState.PENDING,
  EmbeddingState.INDEXED,
  EmbeddingState.STALE,
  EmbeddingState.FAILED,
]);

export const metadataValueZ = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

export const metadataZ = z.record(z.string(), metadataValueZ);

export const sourceRefZ = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1),
  uri: z.string().optional(),
  capturedAt: z.string().optional(),
});

export const knowledgeNodeZ = z.object({
  id: z.string().min(1),
  kind: knowledgeNodeKindZ,
  label: z.string().min(1),
  body: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: metadataZ.default({}),
  sourceIds: z.array(z.string()).default([]),
  confidence: confidenceLevelZ.default(ConfidenceLevel.IMPORTED),
  freshness: freshnessStateZ.default(FreshnessState.FRESH),
  embeddingState: embeddingStateZ.default(EmbeddingState.NOT_INDEXED),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const knowledgeEdgeZ = z.object({
  id: z.string().min(1),
  fromId: z.string().min(1),
  toId: z.string().min(1),
  kind: knowledgeEdgeKindZ.or(z.string().min(1)),
  label: z.string().optional(),
  metadata: metadataZ.default({}),
  sourceIds: z.array(z.string()).default([]),
  confidence: confidenceLevelZ.default(ConfidenceLevel.IMPORTED),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const knowledgeChunkZ = z.object({
  id: z.string().min(1),
  nodeId: z.string().min(1),
  text: z.string().min(1),
  order: z.number().int().nonnegative(),
  contentHash: z.string().min(1),
  tags: z.array(z.string()).default([]),
  metadata: metadataZ.default({}),
});

export const graphSnapshotZ = z.object({
  nodes: z.array(knowledgeNodeZ),
  edges: z.array(knowledgeEdgeZ),
  sources: z.array(sourceRefZ).default([]),
});

export const retrievalRequestZ = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().default(10),
  tags: z.array(z.string()).optional(),
  nodeKinds: z.array(knowledgeNodeKindZ).optional(),
  expandDepth: z.number().int().nonnegative().default(1),
});

export const retrievalHitZ = z.object({
  node: knowledgeNodeZ,
  score: z.number(),
  excerpt: z.string(),
  sourceIds: z.array(z.string()),
  relatedNodes: z.array(knowledgeNodeZ).default([]),
  relatedEdges: z.array(knowledgeEdgeZ).default([]),
});

export type KnowledgeNodeKind = (typeof KnowledgeNodeKind)[keyof typeof KnowledgeNodeKind];
export type KnowledgeEdgeKind = (typeof KnowledgeEdgeKind)[keyof typeof KnowledgeEdgeKind];
export type ConfidenceLevel = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel];
export type FreshnessState = (typeof FreshnessState)[keyof typeof FreshnessState];
export type EmbeddingState = (typeof EmbeddingState)[keyof typeof EmbeddingState];
export type MetadataValue = z.infer<typeof metadataValueZ>;
export type Metadata = z.infer<typeof metadataZ>;
export type SourceRef = z.infer<typeof sourceRefZ>;
export type KnowledgeNode = z.infer<typeof knowledgeNodeZ>;
export type KnowledgeEdge = z.infer<typeof knowledgeEdgeZ>;
export type KnowledgeChunk = z.infer<typeof knowledgeChunkZ>;
export type GraphSnapshot = z.infer<typeof graphSnapshotZ>;
export type RetrievalRequest = z.infer<typeof retrievalRequestZ>;
export type RetrievalHit = z.infer<typeof retrievalHitZ>;
