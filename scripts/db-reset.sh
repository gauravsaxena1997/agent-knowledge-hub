#!/usr/bin/env sh
set -eu

docker rm -f "${AI_KNOWLEDGE_NEO4J_CONTAINER_NAME:-agent-knowledge-hub-neo4j}" >/dev/null 2>&1 || true
docker rm -f "${AI_KNOWLEDGE_QDRANT_CONTAINER_NAME:-agent-knowledge-hub-qdrant}" >/dev/null 2>&1 || true
docker volume rm agent_knowledge_hub_neo4j_data >/dev/null 2>&1 || true
docker volume rm agent_knowledge_hub_neo4j_logs >/dev/null 2>&1 || true
docker volume rm agent_knowledge_hub_qdrant_data >/dev/null 2>&1 || true
