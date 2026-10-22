#!/usr/bin/env bash
# One-time GitHub repository setup. Safe to run again. Needs the GitHub CLI: `brew install gh && gh auth login`.
set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
echo "Configuring $REPO"

# Merge strategy: squash only, delete branches after merging, allow auto-merge, issues on.
gh api -X PATCH "repos/$REPO" \
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY \
  -F delete_branch_on_merge=true -F allow_auto_merge=true -F allow_update_branch=true \
  -F has_issues=true -F has_wiki=false -F has_projects=false >/dev/null
echo "Repository settings applied"

ruleset() { # name, branch
  local name="$1" ref="$2" existing
  existing=$(gh api "repos/$REPO/rulesets" -q ".[] | select(.name==\"$name\") | .id" 2>/dev/null || true)
  local body
  body=$(cat <<JSON
{
  "name": "$name",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/$ref"], "exclude": [] } },
  "bypass_actors": [ { "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "pull_request" } ],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [ { "context": "verify" }, { "context": "naming" } ] } }
  ]
}
JSON
)
  if [ -n "$existing" ]; then
    echo "$body" | gh api -X PUT "repos/$REPO/rulesets/$existing" --input - >/dev/null
  else
    echo "$body" | gh api -X POST "repos/$REPO/rulesets" --input - >/dev/null
  fi
  echo "Ruleset '$name' applied to $ref"
}

ruleset "Protect main" "main" || echo "Could not apply the ruleset (private repositories need a paid plan); set the rules by hand from docs/operations/BRANCHING.md"
ruleset "Protect the React rewrite" "v2/react-rewrite" || true

# Labels come from .github/labels.json via the "Sync labels" workflow: run it once now.
gh workflow run "Sync labels" >/dev/null 2>&1 && echo "Label sync started" || echo "Run the 'Sync labels' workflow after the first push to main"
echo "Done."
