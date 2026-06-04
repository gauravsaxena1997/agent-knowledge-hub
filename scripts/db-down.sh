#!/usr/bin/env sh
set -eu

docker stop "${AI_KNOWLEDGE_NEO4J_CONTAINER_NAME:-agent-knowledge-hub-neo4j}" >/dev/null 2>&1 || true
docker stop "${AI_KNOWLEDGE_QDRANT_CONTAINER_NAME:-agent-knowledge-hub-qdrant}" >/dev/null 2>&1 || true
