# Technical Specification

## Scope

Agent Knowledge Hub is a reusable knowledge runtime for applications that need
durable agent memory, semantic retrieval, and graph relationships.

## Core Concepts

### Node kinds

- `knowledge_item`
- `entity`
- `interaction`
- `source`
- `chunk`

### Edge kinds

The core package defines normalized edge kinds and validation. Applications may
extend the meaning of edges through metadata and application-level conventions.

### Source references

Every migrated or indexed record can carry source provenance so retrieval and
inspection remain source-backed.

## Package Responsibilities

### `@agent-knowledge-hub/core`

- schemas
- graph and vector contracts
- chunking
- indexing orchestration
- retrieval orchestration
- in-memory reference stores

### `@agent-knowledge-hub/neo4j`

- `GraphStore` implementation for Neo4j
- node, edge, and source persistence
- graph snapshot reads

### `@agent-knowledge-hub/qdrant`

- `VectorStore` implementation for Qdrant
- chunk vector writes
- semantic search over embeddings

### `@agent-knowledge-hub/mcp`

- MCP tool builders for retrieval-oriented surfaces

### `@agent-knowledge-hub/react-graph`

- graph visualization components
- knowledge graph and entity graph surfaces

### `@agent-knowledge-hub/demo-data`

- synthetic datasets for validation and demos

## Runtime Flow

1. The application emits or migrates durable knowledge records.
2. Graph store upserts canonical nodes, edges, and sources.
3. Text nodes are chunked.
4. The application provides embeddings.
5. Vector store upserts chunk vectors.
6. Retrieval combines vector results with graph expansion.

## Boundaries

Agent Knowledge Hub is not responsible for:

- job orchestration
- job history and transient execution logs
- app-specific UI state
- authentication
- embedding model hosting

## Deployment Model

- package code is consumed by an application
- graph and vector services run separately
- local and VPS deployments should use the same explicit memory profile unless workload changes justify retuning
