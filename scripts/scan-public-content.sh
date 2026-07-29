#!/usr/bin/env sh
set -eu

forbidden_terms='career.?os|pathrix|signalledger|signal.?ledger|vivahverse|upwork|wellfound|linkedin|\.agent/people|portfolio|job.?application|outreach'
secret_terms='AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----'

if git grep -n -i -E "$forbidden_terms" -- . ':(exclude)README.md' ':(exclude)docs/release-process.md' ':(exclude)scripts/scan-public-content.sh'; then
  echo "Public-content scan found repository-specific material." >&2
  exit 1
fi

if git grep -n -E "$secret_terms" -- .; then
  echo "Public-content scan found a possible credential." >&2
  exit 1
fi

echo "Public-content scan passed."
