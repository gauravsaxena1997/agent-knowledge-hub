import { formatConfidenceLevel, formatEdgeKind, formatEmbeddingState, formatFreshnessState, formatNodeKind, type KnowledgeEdge, type KnowledgeNode, type KnowledgeNodeKind as KnowledgeNodeKindValue } from "@agent-knowledge-hub/core";
import type { GraphRendererMode } from "./types.js";

export function GraphViewportTopBar(props: {
  renderer: GraphRendererMode;
  title: string;
  subtitle: string;
  selectedNodeId: string | null;
  onFit: () => void;
  onReset: () => void;
  onFocus: () => void;
}) {
  const { renderer, title, subtitle, selectedNodeId, onFit, onReset, onFocus } = props;
  return (
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
      <div
        style={{
          borderRadius: 10,
          background: renderer === "3d" ? "rgba(8,14,28,0.72)" : "rgba(255,255,255,0.92)",
          border: renderer === "3d" ? "1px solid rgba(148,163,184,0.18)" : "none",
          backdropFilter: renderer === "3d" ? "blur(12px)" : "none",
          padding: "8px 10px",
        }}
      >
        <div style={{ color: renderer === "3d" ? "#f8fafc" : "#18181b", fontSize: 13, fontWeight: 800 }}>{title}</div>
        <div style={{ color: renderer === "3d" ? "#94a3b8" : "#71717a", fontSize: 11 }}>{subtitle}</div>
      </div>
      {renderer === "3d" && (
        <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
          <GraphActionButton label="Fit" onClick={onFit} />
          <GraphActionButton label="Reset" onClick={onReset} />
          <GraphActionButton
            label="Focus"
            onClick={onFocus}
            disabled={!selectedNodeId}
            active={Boolean(selectedNodeId)}
          />
        </div>
      )}
    </div>
  );
}

function GraphActionButton(props: { active?: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  const { active = false, disabled = false, label, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "1px solid rgba(148,163,184,0.24)",
        borderRadius: 999,
        background: active ? "rgba(56,189,248,0.18)" : "rgba(8,14,28,0.72)",
        color: disabled ? "#64748b" : active ? "#e0f2fe" : "#e2e8f0",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 11,
        fontWeight: 700,
        padding: "7px 10px",
      }}
    >
      {label}
    </button>
  );
}

export function GraphLegend(props: {
  items: Array<{ color: string; kind: KnowledgeNodeKindValue; label: string }>;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 12,
        left: 12,
        zIndex: 2,
        maxWidth: 420,
        borderRadius: 12,
        background: "rgba(8,14,28,0.72)",
        border: "1px solid rgba(148,163,184,0.18)",
        backdropFilter: "blur(12px)",
        padding: "10px 12px",
      }}
    >
      <div style={{ color: "#e2e8f0", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Node Types</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
        {props.items.map((item) => (
          <div key={item.kind} style={{ alignItems: "center", color: "#cbd5e1", display: "flex", gap: 6, fontSize: 11 }}>
            <span
              style={{
                background: item.color,
                borderRadius: 999,
                boxShadow: `0 0 16px ${item.color}`,
                display: "inline-block",
                height: 8,
                width: 8,
              }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ color: "#7dd3fc", fontSize: 10, marginTop: 8 }}>
        Node size shows connection count. Brighter links show hovered or selected relationships.
      </div>
    </div>
  );
}

export function GraphSidebar(props: {
  availableKinds: string[];
  description: string;
  filteredNodes: KnowledgeNode[];
  nodeColor: (node: KnowledgeNode) => string;
  onSearchChange: (value: string) => void;
  onSelectKind: (kind: KnowledgeNodeKindValue | string) => void;
  onSelectNode: (id: string) => void;
  query: string;
  renderer: GraphRendererMode;
  selectedKinds: Set<KnowledgeNodeKindValue | string>;
  selectedNode: KnowledgeNode | null;
  selectedNodeEdges: KnowledgeEdge[];
  selectedNodeNeighborCount: number;
  title: string;
}) {
  const {
    availableKinds,
    description,
    filteredNodes,
    nodeColor,
    onSearchChange,
    onSelectKind,
    onSelectNode,
    query,
    renderer,
    selectedKinds,
    selectedNode,
    selectedNodeEdges,
    selectedNodeNeighborCount,
    title,
  } = props;

  return (
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
        {renderer === "3d" && (
          <p style={{ color: "#0f172a", fontSize: 11, lineHeight: 1.45, margin: "8px 0 0" }}>
            Color shows node type, size shows connection count, and brighter links show the active neighborhood.
          </p>
        )}
      </div>
      <div style={{ borderBottom: "1px solid #e4e4e7", padding: 12 }}>
        <input
          value={query}
          onChange={(event) => onSearchChange(event.target.value)}
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
                onClick={() => onSelectKind(kind)}
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
        {filteredNodes.map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelectNode(node.id)}
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
            {renderer === "3d" && (
              <div style={{ color: "#52525b", fontSize: 11, marginTop: 6 }}>
                {selectedNodeNeighborCount} connected node{selectedNodeNeighborCount === 1 ? "" : "s"} highlighted
              </div>
            )}
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
                <dd style={{ color: "#18181b", fontSize: 12, margin: 0 }}>{formatConfidenceLevel(selectedNode.confidence)}</dd>
              </div>
              <div>
                <dt style={{ color: "#71717a", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Freshness</dt>
                <dd style={{ color: "#18181b", fontSize: 12, margin: 0 }}>{formatFreshnessState(selectedNode.freshness)}</dd>
              </div>
              <div>
                <dt style={{ color: "#71717a", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Embedding</dt>
                <dd style={{ color: "#18181b", fontSize: 12, margin: 0 }}>{formatEmbeddingState(selectedNode.embeddingState)}</dd>
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
  );
}
