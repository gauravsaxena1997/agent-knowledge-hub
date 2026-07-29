# Host App Integration

This package is designed to be consumed by a host app, not embedded with host-app-specific data.

## Integration Model

- Keep operational app data in the host app database.
- Store durable knowledge, entities, interactions, chunks, and vectors in Agent Knowledge Hub.
- Render multiple host-app surfaces from the same Agent Knowledge Hub source of truth:
  - profile views
  - corporate/application views
  - graph views
  - retrieval APIs for agents

## Suggested Cutover

1. Install the package into the host app.
2. Validate the demo dataset and graph UI.
3. Run migration dry-run against real host-app data.
4. Apply migration locally.
5. Switch read paths to Agent Knowledge Hub.
6. Keep old writes as mirrors temporarily.
7. Remove legacy mirrors only after completeness verification and backup.
