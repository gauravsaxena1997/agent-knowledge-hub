#!/usr/bin/env sh
set -eu

NEO4J_CONTAINER_NAME="${AI_KNOWLEDGE_NEO4J_CONTAINER_NAME:-agent-knowledge-hub-neo4j}"
QDRANT_CONTAINER_NAME="${AI_KNOWLEDGE_QDRANT_CONTAINER_NAME:-agent-knowledge-hub-qdrant}"
NEO4J_BROWSER_PORT="${AI_KNOWLEDGE_NEO4J_BROWSER_PORT:-7474}"
NEO4J_BOLT_PORT="${AI_KNOWLEDGE_NEO4J_BOLT_PORT:-7687}"
NEO4J_USERNAME="${AI_KNOWLEDGE_NEO4J_USERNAME:-neo4j}"
NEO4J_PASSWORD="${AI_KNOWLEDGE_NEO4J_PASSWORD:-agent-knowledge-hub-local}"
NEO4J_HEAP_INITIAL="${AI_KNOWLEDGE_NEO4J_HEAP_INITIAL:-192m}"
NEO4J_HEAP_MAX="${AI_KNOWLEDGE_NEO4J_HEAP_MAX:-256m}"
NEO4J_PAGECACHE="${AI_KNOWLEDGE_NEO4J_PAGECACHE:-96m}"
QDRANT_HTTP_PORT="${AI_KNOWLEDGE_QDRANT_HTTP_PORT:-6333}"
QDRANT_GRPC_PORT="${AI_KNOWLEDGE_QDRANT_GRPC_PORT:-6334}"

docker network create agent-knowledge-hub >/dev/null 2>&1 || true
docker volume create agent_knowledge_hub_neo4j_data >/dev/null
docker volume create agent_knowledge_hub_neo4j_logs >/dev/null
docker volume create agent_knowledge_hub_qdrant_data >/dev/null

if ! docker ps -a --format '{{.Names}}' | grep -qx "$NEO4J_CONTAINER_NAME"; then
  docker run -d \
    --name "$NEO4J_CONTAINER_NAME" \
    --network agent-knowledge-hub \
    --restart unless-stopped \
    -p "127.0.0.1:${NEO4J_BROWSER_PORT}:7474" \
    -p "127.0.0.1:${NEO4J_BOLT_PORT}:7687" \
    -e "NEO4J_AUTH=${NEO4J_USERNAME}/${NEO4J_PASSWORD}" \
    -e "NEO4J_server_memory_heap_initial__size=${NEO4J_HEAP_INITIAL}" \
    -e "NEO4J_server_memory_heap_max__size=${NEO4J_HEAP_MAX}" \
    -e "NEO4J_server_memory_pagecache_size=${NEO4J_PAGECACHE}" \
    -v agent_knowledge_hub_neo4j_data:/data \
    -v agent_knowledge_hub_neo4j_logs:/logs \
    neo4j:5.26-community >/dev/null
else
  docker start "$NEO4J_CONTAINER_NAME" >/dev/null
fi

if ! docker ps -a --format '{{.Names}}' | grep -qx "$QDRANT_CONTAINER_NAME"; then
  docker run -d \
    --name "$QDRANT_CONTAINER_NAME" \
    --network agent-knowledge-hub \
    --restart unless-stopped \
    -p "127.0.0.1:${QDRANT_HTTP_PORT}:6333" \
    -p "127.0.0.1:${QDRANT_GRPC_PORT}:6334" \
    -v agent_knowledge_hub_qdrant_data:/qdrant/storage \
    qdrant/qdrant:v1.18.0 >/dev/null
else
  docker start "$QDRANT_CONTAINER_NAME" >/dev/null
fi

echo "Neo4j:  http://127.0.0.1:${NEO4J_BROWSER_PORT}"
echo "Qdrant: http://127.0.0.1:${QDRANT_HTTP_PORT}/dashboard"
