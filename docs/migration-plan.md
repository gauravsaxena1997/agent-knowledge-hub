# Migration Guide

Use this guide to project durable records from an application into Agent Knowledge Hub. Keep the application database as the owner of transactional state; Agent Knowledge Hub stores a source-backed retrieval projection.

## What to include

- product, service, policy, and reference knowledge
- organizations, customers, partners, and teams
- durable support, review, or account activities
- source references and imported records that agents may cite

## What to exclude

- scheduler state, job queues, and transient execution logs
- credentials, access tokens, private configuration, and raw database dumps
- application-only UI state and short-lived cache entries

## Migration sequence

1. Inventory source records and classify each as knowledge, entity, activity, source, or chunk.
2. Run a dry run that reports parsed records, skips, duplicates, and embedding cost estimates without writing to target stores.
3. Back up target stores and verify graph and vector connectivity.
4. Upsert sources, nodes, edges, chunks, and vectors idempotently.
5. Run retrieval and graph-consistency checks using source citations.
6. Switch host read paths only after completeness comparison and approval.

## Ownership and provenance

Every imported record should retain a stable source reference, for example `host-record:<collection>:<id>`. When a source changes, re-index the affected nodes and vectors. Do not delete the original application source during the first cutover.
