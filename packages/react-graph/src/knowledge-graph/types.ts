import type { ComponentType, Ref } from "react";
import type { KnowledgeEdge, KnowledgeNode, KnowledgeNodeKind as KnowledgeNodeKindValue } from "@agent-knowledge-hub/core";

export type KnowledgeGraphology = import("graphology").MultiDirectedGraph;
export type GraphRendererMode = "2d" | "3d";

export type SigmaRenderer = {
  kill: () => void;
  on: (event: "clickNode", handler: (payload: { node: string }) => void) => void;
};

export type ForceGraph3DNodeObject = {
  id: string;
  label: string;
  color: string;
  kind: KnowledgeNodeKindValue;
  val: number;
  degree: number;
  x?: number;
  y?: number;
  z?: number;
};

export type ForceGraph3DLinkObject = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type ForceGraph3DInstance = {
  cameraPosition: (
    position: { x?: number; y?: number; z?: number },
    lookAt?: { x?: number; y?: number; z?: number },
    ms?: number,
  ) => void;
  zoomToFit?: (ms?: number, padding?: number, filterFn?: (node: ForceGraph3DNodeObject) => boolean) => void;
};

export type ForceGraph3DProps = {
  backgroundColor?: string;
  enableNodeDrag?: boolean;
  graphData: {
    nodes: ForceGraph3DNodeObject[];
    links: ForceGraph3DLinkObject[];
  };
  height?: number;
  linkColor?: (link: ForceGraph3DLinkObject) => string;
  linkDirectionalParticles?: (link: ForceGraph3DLinkObject) => number;
  linkDirectionalParticleColor?: () => string;
  linkDirectionalParticleSpeed?: number;
  linkOpacity?: number;
  linkWidth?: (link: ForceGraph3DLinkObject) => number;
  nodeColor?: (node: ForceGraph3DNodeObject) => string;
  nodeLabel?: (node: ForceGraph3DNodeObject) => string;
  nodeOpacity?: number;
  nodeResolution?: number;
  onEngineStop?: () => void;
  onNodeClick?: (node: ForceGraph3DNodeObject) => void;
  onNodeHover?: (node: ForceGraph3DNodeObject | null) => void;
  showNavInfo?: boolean;
  width?: number;
};

export type ForceGraph3DComponentType = ComponentType<ForceGraph3DProps & { ref?: Ref<ForceGraph3DInstance> }>;

export interface KnowledgeGraphViewProps {
  graph: import("@agent-knowledge-hub/core").GraphSnapshot;
  height?: number | string;
  nodeColor?: (node: KnowledgeNode) => string;
  edgeLabel?: (edge: KnowledgeEdge) => string;
  onNodeOpen?: (node: KnowledgeNode) => void;
  className?: string;
  title?: string;
  description?: string;
  showControls?: boolean;
  renderer?: GraphRendererMode;
}
