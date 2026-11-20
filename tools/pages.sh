#!/usr/bin/env bash
# pages.sh [message file] — puts the built board, dist/ as it is committed, on the gh-pages branch, which GitHub Pages serves.
# Run it from the repository's root once a fresh build is committed: npm run build, commit, npm run pages.
set -euo pipefail
if ! git diff --quiet HEAD -- dist; then echo "dist/ has changes that are not committed yet"; exit 1; fi
tree=$(git rev-parse HEAD:dist)
parent=""
if git ls-remote --exit-code --heads origin gh-pages >/dev/null 2>&1; then
  git fetch -q origin +refs/heads/gh-pages:refs/remotes/origin/gh-pages
  parent=$(git rev-parse refs/remotes/origin/gh-pages)
  if [ "$(git rev-parse "$parent^{tree}")" = "$tree" ]; then echo "gh-pages already holds this build"; exit 0; fi
fi
msg=${1:-}
if [ -n "$msg" ]; then commit=$(git commit-tree "$tree" ${parent:+-p "$parent"} -F "$msg")
else commit=$(git commit-tree "$tree" ${parent:+-p "$parent"} -m "Board from $(git rev-parse --short HEAD)"); fi
git push origin "$commit:refs/heads/gh-pages"
echo "published $(git rev-parse --short "$commit") to gh-pages"
