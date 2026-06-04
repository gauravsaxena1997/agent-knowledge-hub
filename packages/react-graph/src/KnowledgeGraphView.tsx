import { useEffect, useMemo, useRef, useState } from "react";
import { MultiDirectedGraph } from "graphology";
import {
  formatConfidenceLevel,
  formatEdgeKind,
  formatEmbeddingState,
  formatFreshnessState,
  formatNodeKind,
  type GraphSnapshot,
  type KnowledgeEdge,
  type KnowledgeNode,
  type KnowledgeNodeKind,
} from "@agent-knowledge-hub/core";
import { defaultNodeColor } from "./colors.js";

type KnowledgeGraphology = InstanceType<typeof MultiDirectedGraph>;
type SigmaRenderer = {
  kill: () => void;
  on: (event: "clickNode", handler: (payload: { node: string }) => void) => void;
};

export interface KnowledgeGraphViewProps {
  graph: GraphSnapshot;
  height?: number | string;
  nodeColor?: (node: KnowledgeNode) => string;
  edgeLabel?: (edge: KnowledgeEdge) => string;
  onNodeOpen?: (node: KnowledgeNode) => void;
  className?: string;
  title?: string;
  description?: string;
  showControls?: boolean;
}

function buildGraph(snapshot: GraphSnapshot, nodeColor: (node: KnowledgeNode) => string): KnowledgeGraphology {
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

export function KnowledgeGraphView({
  graph,
  height = 560,
  nodeColor = defaultNodeColor,
  onNodeOpen,
  className,
  title = "Knowledge Graph",
  description = "Search, filter, and inspect source-backed knowledge relationships.",
  showControls = true,
}: KnowledgeGraphViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<SigmaRenderer | null>(null);
  const [query, setQuery] = useState("");
  const [selectedKinds, setSelectedKinds] = useState<Set<KnowledgeNodeKind | string>>(() => new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(graph.nodes[0]?.id ?? null);
  const availableKinds = useMemo(
    () => Array.from(new Set(graph.nodes.map((node) => node.kind))).sort(),
    [graph.nodes],
  );
  const filteredGraph = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nodes = graph.nodes.filter((node) => {
      const kindAllowed = selectedKinds.size === 0 || selectedKinds.has(node.kind);
      if (!kindAllowed) return false;
      if (!normalizedQuery) return true;
      const searchable = [node.label, node.body ?? "", ...node.tags, ...Object.values(node.metadata).map(String)]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
    const nodeIds = new Set(nodes.map((node) => node.id));
    return {
      ...graph,
      nodes,
      edges: graph.edges.filter((edge) => nodeIds.has(edge.fromId) && nodeIds.has(edge.toId)),
    };
  }, [graph, query, selectedKinds]);
  const graphology = useMemo(() => buildGraph(filteredGraph, nodeColor), [filteredGraph, nodeColor]);
  const selectedNode = useMemo(
    () => graph.nodes.find((node) => node.id === selectedNodeId) ?? filteredGraph.nodes[0] ?? null,
    [filteredGraph.nodes, graph.nodes, selectedNodeId],
  );
  const selectedNodeEdges = useMemo(() => {
    if (!selectedNode) return [];
    return graph.edges.filter((edge) => edge.fromId === selectedNode.id || edge.toId === selectedNode.id);
  }, [graph.edges, selectedNode]);

  useEffect(() => {
    if (selectedNodeId && filteredGraph.nodes.some((node) => node.id === selectedNodeId)) return;
    setSelectedNodeId(filteredGraph.nodes[0]?.id ?? null);
  }, [filteredGraph.nodes, selectedNodeId]);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    sigmaRef.current?.kill();

    void import("sigma").then(({ default: Sigma }) => {
      if (disposed || !containerRef.current) return;
      const renderer = new Sigma(graphology, containerRef.current, {
        renderEdgeLabels: false,
        allowInvalidContainer: true,
      });
      sigmaRef.current = renderer;
      renderer.on("clickNode", ({ node }) => {
        const data = graphology.getNodeAttribute(node, "data") as KnowledgeNode;
        setSelectedNodeId(data.id);
        onNodeOpen?.(data);
      });
    });

    return () => {
      disposed = true;
      sigmaRef.current?.kill();
      sigmaRef.current = null;
    };
  }, [graphology, onNodeOpen]);

  const toggleKind = (kind: KnowledgeNodeKind | string) => {
    setSelectedKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  };

  return (
    <div
      className={className}
      style={{
        height,
        minHeight: 320,
        display: "grid",
        gridTemplateColumns: showControls ? "minmax(0, 1fr) minmax(260px, 320px)" : "1fr",
        gap: 12,
        width: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: 320,
          border: "1px solid #e4e4e7",
          borderRadius: 8,
          overflow: "hidden",
          background: "#fafafa",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            top: 12,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            pointerEvents: "none",
          }}
        >
          <div style={{ borderRadius: 8, background: "rgba(255,255,255,0.92)", padding: "8px 10px" }}>
            <div style={{ color: "#18181b", fontSize: 13, fontWeight: 800 }}>{title}</div>
            <div style={{ color: "#71717a", fontSize: 11 }}>{filteredGraph.nodes.length} nodes / {filteredGraph.edges.length} edges</div>
          </div>
        </div>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      </div>
      {showControls && (
        <aside
          style={{
            minHeight: 320,
            overflow: "auto",
            border: "1px solid #e4e4e7",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <div style={{ borderBottom: "1px solid #e4e4e7", padding: 12 }}>
            <div style={{ color: "#18181b", fontSize: 14, fontWeight: 800 }}>{title}</div>
            <p style={{ color: "#71717a", fontSize: 12, lineHeight: 1.45, margin: "4px 0 0" }}>{description}</p>
          </div>
          <div style={{ borderBottom: "1px solid #e4e4e7", padding: 12 }}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search nodes, tags, metadata"
              style={{
                width: "100%",
                border: "1px solid #d4d4d8",
                borderRadius: 8,
                color: "#18181b",
                fontSize: 12,
                outline: "none",
                padding: "8px 10px",
              }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {availableKinds.map((kind) => {
                const active = selectedKinds.size === 0 || selectedKinds.has(kind);
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => toggleKind(kind)}
                    style={{
                      border: "1px solid #d4d4d8",
                      borderRadius: 8,
                      background: active ? "#18181b" : "#ffffff",
                      color: active ? "#ffffff" : "#52525b",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "5px 8px",
                    }}
                  >
                    {formatNodeKind(kind)}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ borderBottom: "1px solid #e4e4e7", maxHeight: 180, overflow: "auto", padding: 8 }}>
            {filteredGraph.nodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
                style={{
                  width: "100%",
                  border: selectedNode?.id === node.id ? "1px solid #18181b" : "1px solid transparent",
                  borderRadius: 8,
                  background: selectedNode?.id === node.id ? "#f4f4f5" : "#ffffff",
                  color: "#18181b",
                  cursor: "pointer",
                  display: "block",
                  marginBottom: 4,
                  padding: 8,
                  textAlign: "left",
                }}
              >
                <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
                  <span
                    style={{
                      background: nodeColor(node),
                      borderRadius: 999,
                      display: "inline-block",
                      height: 8,
                      width: 8,
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 800 }}>{node.label}</span>
                </div>
                <div style={{ color: "#71717a", fontSize: 11, marginTop: 3 }}>{formatNodeKind(node.kind)}</div>
              </button>
            ))}
          </div>
          <div style={{ padding: 12 }}>
            {selectedNode ? (
              <>
                <div style={{ color: "#18181b", fontSize: 14, fontWeight: 900 }}>{selectedNode.label}</div>
                <div style={{ color: "#71717a", fontSize: 11, fontWeight: 700, marginTop: 3 }}>
                  {formatNodeKind(selectedNode.kind)}
                </div>
                {selectedNode.body && (
                  <p style={{ color: "#3f3f46", fontSize: 12, lineHeight: 1.5, margin: "10px 0 0" }}>{selectedNode.body}</p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {selectedNode.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: "#f4f4f5",
                        border: "1px solid #e4e4e7",
                        borderRadius: 999,
                        color: "#52525b",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "3px 7px",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <dl style={{ display: "grid", gap: 6, margin: "12px 0 0" }}>
                  <div>
                    <dt style={{ color: "#71717a", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Confidence</dt>
                    <dd style={{ color: "#18181b", fontSize: 12, margin: 0 }}>
                      {formatConfidenceLevel(selectedNode.confidence)}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: "#71717a", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Freshness</dt>
                    <dd style={{ color: "#18181b", fontSize: 12, margin: 0 }}>
                      {formatFreshnessState(selectedNode.freshness)}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: "#71717a", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Embedding</dt>
                    <dd style={{ color: "#18181b", fontSize: 12, margin: 0 }}>
                      {formatEmbeddingState(selectedNode.embeddingState)}
                    </dd>
                  </div>
                </dl>
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: "#71717a", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Edges</div>
                  <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                    {selectedNodeEdges.map((edge) => (
                      <div key={edge.id} style={{ border: "1px solid #e4e4e7", borderRadius: 8, padding: 7 }}>
                        <div style={{ color: "#18181b", fontSize: 11, fontWeight: 800 }}>
                          {edge.label ?? formatEdgeKind(edge.kind)}
                        </div>
                        <div style={{ color: "#71717a", fontSize: 10 }}>
                          {edge.fromId} {"->"} {edge.toId}
                        </div>
                      </div>
                    ))}
                    {selectedNodeEdges.length === 0 && (
                      <div style={{ color: "#71717a", fontSize: 12 }}>No edges match the current graph.</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: "#71717a", fontSize: 12 }}>No node selected.</div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
