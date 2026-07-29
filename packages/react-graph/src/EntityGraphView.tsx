import type { GraphSnapshot, KnowledgeNode } from "@agent-knowledge-hub/core";
import { KnowledgeNodeKind } from "@agent-knowledge-hub/core";
import { KnowledgeGraphView, type KnowledgeGraphViewProps } from "./KnowledgeGraphView.js";

export type EntityGraphViewProps = Omit<KnowledgeGraphViewProps, "graph"> & {
  graph: GraphSnapshot;
};

export function EntityGraphView({ graph, ...props }: EntityGraphViewProps) {
  const entityNodeIds = new Set(
    graph.nodes
      .filter((node) => node.kind === KnowledgeNodeKind.ENTITY || node.kind === KnowledgeNodeKind.INTERACTION)
      .map((node: KnowledgeNode) => node.id),
  );
  const entityGraph: GraphSnapshot = {
    ...graph,
    nodes: graph.nodes.filter((node) => entityNodeIds.has(node.id)),
    edges: graph.edges.filter((edge) => {
      return entityNodeIds.has(edge.fromId) && entityNodeIds.has(edge.toId);
    }),
  };
  return (
    <KnowledgeGraphView
      graph={entityGraph}
      title="Entity Graph"
      description="People, companies, and interactions only. Knowledge items, chunks, and source nodes are hidden."
      {...props}
    />
  );
}
