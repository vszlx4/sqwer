# Branches, pull requests and releases

How work moves through the repository. The checks that enforce it live in `.github/` and run on every pull request.

## The long-lived branches

| Branch | What it is | Who changes it |
| --- | --- | --- |
| `main` | The stable site: SvelteKit (`apps/web`) and the shared packages. Always builds, always deployable. | Pull requests only |
| `v2/react-rewrite` | The second version, rebuilt in React. Starts from the same packages and the documents in `docs/design`. | Pull requests only |

Nothing else is long-lived. `v2/react-rewrite` becomes `main`'s next version in one pull request when it is ready
(title "Release v2: React rewrite"); until then `main` keeps shipping fixes for the current site.

## Short-lived branches

Named `<type>/<short-kebab-name>`, cut from `main`:

`feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`, `design/`, `security/`

Work on the rewrite is cut from `v2/react-rewrite` and prefixed with `v2/`: `v2/feat-landing-hero`,
`v2/fix-lesson-keyboard`, `v2/chore-sync-main`.

Dependabot's `dependabot/...` branches are automatic. Delete a branch after its pull request merges (the repository
setting does this).

## A change, start to finish

1. **Issue.** Open one from a template (bug, feature, design task) so the reason is written down.
2. **Branch.** From the right base, named as above: `git switch -c fix/lesson-keyboard main`.
3. **Pull request** into the base it was cut from. The template asks what changed, how it was checked, and the risk.
4. **Checks.** *CI* (audit, type check, unit tests, build), *Pull request hygiene* (branch name, title, target) and
   automatic labels. The code owner (`.github/CODEOWNERS`) is asked to review.
5. **Squash merge.** One commit per pull request, titled like the pull request. Link issues with `Closes #123`.

## Keeping the rewrite current

Fixes land on `main` first. Bring them into the rewrite with a pull request from `v2/chore-sync-main` (a branch that
has `main` merged into it) into `v2/react-rewrite`. Never merge `v2/react-rewrite` into `main` piecemeal.

## Releases

Tag `main` as `vMAJOR.MINOR.PATCH` and publish a GitHub Release; the notes are generated from pull-request labels
(`.github/release.yml`).

## Check where you are

```sh
git branch --show-current          # the branch you are on
git status -sb                     # "## main...origin/main" and nothing listed = clean and in sync
git log --oneline --graph -8       # recent history
```

On `main` the root has `apps/web`, `packages/`, `docs/`; on `v2/react-rewrite` it also has `archive/`.

## One-time repository setup

`scripts/github-setup.sh` (needs the GitHub CLI, signed in with `gh auth login`) applies the settings that cannot be
kept in files: squash-only merging, automatic branch deletion, and rulesets that require a pull request and a passing
`verify` check on both long-lived branches. Branch rulesets on private repositories need a paid GitHub plan.
