
#!/usr/bin/env bash
set -euo pipefail

echo "Fetching UAT release branches..."

git fetch --quiet origin \
  '+refs/heads/release/uat-v*:refs/remotes/origin/release/uat-v*'

# Accept only branches using the release/uat-vMAJOR.MINOR.PATCH format.
BRANCH=$(
  git for-each-ref \
    --format='%(refname:short)' \
    'refs/remotes/origin/release/uat-v*' |
    sed 's|^origin/||' |
    grep -E '^release/uat-v[0-9]+\.[0-9]+\.[0-9]+$' |
    sort -V |
    tail -n 1
)

if [[ -z "$BRANCH" ]]; then
  echo "::error::No release branches found matching release/uat-vMAJOR.MINOR.PATCH"
  exit 1
fi

echo "Selected latest UAT release branch: $BRANCH"
echo "branch=$BRANCH" >> "$GITHUB_OUTPUT"
