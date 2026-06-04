import { KnowledgeNodeKind, type KnowledgeNode } from "@agent-knowledge-hub/core";

export function defaultNodeColor(node: KnowledgeNode): string {
  if (node.kind === KnowledgeNodeKind.ENTITY) return "#2563eb";
  if (node.kind === KnowledgeNodeKind.INTERACTION) return "#16a34a";
  if (node.kind === KnowledgeNodeKind.SOURCE) return "#d97706";
  if (node.kind === KnowledgeNodeKind.CHUNK) return "#71717a";
  return "#7c3aed";
}
