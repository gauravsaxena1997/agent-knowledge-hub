# Contributing

## Contribution flow

1. Fork the repository.
2. Create a feature branch in your fork.
3. Keep the change focused and add tests for behavior changes.
4. Open a pull request to this repository's `main` branch.

External contributors do not receive write access to the upstream repository. Only maintainers may merge pull requests or push to protected branches.

## Setup

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

## Contribution requirements

- Keep public APIs backward-compatible unless the pull request documents a deliberate breaking change.
- Add or update documentation when contracts or examples change.
- Do not commit private application data, secrets, credentials, proprietary material, or database exports.
- Use synthetic data in examples and tests.

## Release readiness

Before proposing a release, run `pnpm release:check`. Maintainers also verify package contents, the production dependency audit, protected-branch checks, and downstream compatibility before tagging a source release.
