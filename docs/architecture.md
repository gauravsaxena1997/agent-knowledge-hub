# Architecture

Agent Knowledge Hub separates knowledge truth, semantic search, and visual
inspection into explicit layers.

## Monorepo Packages

- `@agent-knowledge-hub/core`: database-independent schemas, contracts, indexing, and retrieval
- `@agent-knowledge-hub/neo4j`: optional Neo4j adapter for graph persistence
- `@agent-knowledge-hub/qdrant`: optional Qdrant adapter for vector persistence
- `@agent-knowledge-hub/mcp`: optional MCP bridge for agent tool surfaces
- `@agent-knowledge-hub/react-graph`: optional React graph UI
- `@agent-knowledge-hub/demo-data`: optional synthetic dataset for local validation

Applications should be able to use `core` without installing Neo4j, Qdrant,
React, or Sigma.js.

## Stores

- Graph store: source of truth for nodes, edges, entities, activities, and sources
- Vector store: semantic index over chunks
- Application store: operational data such as jobs, tickets, scheduling state, or other app-specific records

## Data Flow

1. The application submits a knowledge item, entity, or activity.
2. The graph store upserts canonical nodes and edges.
3. The indexer chunks text and requests embeddings from the host-provided embedding function.
4. The vector store upserts chunk vectors with payloads that link back to graph nodes.
5. Retrieval searches the vector store, expands graph context, and returns cited context packets.

## Platform Independence

The core API is database-independent.

- Neo4j is one `GraphStore` implementation.
- Qdrant is one `VectorStore` implementation.
- Future adapters can target other graph or vector backends.

Applications install only the packages they need.

## Knowledge Graph vs Entity Graph

The knowledge graph includes every node kind:

- knowledge items
- entities
- interactions
- source nodes
- chunk nodes

The entity graph is a filtered operational view:

- people
- companies
- activity nodes
- relationship edges between them

Agents usually retrieve semantic context from the vector store and then expand
graph neighbors from the knowledge graph. UI users often inspect the entity
graph first because it is less noisy.
