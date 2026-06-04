# Agent Knowledge Hub

Agent Knowledge Hub is a TypeScript toolkit for building agent-facing knowledge
systems with:

- a graph store for entities, knowledge items, interactions, and edges
- a vector store for semantic retrieval over chunks
- an indexing pipeline for chunking and embedding
- MCP helpers for agent tool surfaces
- React graph components for inspection and operations UIs

It is intentionally generic. It does not ship host-app workflow logic, private
data, or app-specific taxonomy.

## Objective

Most apps that use agents eventually need the same durable knowledge layer:

- structured profile and business knowledge
- source-backed retrieval
- graph relationships between people, companies, interactions, and facts
- repeatable indexing and backfill
- a way for agents and humans to read the same source of truth

Agent Knowledge Hub exists to provide that layer as a reusable package family
instead of rebuilding it inside every app.

## Who This Is For

Use this if you are building:

- AI products with durable memory
- internal agent operating systems
- profile / CRM / outreach systems with graph relationships
- RAG systems that need structured graph context as well as vectors
- host apps that want one knowledge source of truth rendered in multiple UIs

## What Problem It Solves

Without a dedicated knowledge runtime, teams usually end up with:

- markdown files that go stale
- duplicated profile or corporate data across UI, agents, and exports
- vector search without relationship context
- graph data without semantic retrieval
- app-specific knowledge logic that cannot be reused

Agent Knowledge Hub separates durable knowledge from operational app state and
provides a consistent runtime for indexing, retrieval, graph inspection, and
agent access.

## Monorepo Packages

- `@agent-knowledge-hub/core` - schemas, contracts, chunking, indexing, retrieval
- `@agent-knowledge-hub/neo4j` - Neo4j graph-store adapter
- `@agent-knowledge-hub/qdrant` - Qdrant vector-store adapter
- `@agent-knowledge-hub/mcp` - MCP tool builders for agent retrieval surfaces
- `@agent-knowledge-hub/react-graph` - React graph UI using Sigma.js and Graphology
- `@agent-knowledge-hub/demo-data` - synthetic demo graph for UI and migration validation

## Technology

- TypeScript
- Node.js
- `pnpm` workspaces
- Zod for schema validation
- Neo4j adapter for graph persistence
- Qdrant adapter for vector persistence
- React + Sigma.js + Graphology for graph UI
- Vitest for package tests

## Installation

### From a local checkout

```sh
pnpm install
pnpm build
pnpm test
```

### Package installation

Install only the packages you need:

```sh
pnpm add @agent-knowledge-hub/core
pnpm add @agent-knowledge-hub/neo4j @agent-knowledge-hub/qdrant
pnpm add @agent-knowledge-hub/mcp
pnpm add @agent-knowledge-hub/react-graph
```

### In a host app

Install only what the app needs. Example:

```sh
pnpm add @agent-knowledge-hub/core
pnpm add @agent-knowledge-hub/neo4j @agent-knowledge-hub/qdrant
pnpm add @agent-knowledge-hub/react-graph
```

## Setup Guide

1. Install dependencies.
2. Start local runtime services:

```sh
pnpm db:up
```

3. Seed synthetic demo data if needed:

```sh
pnpm db:seed
```

4. Build and test:

```sh
pnpm build
pnpm test
```

5. Integrate the selected packages into a host app.

## Quick Start

```ts
import { indexKnowledgeRecord } from "@agent-knowledge-hub/core";
import { Neo4jGraphStore } from "@agent-knowledge-hub/neo4j";
import { QdrantVectorStore } from "@agent-knowledge-hub/qdrant";
```

Typical flow:

1. Create or migrate durable knowledge records in the host app.
2. Upsert nodes, edges, and sources into the graph store.
3. Chunk text and generate embeddings with a host-provided embedding function.
4. Upsert chunk vectors into the vector store.
5. Retrieve semantically, then expand graph neighbors for cited context.

## Runtime Model

- Graph store:
  canonical nodes, edges, entities, interactions, sources
- Vector store:
  chunk embeddings and semantic retrieval payloads
- Host app database:
  workflows, runs, timers, operational records, and app state

The core package stays database-independent. Neo4j and Qdrant are optional
adapters, not hard dependencies of the core API.

## Documentation

- [Architecture](./docs/architecture.md)
- [Technical Specification](./docs/technical-specification.md)
- [Host App Integration](./docs/host-app-integration.md)
- [Migration Plan](./docs/migration-plan.md)
- [Local Runtime](./docs/local-runtime.md)
- [VPS Deployment](./docs/vps-deployment.md)

## Current State

- package contracts: ready
- graph/vector adapters: ready
- React graph UI: ready
- demo data: ready
- host-app migration path: documented
- local runtime and backfill flow: ready

## Non-Goals

- workflow/run-log storage
- app-specific taxonomy such as spaces/subspaces
- embedded personal or proprietary application data

## Community Files

This repository includes:

- [LICENSE](./LICENSE)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [SECURITY.md](./SECURITY.md)

The README shape follows the guidance GitHub gives for explaining why a project
is useful and how to use it, plus npm guidance to include install, configure,
and usage information in package READMEs.
