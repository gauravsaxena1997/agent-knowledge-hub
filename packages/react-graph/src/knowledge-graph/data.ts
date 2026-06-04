import { MultiDirectedGraph } from "graphology";
import { formatEdgeKind, type GraphSnapshot, type KnowledgeNode } from "@agent-knowledge-hub/core";
import { forceGraphSceneNodeColor, forceGraphSceneNodeRadius } from "./scene.js";
import type { ForceGraph3DLinkObject, ForceGraph3DNodeObject, KnowledgeGraphology } from "./types.js";

export function buildGraph(snapshot: GraphSnapshot, nodeColor: (node: KnowledgeNode) => string): KnowledgeGraphology {
  const graph = new MultiDirectedGraph();
  const radius = Math.max(1, snapshot.nodes.length / 8);
  snapshot.nodes.forEach((node, index) => {
    const angle = (index / Math.max(1, snapshot.nodes.length)) * Math.PI * 2;
    graph.addNode(node.id, {
      label: node.label,
      size: Math.max(5, Math.min(16, 6 + node.tags.length)),
      color: nodeColor(node),
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      data: node,
    });
  });
  for (const edge of snapshot.edges) {
    if (!graph.hasNode(edge.fromId) || !graph.hasNode(edge.toId)) continue;
    graph.addDirectedEdgeWithKey(edge.id, edge.fromId, edge.toId, {
      label: edge.label ?? formatEdgeKind(edge.kind),
      size: 1.2,
      color: "#cbd5e1",
      data: edge,
    });
  }
  return graph;
}

export function buildForceGraph3DData(graph: GraphSnapshot): {
  nodes: ForceGraph3DNodeObject[];
  links: ForceGraph3DLinkObject[];
} {
  const nodes: ForceGraph3DNodeObject[] = graph.nodes.map((node) => {
    const degree = graph.edges.reduce((count, edge) => {
      if (edge.fromId === node.id || edge.toId === node.id) return count + 1;
      return count;
    }, 0);

    return {
      id: node.id,
      label: node.label,
      color: forceGraphSceneNodeColor(node),
      kind: node.kind,
      degree,
      val: forceGraphSceneNodeRadius(degree),
    };
  });

  const links = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.fromId,
    target: edge.toId,
    label: edge.label ?? formatEdgeKind(edge.kind),
  }));

  return { nodes, links };
}
