import type { GraphStore } from "./contracts.js";
import type { GraphSnapshot, KnowledgeEdge, KnowledgeNode, SourceRef } from "./schema.js";

export class InMemoryGraphStore implements GraphStore {
  private readonly nodes = new Map<string, KnowledgeNode>();
  private readonly edges = new Map<string, KnowledgeEdge>();
  private readonly sources = new Map<string, SourceRef>();

  async upsertNode(node: KnowledgeNode): Promise<KnowledgeNode> {
    this.nodes.set(node.id, node);
    return node;
  }

  async upsertEdge(edge: KnowledgeEdge): Promise<KnowledgeEdge> {
    this.edges.set(edge.id, edge);
    return edge;
  }

  async upsertSource(source: SourceRef): Promise<SourceRef> {
    this.sources.set(source.id, source);
    return source;
  }

  async getNode(id: string): Promise<KnowledgeNode | null> {
    return this.nodes.get(id) ?? null;
  }

  async listNodes(): Promise<KnowledgeNode[]> {
    return Array.from(this.nodes.values());
  }

  async listEdges(): Promise<KnowledgeEdge[]> {
    return Array.from(this.edges.values());
  }

  async listSources(): Promise<SourceRef[]> {
    return Array.from(this.sources.values());
  }

  async neighborhood(nodeId: string, depth: number): Promise<GraphSnapshot> {
    const seen = new Set<string>([nodeId]);
    const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];
    const selectedEdges = new Map<string, KnowledgeEdge>();

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || current.depth >= depth) continue;

      for (const edge of this.edges.values()) {
        if (edge.fromId !== current.id && edge.toId !== current.id) continue;
        selectedEdges.set(edge.id, edge);
        const nextId = edge.fromId === current.id ? edge.toId : edge.fromId;
        if (!seen.has(nextId)) {
          seen.add(nextId);
          queue.push({ id: nextId, depth: current.depth + 1 });
        }
      }
    }

    return {
      nodes: Array.from(seen)
        .map((id) => this.nodes.get(id))
        .filter((node): node is KnowledgeNode => node !== undefined),
      edges: Array.from(selectedEdges.values()),
      sources: Array.from(this.sources.values()),
    };
  }

  async deleteNode(id: string): Promise<void> {
    this.nodes.delete(id);
    for (const edge of this.edges.values()) {
      if (edge.fromId === id || edge.toId === id) this.edges.delete(edge.id);
    }
  }
}
