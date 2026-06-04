# Architecture

Agent Knowledge Hub separates truth, search, and visualization.

## Monorepo

This repository is a `pnpm` TypeScript monorepo.

- `@agent-knowledge-hub/core`: database-independent schemas, contracts, indexing, retrieval.
- `@agent-knowledge-hub/neo4j`: optional Neo4j adapter.
- `@agent-knowledge-hub/qdrant`: optional Qdrant adapter.
- `@agent-knowledge-hub/mcp`: optional MCP bridge for agents.
- `@agent-knowledge-hub/react-graph`: optional React/Sigma.js graph UI.
- `@agent-knowledge-hub/demo-data`: optional synthetic demo graph.

The package boundary is deliberate: applications should be able to use `core`
without installing Neo4j, Qdrant, React, or Sigma.js.

## Stores

- Graph store: source of truth for nodes, edges, sources, entities, interactions, and knowledge items.
- Vector store: semantic index over chunks.
- Host app store: operational application data such as tasks, workflows, projects, or app-specific records.

## Data Flow

1. Host app submits a knowledge item, entity, or interaction.
2. The graph store upserts canonical nodes and edges.
3. The indexer chunks text and requests embeddings from the host-provided embedding function.
4. The vector store upserts chunk vectors with payloads linking back to graph nodes.
5. Retrieval searches the vector store, expands graph context, and returns cited context packets.

## Edge Ownership

Edge instances live in the graph store. Code defines edge schemas and validation only.
Host apps may extend edge types through configuration.

## Platform Independence

The core API is database-independent.

- Neo4j is one `GraphStore` implementation.
- Qdrant is one `VectorStore` implementation.
- Future adapters can target Memgraph, ArangoDB, Postgres, Pinecone, Weaviate, Chroma, or custom services.

Applications install only the packages they need.

## Knowledge vs Entity Graph

The knowledge graph includes every node kind:

- knowledge items
- entities
- interactions
- source nodes
- chunk nodes

The entity graph is a filtered operational graph:

- people
- companies
- interaction nodes
- relationship edges between them

Agents usually retrieve semantic context from the vector store, then expand graph
neighbors from the knowledge graph. UI users often inspect the entity graph first
because it is less noisy.
