# Contributing

Code contributions are by invitation. Anyone can leave feedback on the website through the **Feedback** issue
template. Changes land on `dev` after a code owner (`.github/CODEOWNERS`) approves them, and reach `main`
with the next release.

1. Open an issue from a template, or pick one.
2. Branch from `dev` as `fix/short-name` or `feat/short-name`.
3. Run `npm install`, then before pushing: `npm run check`, `npm test`, `npm run build`.
4. Open a pull request into `dev` and fill in the template.
5. When CI is green and a code owner approves, it is squash merged.

Details, naming rules and the release process: [docs/operations/BRANCHING.md](docs/operations/BRANCHING.md).
Security problems: report privately, see [.github/SECURITY.md](.github/SECURITY.md).
