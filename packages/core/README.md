# @agent-knowledge-hub/core

Core package for agent-facing knowledge systems. It provides schemas, store
contracts, chunking, indexing, and retrieval orchestration without binding to a
specific database backend.

## Install

```sh
pnpm add @agent-knowledge-hub/core
```

## What It Includes

- normalized node, edge, chunk, and source schemas
- graph and vector store contracts
- indexing helpers
- retrieval helpers
- display formatters for application UIs

## When To Use It

Use this package when you want the data model and retrieval pipeline without
committing to a specific graph database, vector database, or UI layer.

## What It Does Not Own

- graph database provisioning
- vector database provisioning
- embedding model hosting
- application-specific taxonomy or operational state
