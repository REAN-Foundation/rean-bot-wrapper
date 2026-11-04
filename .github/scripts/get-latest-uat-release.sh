
#!/usr/bin/env bash
set -euo pipefail

# Expected branch naming format:
# release/uat-v2.0.0.0
# release/uat-v2.1.0.0
# release/uat-v2.10.0.0

echo "Fetching UAT release branches..."

git fetch --quiet origin \
  '+refs/heads/release/uat-v*:refs/remotes/origin/release/uat-v*'

BRANCH=$(
  git for-each-ref \
    --format='%(refname:short)' \
    'refs/remotes/origin/release/uat-v*' |
    sed 's|^origin/||' |
    sort -V |
    tail -n 1
)

if [[ -z "$BRANCH" ]]; then
  echo "Error: No UAT release branches found." >&2
  exit 1
fi

echo "Selected latest UAT release branch: $BRANCH"

echo "branch=$BRANCH" >> "$GITHUB_OUTPUT"
