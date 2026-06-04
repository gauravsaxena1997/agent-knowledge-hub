import type { EmbeddingVector } from "./contracts.js";

export async function deterministicTestEmbedding(text: string, dimensions = 32): Promise<EmbeddingVector> {
  const vector = Array.from({ length: dimensions }, () => 0);
  for (let index = 0; index < text.length; index += 1) {
    const bucket = index % dimensions;
    vector[bucket] = (vector[bucket] ?? 0) + text.charCodeAt(index) / 255;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return norm === 0 ? vector : vector.map((value) => value / norm);
}
