# Branches, pull requests and releases

How work moves through the repository. The checks that enforce it live in `.github/` and run on every pull request.

## The long-lived branch

`main` is the site: SvelteKit (`apps/web`) and the shared packages. It always builds, is always deployable, and only
changes through pull requests. Nothing else is long-lived.

## Short-lived branches

Named `<type>/<short-kebab-name>`, cut from `main`:

`feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`, `design/`, `security/`

Dependabot's `dependabot/...` branches are automatic. Delete a branch after its pull request merges (the repository
setting does this).

## A change, start to finish

1. **Issue.** Open one from a template (bug, feature, design task) so the reason is written down.
2. **Branch.** From `main`, named as above: `git switch -c fix/lesson-keyboard main`.
3. **Pull request** into `main`. The template asks what changed, how it was checked, and the risk.
4. **Checks.** *CI* (audit, type check, unit tests, build), *Pull request hygiene* (branch name, title, target) and
   automatic labels. The code owner (`.github/CODEOWNERS`) is asked to review.
5. **Squash merge.** One commit per pull request, titled like the pull request. Link issues with `Closes #123`.

## Releases

Tag `main` as `vMAJOR.MINOR.PATCH` and publish a GitHub Release; the notes are generated from pull-request labels
(`.github/release.yml`).

## Check where you are

```sh
git branch --show-current          # the branch you are on
git status -sb                     # "## main...origin/main" and nothing listed = clean and in sync
git log --oneline --graph -8       # recent history
```


## One-time repository setup

`scripts/github-setup.sh` (GitHub CLI, `gh auth login`) applies the settings that cannot be kept in files: squash-only
merging, a ruleset on `main` (pull request, code owner approval, passing `verify` and `naming`), protected release
tags, read-only workflow tokens and Dependabot alerts. Run it again after the repository goes public for secret
scanning, private vulnerability reporting and collaborator-only interaction limits (renew every six months).
