import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import {
  type KnowledgeNode,
  type KnowledgeNodeKind as KnowledgeNodeKindValue,
} from "@agent-knowledge-hub/core";
import { defaultNodeColor } from "./colors.js";
import { buildForceGraph3DData, buildGraph } from "./knowledge-graph/data.js";
import { GraphLegend, GraphSidebar, GraphViewportTopBar } from "./knowledge-graph/panels.js";
import {
  FORCE_GRAPH_SCENE_BACKGROUND,
  buildGraphKindLegend,
  forceGraphScenePanelBackground,
  forceGraphScenePanelBorder,
} from "./knowledge-graph/scene.js";
import type {
  ForceGraph3DComponentType,
  ForceGraph3DInstance,
  KnowledgeGraphViewProps,
  SigmaRenderer,
} from "./knowledge-graph/types.js";
export type { KnowledgeGraphViewProps } from "./knowledge-graph/types.js";

export function KnowledgeGraphView({
  graph,
  height = 560,
  nodeColor = defaultNodeColor,
  onNodeOpen,
  className,
  title = "Knowledge Graph",
  description = "Search, filter, and inspect source-backed knowledge relationships.",
  showControls = true,
  renderer = "2d",
}: KnowledgeGraphViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<SigmaRenderer | null>(null);
  const forceGraph3dRef = useRef<ForceGraph3DInstance | null>(null);
  const interactionResumeTimeoutRef = useRef<number | null>(null);
  const initial3dFitDoneRef = useRef(false);
  const [query, setQuery] = useState("");
  const [selectedKinds, setSelectedKinds] = useState<Set<KnowledgeNodeKindValue | string>>(() => new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [forceGraph3DComponent, setForceGraph3DComponent] = useState<ForceGraph3DComponentType | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [isPointerInsideGraph, setIsPointerInsideGraph] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const availableKinds = useMemo(
    () => Array.from(new Set(graph.nodes.map((node) => node.kind))).sort(),
    [graph.nodes],
  );
  const ForceGraph3DComponent = forceGraph3DComponent;
  const activeNeighborhoodNodeId = hoveredNodeId ?? selectedNodeId;
  const graphPanelTitle = renderer === "3d" ? "Drag to rotate, scroll to zoom, click a node to inspect connections." : title;
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
  const highlightedNodeIds = useMemo(() => {
    if (!activeNeighborhoodNodeId) return new Set<string>();

    const neighborIds = new Set<string>([activeNeighborhoodNodeId]);
    for (const edge of filteredGraph.edges) {
      if (edge.fromId === activeNeighborhoodNodeId) neighborIds.add(edge.toId);
      if (edge.toId === activeNeighborhoodNodeId) neighborIds.add(edge.fromId);
    }
    return neighborIds;
  }, [activeNeighborhoodNodeId, filteredGraph.edges]);
  const forceGraph3DData = useMemo(() => buildForceGraph3DData(filteredGraph), [filteredGraph]);
  const graphKindLegend = useMemo(() => buildGraphKindLegend(filteredGraph.nodes), [filteredGraph.nodes]);
  const selectedNodeNeighborCount = useMemo(() => {
    if (!selectedNodeId) return 0;
    return highlightedNodeIds.size > 0 ? highlightedNodeIds.size - 1 : 0;
  }, [highlightedNodeIds.size, selectedNodeId]);
  const isAmbientMotionEnabled = renderer === "3d" && !isPointerInsideGraph && !isUserInteracting && !selectedNodeId && !hoveredNodeId;

  useEffect(() => {
    if (!selectedNodeId) return;
    if (filteredGraph.nodes.some((node) => node.id === selectedNodeId)) return;
    setSelectedNodeId(null);
  }, [filteredGraph.nodes, selectedNodeId]);

  useEffect(() => {
    if (renderer !== "3d") return;
    initial3dFitDoneRef.current = false;
  }, [renderer, filteredGraph.nodes.length, filteredGraph.edges.length]);

  useEffect(() => {
    return () => {
      if (interactionResumeTimeoutRef.current != null) {
        window.clearTimeout(interactionResumeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (renderer !== "2d") {
      sigmaRef.current?.kill();
      sigmaRef.current = null;
      return;
    }
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
  }, [graphology, onNodeOpen, renderer]);

  useEffect(() => {
    if (renderer !== "3d") return;
    if (forceGraph3DComponent) return;

    let disposed = false;
    void import("react-force-graph-3d").then((module) => {
      if (disposed) return;
      setForceGraph3DComponent(() => module.default as unknown as ForceGraph3DComponentType);
    });

    return () => {
      disposed = true;
    };
  }, [forceGraph3DComponent, renderer]);

  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;
    const updateViewport = () => {
      setViewport({
        width: Math.max(element.clientWidth, 320),
        height: Math.max(element.clientHeight, 320),
      });
    };

    const resizeObserver = new ResizeObserver(updateViewport);
    resizeObserver.observe(element);
    updateViewport();

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (renderer !== "3d") return;
    if (!selectedNodeId) return;
    const activeNode = forceGraph3DData.nodes.find((node) => node.id === selectedNodeId);
    if (!activeNode) return;
    if (activeNode.x == null || activeNode.y == null || activeNode.z == null) return;

    forceGraph3dRef.current?.cameraPosition(
      { x: activeNode.x * 1.22, y: activeNode.y * 1.22, z: (activeNode.z ?? 0) + 92 },
      activeNode,
      900,
    );
  }, [forceGraph3DData.nodes, renderer, selectedNodeId]);

  useEffect(() => {
    if (!isAmbientMotionEnabled) return;

    let frameId = 0;
    const tick = () => {
      const time = Date.now() * 0.00008;
      forceGraph3dRef.current?.cameraPosition(
        {
          x: Math.cos(time) * 320,
          y: 34 + Math.sin(time * 1.6) * 46,
          z: 280 + Math.sin(time) * 44,
        },
        { x: 0, y: 0, z: 0 },
      );
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isAmbientMotionEnabled]);

  useEffect(() => {
    if (renderer !== "3d") return;
    const timeoutId = window.setTimeout(() => {
      forceGraph3dRef.current?.cameraPosition({ x: 0, y: 0, z: 320 }, { x: 0, y: 0, z: 0 }, 0);
      forceGraph3dRef.current?.zoomToFit?.(900, 72);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [renderer, filteredGraph.nodes.length, filteredGraph.edges.length]);

  const toggleKind = (kind: KnowledgeNodeKindValue | string) => {
    setSelectedKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  };
  const pauseAmbientMotion = (resumeAfterMs?: number) => {
    if (renderer !== "3d") return;
    setIsUserInteracting(true);
    if (interactionResumeTimeoutRef.current != null) {
      window.clearTimeout(interactionResumeTimeoutRef.current);
      interactionResumeTimeoutRef.current = null;
    }
    if (resumeAfterMs != null) {
      interactionResumeTimeoutRef.current = window.setTimeout(() => {
        setIsUserInteracting(false);
        interactionResumeTimeoutRef.current = null;
      }, resumeAfterMs);
    }
  };
  const handleGraphPointerEnter = () => {
    if (renderer !== "3d") return;
    setIsPointerInsideGraph(true);
    pauseAmbientMotion();
  };
  const handleGraphPointerLeave = () => {
    if (renderer !== "3d") return;
    setIsPointerInsideGraph(false);
    pauseAmbientMotion(1400);
  };
  const handleGraphWheel = () => {
    pauseAmbientMotion(2200);
  };
  const handleGraphPointerDown = () => {
    pauseAmbientMotion();
  };
  const handleGraphPointerUp = () => {
    pauseAmbientMotion(2200);
  };
  const focusSelectedNode = () => {
    if (renderer !== "3d" || !selectedNodeId) return;
    pauseAmbientMotion(2600);
    const activeNode = forceGraph3DData.nodes.find((node) => node.id === selectedNodeId);
    if (!activeNode || activeNode.x == null || activeNode.y == null || activeNode.z == null) return;

    forceGraph3dRef.current?.cameraPosition(
      { x: activeNode.x * 1.22, y: activeNode.y * 1.22, z: (activeNode.z ?? 0) + 92 },
      activeNode,
      900,
    );
  };
  const fitGraphToViewport = () => {
    if (renderer !== "3d") return;
    pauseAmbientMotion(2600);
    forceGraph3dRef.current?.zoomToFit?.(900, 72);
  };
  const resetGraphView = () => {
    setSelectedNodeId(null);
    setHoveredNodeId(null);
    if (renderer === "3d") {
      pauseAmbientMotion(2600);
      forceGraph3dRef.current?.cameraPosition({ x: 0, y: 0, z: 320 }, { x: 0, y: 0, z: 0 }, 800);
      window.setTimeout(() => {
        forceGraph3dRef.current?.zoomToFit?.(900, 72);
      }, 120);
    }
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
          border: `1px solid ${forceGraphScenePanelBorder(renderer)}`,
          borderRadius: 8,
          overflow: "hidden",
          background: forceGraphScenePanelBackground(renderer),
          boxShadow: renderer === "3d" ? "inset 0 1px 0 rgba(255,255,255,0.04)" : "none",
        }}
      >
        {renderer === "3d" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: [
                "radial-gradient(circle at 16% 18%, rgba(110,231,255,0.14), transparent 24%)",
                "radial-gradient(circle at 78% 20%, rgba(192,132,252,0.16), transparent 18%)",
                "radial-gradient(circle at 62% 76%, rgba(250,204,21,0.12), transparent 22%)",
                "linear-gradient(180deg, rgba(7,17,31,0.92) 0%, rgba(4,9,20,0.98) 100%)",
              ].join(","),
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        )}
        <GraphViewportTopBar
          renderer={renderer}
          title={title}
          subtitle={`${filteredGraph.nodes.length} nodes / ${filteredGraph.edges.length} edges${renderer === "3d" ? ` • ${graphPanelTitle}` : ""}`}
          selectedNodeId={selectedNodeId}
          onFit={fitGraphToViewport}
          onReset={resetGraphView}
          onFocus={focusSelectedNode}
        />
        {renderer === "3d" && (
          <GraphLegend items={graphKindLegend} />
        )}
        <div
          ref={containerRef}
          style={{ position: "absolute", inset: 0 }}
          onMouseEnter={handleGraphPointerEnter}
          onMouseLeave={handleGraphPointerLeave}
          onWheel={handleGraphWheel}
          onMouseDown={handleGraphPointerDown}
          onMouseUp={handleGraphPointerUp}
        >
          {renderer === "3d" && ForceGraph3DComponent ? (
            <ForceGraph3DComponent
              key={`3d-${filteredGraph.nodes.length}-${filteredGraph.edges.length}-${query}-${Array.from(selectedKinds).sort().join(",")}`}
              ref={forceGraph3dRef as Ref<ForceGraph3DInstance>}
              width={viewport.width}
              height={viewport.height}
              graphData={forceGraph3DData}
              backgroundColor={FORCE_GRAPH_SCENE_BACKGROUND}
              showNavInfo={false}
              nodeResolution={18}
              nodeOpacity={1}
              linkOpacity={0.56}
              enableNodeDrag={true}
              nodeLabel={(node) => node.label}
              nodeColor={(node) => {
                if (highlightedNodeIds.size === 0) return node.color;
                return highlightedNodeIds.has(node.id) ? node.color : "#334155";
              }}
              linkColor={(link) => {
                const sourceId = String(link.source);
                const targetId = String(link.target);
                if (highlightedNodeIds.size === 0) return "rgba(196,213,255,0.34)";
                return highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId)
                  ? "rgba(236,253,245,0.95)"
                  : "rgba(51,65,85,0.24)";
              }}
              linkWidth={(link) => {
                const sourceId = String(link.source);
                const targetId = String(link.target);
                if (hoveredNodeId && (sourceId === hoveredNodeId || targetId === hoveredNodeId)) return 1.4;
                return selectedNodeId && (sourceId === selectedNodeId || targetId === selectedNodeId) ? 1.8 : 0.7;
              }}
              linkDirectionalParticles={(link) => {
                const sourceId = String(link.source);
                const targetId = String(link.target);
                if (hoveredNodeId && (sourceId === hoveredNodeId || targetId === hoveredNodeId)) return 2;
                return selectedNodeId && (sourceId === selectedNodeId || targetId === selectedNodeId) ? 3 : 0;
              }}
              linkDirectionalParticleSpeed={0.0045}
              linkDirectionalParticleColor={() => "#dbeafe"}
              onNodeHover={(node) => {
                if (node) pauseAmbientMotion(1800);
                setHoveredNodeId(node?.id ?? null);
              }}
              onNodeClick={(node) => {
                pauseAmbientMotion(2600);
                setSelectedNodeId(node.id);
                const data = filteredGraph.nodes.find((graphNode) => graphNode.id === node.id);
                if (data) onNodeOpen?.(data);
              }}
              onEngineStop={() => {
                if (initial3dFitDoneRef.current) return;
                initial3dFitDoneRef.current = true;
                forceGraph3dRef.current?.cameraPosition({ x: 0, y: 0, z: 320 }, { x: 0, y: 0, z: 0 }, 0);
                forceGraph3dRef.current?.zoomToFit?.(1000, 72);
              }}
            />
          ) : null}
        </div>
      </div>
      {showControls && (
        <GraphSidebar
          availableKinds={availableKinds}
          description={description}
          filteredNodes={filteredGraph.nodes}
          nodeColor={nodeColor}
          onSearchChange={setQuery}
          onSelectKind={toggleKind}
          onSelectNode={setSelectedNodeId}
          query={query}
          renderer={renderer}
          selectedKinds={selectedKinds}
          selectedNode={selectedNode}
          selectedNodeEdges={selectedNodeEdges}
          selectedNodeNeighborCount={selectedNodeNeighborCount}
          title={title}
        />
      )}
    </div>
  );
}
