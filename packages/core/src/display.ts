import { ConfidenceLevel, EmbeddingState, FreshnessState, KnowledgeEdgeKind, KnowledgeNodeKind } from "./schema.js";

const nodeKindLabels: Record<KnowledgeNodeKind, string> = {
  [KnowledgeNodeKind.KNOWLEDGE_ITEM]: "Knowledge Item",
  [KnowledgeNodeKind.ENTITY]: "Entity",
  [KnowledgeNodeKind.INTERACTION]: "Interaction",
  [KnowledgeNodeKind.SOURCE]: "Source",
  [KnowledgeNodeKind.CHUNK]: "Chunk",
};

const edgeKindLabels: Record<KnowledgeEdgeKind, string> = {
  [KnowledgeEdgeKind.RELATED_TO]: "Related To",
  [KnowledgeEdgeKind.MENTIONS]: "Mentions",
  [KnowledgeEdgeKind.DERIVED_FROM]: "Derived From",
  [KnowledgeEdgeKind.SUPPORTS]: "Supports",
  [KnowledgeEdgeKind.CONTRADICTS]: "Contradicts",
  [KnowledgeEdgeKind.SUPERSEDES]: "Supersedes",
  [KnowledgeEdgeKind.WORKS_AT]: "Works At",
  [KnowledgeEdgeKind.CONTACTED]: "Contacted",
  [KnowledgeEdgeKind.SENT_MESSAGE_TO]: "Sent Message To",
  [KnowledgeEdgeKind.APPLIED_TO]: "Applied To",
  [KnowledgeEdgeKind.BELONGS_TO]: "Belongs To",
};

const confidenceLabels: Record<ConfidenceLevel, string> = {
  [ConfidenceLevel.OBSERVED]: "Observed",
  [ConfidenceLevel.INFERRED]: "Inferred",
  [ConfidenceLevel.USER_CONFIRMED]: "User Confirmed",
  [ConfidenceLevel.IMPORTED]: "Imported",
};

const freshnessLabels: Record<FreshnessState, string> = {
  [FreshnessState.FRESH]: "Fresh",
  [FreshnessState.STALE]: "Stale",
  [FreshnessState.NEEDS_REVIEW]: "Needs Review",
  [FreshnessState.SUPERSEDED]: "Superseded",
};

const embeddingStateLabels: Record<EmbeddingState, string> = {
  [EmbeddingState.NOT_INDEXED]: "Not Indexed",
  [EmbeddingState.PENDING]: "Pending",
  [EmbeddingState.INDEXED]: "Indexed",
  [EmbeddingState.STALE]: "Stale",
  [EmbeddingState.FAILED]: "Failed",
};

function humanizeIdentifier(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

export function formatNodeKind(kind: KnowledgeNodeKind | string): string {
  return kind in nodeKindLabels ? nodeKindLabels[kind as KnowledgeNodeKind] : humanizeIdentifier(kind);
}

export function formatEdgeKind(kind: KnowledgeEdgeKind | string): string {
  return kind in edgeKindLabels ? edgeKindLabels[kind as KnowledgeEdgeKind] : humanizeIdentifier(kind);
}

export function formatConfidenceLevel(confidence: ConfidenceLevel | string): string {
  return confidence in confidenceLabels ? confidenceLabels[confidence as ConfidenceLevel] : humanizeIdentifier(confidence);
}

export function formatFreshnessState(freshness: FreshnessState | string): string {
  return freshness in freshnessLabels ? freshnessLabels[freshness as FreshnessState] : humanizeIdentifier(freshness);
}

export function formatEmbeddingState(state: EmbeddingState | string): string {
  return state in embeddingStateLabels ? embeddingStateLabels[state as EmbeddingState] : humanizeIdentifier(state);
}
