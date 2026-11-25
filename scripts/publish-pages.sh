#!/usr/bin/env bash
set -euo pipefail

# Build the committed source and publish it using a normal, non-forced push.
cd "$(git rev-parse --show-toplevel)"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Commit your changes before publishing." >&2
  exit 1
fi
npm run lint
npm run typecheck
npm test
npm run build -- --base=/praxifold/

source_commit=$(git rev-parse --short HEAD)
remote=$(git remote get-url origin)
stage=$(mktemp -d)
trap 'rm -rf -- "$stage"' EXIT
git clone --quiet --no-checkout "$remote" "$stage"
if git -C "$stage" show-ref --verify --quiet refs/remotes/origin/gh-pages; then
  git -C "$stage" switch --quiet gh-pages
  git -C "$stage" rm -rq -- .
else
  git -C "$stage" switch --orphan gh-pages
fi
cp -R dist/. "$stage/"
touch "$stage/.nojekyll"
git -C "$stage" add -A
if ! git -C "$stage" diff --cached --quiet; then
  git -C "$stage" commit -qm "Publish Praxifold from $source_commit"
  git -C "$stage" push origin HEAD:gh-pages
fi
