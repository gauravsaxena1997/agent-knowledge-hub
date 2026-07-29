# Local Runtime

Use this before VPS migration so memory, disk, dashboards, and migration behavior
are visible locally.

The maintained local memory profile is:

- heap initial: `192m`
- heap max: `256m`
- page cache: `96m`

## Start

```sh
pnpm db:up
```

## Dashboards

- Neo4j Browser: <http://localhost:7474>
- Qdrant REST dashboard/API: <http://localhost:6333/dashboard>

Neo4j local credentials:

- user: `neo4j`
- password: `agent-knowledge-hub-local`

## Health Checks

```sh
curl http://localhost:6333/healthz
curl http://localhost:7474
docker stats agent-knowledge-hub-neo4j agent-knowledge-hub-qdrant
docker system df -v
```

## Seed Demo Data

```sh
pnpm db:seed
```

This writes the synthetic demo graph to Neo4j and vector chunks to Qdrant.

Expected demo result:

- Neo4j `KnowledgeNode`: 18
- Neo4j `KNOWLEDGE_EDGE`: 18
- Qdrant collection: `agent_knowledge_hub_local`
- Qdrant points: 18

## Baseline Local Resource Usage

Measured on local Docker with the maintained memory profile:

- Neo4j: about 400 to 450 MiB RAM after startup settles.
- Qdrant: about 25 to 35 MiB RAM.
- Neo4j disk: roughly a few hundred MB even for small datasets because service overhead dominates at this scale.
- Qdrant disk: small for demo datasets, grows mostly with chunk count and embedding size.

These numbers are dominated by service overhead plus a tiny demo dataset, not by
business-data volume. Re-tune only when the graph size or query pressure grows.

## Stop

```sh
pnpm db:down
```

## Delete Local Database Volumes

This removes local test data only.

```sh
pnpm db:reset
```
