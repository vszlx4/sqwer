# Branches, pull requests and releases

How work moves through the repository. The checks that enforce it live in `.github/` and run on every pull request.

## The long-lived branches

```
<type>/<name> ──PR──▶ dev ──release PR──▶ main ──tag──▶ GitHub Release
```

- `main` is the released site: SvelteKit (`apps/web`) and the shared packages. Every commit on it is a published
  version. It only changes through release pull requests from `dev` and hotfixes. Clones and the GitHub page show it
  by default.
- `dev` is where finished work lands and waits for the next release. It always builds and passes checks, but is not
  released yet. To try what is coming: `git clone -b dev https://github.com/vszlx4/sqwer.git`.

Nothing else is long-lived.

## Short-lived branches

Named `<type>/<short-kebab-name>`, cut from `dev` (hotfixes from `main`):

`feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`, `design/`, `security/`

Dependabot's `dependabot/...` branches are automatic and target `dev`. Delete a branch after its pull request merges (the repository
setting does this).

## A change, start to finish

1. **Issue.** Open one from a template (bug, feature, design task) so the reason is written down.
2. **Branch.** From `dev`, named as above: `git switch -c fix/lesson-keyboard dev`.
3. **Pull request** into `dev`. The template asks what changed, how it was checked, and the risk. No version change:
   the version moves once per release.
4. **Checks.** *CI* (audit, type check, unit tests, build), *Pull request hygiene* (branch name, title, target) and
   automatic labels. The code owner (`.github/CODEOWNERS`) is asked to review.
5. **Squash merge.** One commit per pull request, titled like the pull request. `Closes #123` only closes issues on
   `main`, so close the issue when the pull request merges into `dev`.

## Releases

Versions follow SemVer with pre-release stages: `1.0.0-alpha.N` → `-beta.N` → `-rc.N` → `1.0.0`, then patch, minor
and major. The version lives in the root `package.json`; builds show it with the commit in the footer
(`v1.0.0-beta.1 · 3f78679`).

A release ships everything waiting on `dev` once it adds up to something worth shipping (usually a finished
milestone or parent issue), in three steps:

```sh
npm run release -- beta            # on dev: version PR into dev (beta.4 → beta.5; or alpha, rc, stable, patch, minor, major)
npm run release -- beta minor      # from a stable version: next minor as beta.1
npm run release -- promote         # on dev, after the version PR: release PR dev → main
npm run release -- publish         # on main, after the release PR: tag it and create the GitHub Release
```

The release PR is merged with a **merge commit**, never squashed, and `dev` is never deleted: the two branches then
keep one history and the next release merges without conflicts.

### Hotfixes

For a released bug that cannot wait for the next release: branch `fix/<name>` (or `security/<name>`) from `main`, run
`npm run release -- bump` (one step past `main`), open the pull request into `main`, squash merge and publish. Then
bring the same change to `dev` with a `fix/<name>-dev` branch (`git cherry-pick`) so the next release keeps it.

Release notes are generated from pull-request labels (`.github/release.yml`); `publish --notes <file>` adds text above
them. Pre-releases are marked as such on GitHub.

## Third-party components

Svelte Bits components are copied, not installed, into `apps/web/src/lib/bits/` (MIT + Commons Clause, outside the GPL;
see `NOTICE`). Copy them with the script, never by hand:

```sh
npm run bits -- list --gsap        # upstream components that need nothing beyond GSAP
npm run bits -- add split-text     # copy at upstream main; --ref <sha> pins a commit
```

`add` refuses if the upstream licence changed, writes the source and commit header, and lists the file in
`THIRD_PARTY_NOTICES`. Components that need another package (`motion`, `three`, `ogl`) are refused unless allowed with
`--allow`; port `motion` animations to GSAP instead. A unit test fails if a file and its notice entry drift apart.
Restyle copied components to the site tokens and note each edit under `Changes` in the header.

## Check where you are

```sh
git branch --show-current          # the branch you are on
git status -sb                     # "## dev...origin/dev" and nothing listed = clean and in sync
git log --oneline origin/main..origin/dev   # what the next release will ship
git log --oneline --graph -8       # recent history
```


## One-time repository setup

`scripts/github-setup.sh` (GitHub CLI, `gh auth login`) applies the settings that cannot be kept in files: rulesets on
`dev` (squash only) and `main` (merge commits for releases, squash for hotfixes), both with pull request, code owner
approval and passing `verify` and `naming`; `dev` can never be deleted or force-pushed; protected release tags, read-only workflow tokens and Dependabot alerts. Run it again after the repository goes public for secret
scanning, private vulnerability reporting and collaborator-only interaction limits (renew every six months).
