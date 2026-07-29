# VPS Deployment Plan

Agent Knowledge Hub itself is a package, not a hosted service. The host app deploys
it as a dependency and runs database services separately.

## Package distribution

The current supported distribution is a reviewed Git checkout or workspace
package path pinned to a known revision. The root repository is a workspace,
not an installable runtime package. Do not use the repository root as a package
dependency.

Publish packages to npm only after the API and release process are stable. The
future npm install shape will be:

```sh
pnpm add @agent-knowledge-hub/core @agent-knowledge-hub/neo4j @agent-knowledge-hub/qdrant @agent-knowledge-hub/react-graph
```

## VPS Services

Neo4j and Qdrant are not installed by the package. They run as separate services.

Recommended production setup:

- Dedicated, private graph and vector services.
- Persistent volumes for both services.
- Private network access from the host app.
- Firewall blocks public database ports unless explicitly needed.
- Nightly volume backups before migration and during production.

Example service environment (provided by the host runtime, never committed):

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
