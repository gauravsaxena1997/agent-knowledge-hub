# @agent-knowledge-hub/react-graph

Reusable React graph UI components for Agent Knowledge Hub. The package owns
Sigma.js and Graphology dependencies so applications can import graph components
directly.

The package supports two renderer modes:

- `3d`: interactive force-directed view powered by `react-force-graph-3d`
- `2d`: structured graph view powered by `Sigma.js` and `Graphology`

Applications can choose which mode to render at runtime without changing the
underlying graph data shape.

## Install

```sh
pnpm add @agent-knowledge-hub/react-graph @agent-knowledge-hub/core react react-dom
```

Use this package when an application needs knowledge-graph or entity-graph
inspection surfaces without re-implementing graph rendering.

## When To Use It

Use this package when application users need to inspect graph structure,
traverse relationships, or validate imported knowledge visually.

## Renderer Modes

### `3d`

Use `3d` when you want a more exploratory graph experience:

- force-directed layout with depth and clustering
- semantic node colors by node kind
- node sizing based on connection count
- focus, reset, and fit camera controls
- ambient motion while idle, which pauses during user interaction
- stronger hovered and selected relationship highlighting

This mode is best for discovery, demos, and visual inspection of graph
connectivity. It should still behave as a real graph surface rather than a
decorative particle scene.

### `2d`

Use `2d` when you want a more literal and controlled graph inspection
experience:

- Sigma.js renderer for dense graph readability
- deterministic 2D panning and zooming
- direct node and edge inspection with the same graph snapshot input

This mode is best for users who prefer a flatter and more analysis-oriented
view.

## Experience Model

The package is designed so both modes preserve graph meaning:

- colors communicate node kind, not arbitrary styling
- edges represent real connectivity from the provided `GraphSnapshot`
- node size communicates relative connection count
- the sidebar remains the source of truth for selected node details
- `EntityGraphView` filters the snapshot to entity and interaction nodes only
- `KnowledgeGraphView` can show the full graph, including chunks and knowledge items

## Current Semantic Colors

The default semantic palette is:

- `Entity`: blue
- `Interaction`: green
- `Knowledge Item`: purple
- `Chunk`: gray

Applications can override node coloring through the `nodeColor` prop when they
need product-specific styling.

## Usage

```tsx
import { EntityGraphView, KnowledgeGraphView } from "@agent-knowledge-hub/react-graph";

<KnowledgeGraphView
  graph={graph}
  renderer="3d"
  title="Knowledge Graph"
  description="Full graph with entities, interactions, chunks, and knowledge items."
/>;

<EntityGraphView
  graph={graph}
  renderer="2d"
  title="Entity Graph"
  description="People, companies, and interactions only."
/>;
```

## Public Props

`KnowledgeGraphView` and `EntityGraphView` support the same renderer-facing
surface:

- `graph`: graph snapshot from `@agent-knowledge-hub/core`
- `renderer`: `"2d" | "3d"`
- `height`: viewport height
- `nodeColor`: optional node color override
- `edgeLabel`: optional edge label formatter
- `onNodeOpen`: optional node selection callback
- `className`: optional container class
- `title`: optional panel title
- `description`: optional panel description
- `showControls`: toggle in-viewport graph controls

## Implementation Notes

- `3d` mode uses [`react-force-graph-3d`](https://github.com/vasturiano/react-force-graph)
- `2d` mode uses `Sigma.js` with `Graphology`
- both modes consume the same `GraphSnapshot` structure from `@agent-knowledge-hub/core`
- the recommended product pattern is to keep renderer choice in the consuming app while keeping graph behavior inside this package
