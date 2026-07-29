import { KnowledgeNodeKind, formatNodeKind, type KnowledgeNode, type KnowledgeNodeKind as KnowledgeNodeKindValue } from "@agent-knowledge-hub/core";
import type { GraphRendererMode } from "./types.js";

export const FORCE_GRAPH_SCENE_BACKGROUND = "#07111f";
export const FORCE_GRAPH_SCENE_EDGE = "#1f314a";
export const FORCE_GRAPH_KIND_ORDER: KnowledgeNodeKindValue[] = [
  KnowledgeNodeKind.KNOWLEDGE_ITEM,
  KnowledgeNodeKind.ENTITY,
  KnowledgeNodeKind.INTERACTION,
  KnowledgeNodeKind.SOURCE,
  KnowledgeNodeKind.CHUNK,
];

export function forceGraphSceneNodeColor(node: Pick<KnowledgeNode, "kind">): string {
  if (node.kind === KnowledgeNodeKind.ENTITY) return "#6aa9ff";
  if (node.kind === KnowledgeNodeKind.INTERACTION) return "#67e8a6";
  if (node.kind === KnowledgeNodeKind.SOURCE) return "#ffd166";
  if (node.kind === KnowledgeNodeKind.CHUNK) return "#9ca3af";
  return "#c084fc";
}

export function forceGraphScenePanelBackground(renderer: GraphRendererMode): string {
  return renderer === "3d" ? "#091322" : "#fafafa";
}

export function forceGraphScenePanelBorder(renderer: GraphRendererMode): string {
  return renderer === "3d" ? FORCE_GRAPH_SCENE_EDGE : "#e4e4e7";
}

export function forceGraphSceneNodeRadius(degree: number): number {
  return Math.max(2.6, Math.min(9.5, 2.8 + degree * 0.55));
}

export function buildGraphKindLegend(nodes: KnowledgeNode[]) {
  return FORCE_GRAPH_KIND_ORDER.filter((kind) => nodes.some((node) => node.kind === kind)).map((kind) => ({
    kind,
    label: formatNodeKind(kind),
    color: forceGraphSceneNodeColor({ kind }),
  }));
}
