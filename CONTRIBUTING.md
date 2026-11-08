# Contributing

Anyone can report a problem, suggest an idea or share feedback; no coding needed (below). Code contributions are by
invitation. Changes land on `dev` after a code owner (`.github/CODEOWNERS`) approves them, and reach `main` with the
next release.

## Report a problem or share an idea

1. **Sign in to GitHub.** No account? [Create one for free](https://github.com/signup); only an email is needed.
2. **Check it isn't there already.** Look through the [open issues](https://github.com/vszlx4/sqwer/issues). If
   yours is listed, add a comment or a 👍 to it instead of a new one.
3. **Open the form.** Go to [New issue](https://github.com/vszlx4/sqwer/issues/new/choose) and pick what fits:

   | Pick | When | Example |
   | --- | --- | --- |
   | Report a problem | Something is broken, wrong or confusing | The streak shows 1 day after three days of practice |
   | Suggest an idea | Something new, or a change | Pick any game in Practice |
   | Share feedback | A thought on how the site feels | The Echo game feels slow |
   | Ask a question | Not sure how something works | Do typing tests count toward my streak? |

4. **Write a short title** that says the whole thing in a few words.
5. **Fill in the form** in your own words. Skip what you don't know. A screenshot helps most: drag it into the box,
   or paste it with Ctrl+V (Cmd+V on Mac). Take one with Win+Shift+S on Windows, Cmd+Shift+4 on Mac, or the power
   and volume-down buttons on a phone.
6. **Submit.** You get an email when we reply. We may ask a question, link a fix, or close it with a note.

Good to know:

- **One thing per report.** Two problems, or a problem and an idea, go in separate reports.
- **Never share passwords or email addresses** in an issue; issues are public. Security problems go to the
  [private form](https://github.com/vszlx4/sqwer/security/advisories/new) instead.

### What the labels mean

We set labels; you don't need to.

| Label | Meaning |
| --- | --- |
| `triage` | New, not looked at yet |
| `bug` | Confirmed as broken |
| `enhancement` | An idea we plan to build |
| `feedback`, `question` | A thought or a question |
| `area: …` | Where on the site, from the form |
| `external` | From someone outside the team |
| `blocked` | Waits on other work first |
| `duplicate`, `wontfix` | Already reported, or not planned; the closing comment says why |

## Code

1. Open an issue from a template, or pick one.
2. Branch from `dev` as `fix/short-name` or `feat/short-name`.
3. Run `npm install`, then before pushing: `npm run check`, `npm test`, `npm run build`.
4. Open a pull request into `dev` and fill in the template.
5. When CI is green and a code owner approves, it is squash merged.

Details, naming rules and the release process: [docs/operations/BRANCHING.md](docs/operations/BRANCHING.md).
Security problems: report privately, see [.github/SECURITY.md](.github/SECURITY.md).
