# Migration Plan

This plan is for moving an existing local-file knowledge base into Agent Knowledge Hub
Core without migrating workflows or run logs.

## Phase 0: Demo Acceptance

- Validate `@agent-knowledge-hub/demo-data` inside the host app.
- Confirm graph categories, node kinds, edge kinds, detail panels, and filters.
- Confirm that knowledge graph and entity graph answer different UI questions.
- Confirm source/chunk/embedding states are understandable before real import.

Exit criteria: the package UI and demo graph are accepted without requiring real
host-app data.

## Phase 1: Source Inventory

Include:

- profile facts
- portfolio facts
- corporate/application answers
- people
- companies
- interactions
- frameworks/templates/tactics
- durable universal knowledge

Exclude:

- workflow definitions
- workflow run history
- slash-run logs
- transient app logs
- host-app space/subspace taxonomy

Output: inventory report with file paths, parsed record counts, skipped paths,
and parser warnings.

## Existing Application Database Records

Do not move operational host-app records out of the application database during
knowledge migration.

The migration should create knowledge records as an indexed projection:

- The application database remains the owner of operational records.
- Agent Knowledge Hub stores durable facts, entities, source references, chunks, and graph edges.
- Every imported database-backed fact must keep a source reference such as
  `host-app-db:<table>:<id>`.
- If an operational record changes, the host app should re-index the affected
  knowledge nodes and vectors.

Examples:

- profile/corporate data: indexed as `knowledge_item` and `entity` nodes.
- portfolio/project facts: indexed as `knowledge_item` nodes, linked to source records.
- leads/people/companies: indexed as `entity` nodes.
- outreach events: indexed as `interaction` nodes.
- application status: index only durable facts needed by agents; keep transactional
  status ownership in the application database.

## Current Profile, Portfolio, and People Data

Profile and corporate data should become first-class knowledge records, but the
migration should not delete the original source during the first cutover.

Mapping:

- name, email, headline, bio: `entity` owner node plus supporting `knowledge_item` nodes.
- portfolio link, GitHub, LinkedIn, X, Contra, website links: owner/profile metadata plus individual `knowledge_item` records when agents need to quote or choose them.
- corporate profile, services, capabilities, cautionary/application answers: `knowledge_item` records tagged by meaning such as `corporate`, `application-answer`, `service`, `about-me`.
- freelancing positioning and offers: `knowledge_item` records linked to the owner entity.
- portfolio projects: `knowledge_item` records; optionally `entity` records if a project needs relationships.
- `.agent/people` person/company records: `entity` nodes.
- `.agent/people` outreach/profile events: `interaction` nodes.
- empty/deprecated markdown files: migrate no records, but include them in the dry-run skipped-file report.

Deprecation rule:

- `.agent/people` becomes read-only after migration acceptance.
- New people, companies, and interactions are written to the graph database.
- Old files are removed only after backup, dry-run comparison, and acceptance.

## Phase 2: Dry-Run Mapping

Map sources into:

- `knowledge_item`: durable fact, framework, answer, template, tactic, project fact.
- `entity`: person, company, profile/account, product, project when it acts like an entity.
- `interaction`: LinkedIn, Wellfound, email, call, application, or outreach event.
- `source`: source document or imported record provenance.
- `chunk`: embeddable text segment linked to a parent node.

Output: dry-run graph snapshot, duplicate report, stale/conflict report, and
embedding cost estimate.

## Phase 3: VPS Runtime Readiness

- Neo4j service is installed and reachable.
- Qdrant service is installed and reachable.
- Backups are configured before first production write.
- Environment variables are configured in the host app.
- Migration command can run in dry-run and apply modes.

## Phase 4: Apply Migration

1. Upsert sources.
2. Upsert nodes.
3. Upsert edges.
4. Chunk text.
5. Generate embeddings.
6. Upsert vectors.
7. Run retrieval and graph consistency checks.

Every write must be idempotent. Re-running migration should update changed
records, not duplicate them.

## Phase 5: Host App Cutover

- Keep old knowledge screens during validation.
- Add agent retrieval APIs backed by Agent Knowledge Hub.
- Compare old answers and new retrieval outputs.
- Freeze local MD writes after acceptance.
- Remove old tabs/files only after verification and backup.
