# VPS Deployment Plan

Agent Knowledge Hub itself is a package, not a hosted service. The host app deploys
it as a dependency and runs database services separately.

## Package Distribution

Recommended sequence:

1. Develop locally from a normal Git checkout of `agent-knowledge-hub`.
2. Publish the package repository to GitHub.
3. Consume it in the host app through a Git dependency while private.
4. Publish packages to npm when the API stabilizes.

Temporary install shape:

```sh
pnpm add github:gauravsaxena1997/agent-knowledge-hub
```

Production package shape after npm publishing:

```sh
pnpm add @agent-knowledge-hub/core @agent-knowledge-hub/neo4j @agent-knowledge-hub/qdrant @agent-knowledge-hub/react-graph
```

## VPS Services

Neo4j and Qdrant are not installed by the package. They run as separate services.

Recommended VPS setup:

- Docker Compose for Neo4j and Qdrant.
- Persistent volumes for both services.
- Private network access from the host app.
- Firewall blocks public database ports unless explicitly needed.
- Nightly volume backups before migration and during production.

Example service environment:

```env
AI_KNOWLEDGE_GRAPH_DRIVER=neo4j
NEO4J_URI=bolt://127.0.0.1:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=change-me
AI_KNOWLEDGE_VECTOR_DRIVER=qdrant
QDRANT_URL=http://127.0.0.1:6333
QDRANT_COLLECTION=agent_knowledge_hub
```

Recommended starting Neo4j memory profile for a small single-user knowledge base:

- heap initial: `192m`
- heap max: `256m`
- page cache: `96m`

This keeps the current local dataset under roughly `500 MB` Neo4j RAM while
preserving successful graph queries and MCP retrieval smoke tests.

## Sizing

For a small personal/company knowledge base, expect low idle usage.

- Neo4j: persistent service, commonly a few hundred MB to around 1 GB RAM depending on config.
- Qdrant: persistent service, often tens of MB to low hundreds of MB at small scale.
- Disk: vectors grow with chunk count and embedding dimension; metadata and graph data stay relatively small.
- Host-app package code adds negligible runtime memory compared with database services.

On an 8 GB VPS, run conservative memory limits and monitor after first import.

## Deployment Order

1. Deploy package dependency to the host app without real migration.
2. Start Neo4j and Qdrant services.
3. Run health checks.
4. Run migration dry-run on VPS.
5. Review report.
6. Run migration apply.
7. Run retrieval smoke tests.
8. Enable agent access.
