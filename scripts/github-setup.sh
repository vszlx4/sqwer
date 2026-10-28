#!/usr/bin/env bash
# Repository settings, rulesets and security. Safe to re-run; run again after going public.
set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
VISIBILITY=$(gh repo view "$REPO" --json visibility -q .visibility)
echo "Configuring $REPO ($VISIBILITY)"

gh api -X PATCH "repos/$REPO" \
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY \
  -F delete_branch_on_merge=true -F allow_auto_merge=true -F allow_update_branch=true \
  -F has_issues=true -F has_wiki=false -F has_projects=false >/dev/null
echo "Repository settings applied"

# Workflows get read-only tokens and cannot approve pull requests.
gh api -X PUT "repos/$REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false
echo "Workflow permissions applied"

# GitHub-owned actions only.
gh api -X PUT "repos/$REPO/actions/permissions" -F enabled=true -f allowed_actions=selected
gh api -X PUT "repos/$REPO/actions/permissions/selected-actions" -F github_owned_allowed=true -F verified_allowed=false
echo "Actions restricted to GitHub-owned"

ruleset() { # name, json body
  local name="$1" body="$2" existing
  existing=$(gh api "repos/$REPO/rulesets" -q ".[] | select(.name==\"$name\") | .id")
  if [ -n "$existing" ]; then
    echo "$body" | gh api -X PUT "repos/$REPO/rulesets/$existing" --input - >/dev/null
  else
    echo "$body" | gh api -X POST "repos/$REPO/rulesets" --input - >/dev/null
  fi
  echo "Ruleset '$name' applied"
}

# main: PR, one code owner approval, squash only. Admin bypass via PR.
ruleset "Protect main" '{
  "name": "Protect main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "bypass_actors": [ { "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "pull_request" } ],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": true,
        "required_review_thread_resolution": true,
        "allowed_merge_methods": ["squash"] } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [ { "context": "verify" }, { "context": "naming" } ] } }
  ]
}'

# Release tags: admins only.
ruleset "Protect release tags" '{
  "name": "Protect release tags",
  "target": "tag",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/tags/v*"], "exclude": [] } },
  "bypass_actors": [ { "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "always" } ],
  "rules": [ { "type": "creation" }, { "type": "update" }, { "type": "deletion" } ]
}'

gh api -X PUT "repos/$REPO/vulnerability-alerts"
gh api -X PUT "repos/$REPO/automated-security-fixes"
echo "Dependabot alerts and security updates enabled"

if [ "$VISIBILITY" != "PUBLIC" ]; then
  echo "Private: run again after going public for secret scanning, vulnerability reporting and interaction limits."
  exit 0
fi

echo '{ "security_and_analysis": {
  "secret_scanning": { "status": "enabled" },
  "secret_scanning_push_protection": { "status": "enabled" } } }' | gh api -X PATCH "repos/$REPO" --input - >/dev/null
gh api -X PUT "repos/$REPO/private-vulnerability-reporting"
echo "Secret scanning, push protection and private vulnerability reporting enabled"

gh api -X PATCH "repos/$REPO/code-scanning/default-setup" -f state=configured -f query_suite=default >/dev/null
echo "CodeQL default setup enabled"

# Fork pull requests run no workflows until approved.
gh api -X PUT "repos/$REPO/actions/permissions/fork-pr-contributor-approval" -f approval_policy=all_external_contributors
echo "Fork workflow approval applied"

# Accounts under 24 hours old are blocked. collaborators_only also blocks feedback issues and vulnerability reports.
# Six months; re-run to renew.
gh api -X PUT "repos/$REPO/interaction-limits" -f limit=existing_users -f expiry=six_months >/dev/null
echo "Interaction limited to existing users"

echo "Done."
