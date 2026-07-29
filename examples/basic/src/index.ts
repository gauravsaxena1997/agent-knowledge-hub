import {
  DefaultKnowledgeIndexer,
  DefaultKnowledgeRetriever,
  InMemoryGraphStore,
  InMemoryVectorStore,
  deterministicTestEmbedding,
} from "@agent-knowledge-hub/core";
import { GENERIC_AGENT_KNOWLEDGE_HUB_DEMO_GRAPH } from "@agent-knowledge-hub/demo-data";

const graphStore = new InMemoryGraphStore();
const vectorStore = new InMemoryVectorStore();
const indexer = new DefaultKnowledgeIndexer({
  graphStore,
  vectorStore,
  embedText: deterministicTestEmbedding,
});
const retriever = new DefaultKnowledgeRetriever({
  graphStore,
  vectorStore,
  embedText: deterministicTestEmbedding,
});

for (const source of GENERIC_AGENT_KNOWLEDGE_HUB_DEMO_GRAPH.sources) {
  await graphStore.upsertSource(source);
}

for (const node of GENERIC_AGENT_KNOWLEDGE_HUB_DEMO_GRAPH.nodes) {
  await indexer.indexNode(node);
}

for (const edge of GENERIC_AGENT_KNOWLEDGE_HUB_DEMO_GRAPH.edges) {
  await graphStore.upsertEdge(edge);
}

const results = await retriever.retrieve({
  query: "How should an agent answer with source-backed context?",
  limit: 3,
  expandDepth: 1,
});

console.log(
  JSON.stringify(
    {
      sources: GENERIC_AGENT_KNOWLEDGE_HUB_DEMO_GRAPH.sources.length,
      nodes: GENERIC_AGENT_KNOWLEDGE_HUB_DEMO_GRAPH.nodes.length,
      edges: GENERIC_AGENT_KNOWLEDGE_HUB_DEMO_GRAPH.edges.length,
      results,
    },
    null,
    2,
  ),
);
