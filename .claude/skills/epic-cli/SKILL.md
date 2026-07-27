---
name: epic-cli
description: Drive the Epic CLI (`epic`) — projects, PRDs, issues, and the agent build lifecycle (plan → execute → verify → fix → review → merge). Issue and PRD content lives in the Epic database and is reached through this CLI, never through files. Use when the user asks to create a project, write or break a PRD, create/plan/build/review/merge an issue, read what an issue or PRD says, or run a preview or worktree for one. Also covers the marketplace side — publishing an issue as a request, proposals, funded contracts, and Stripe payouts. Triggers on "create a project", "generate a PRD", "break the PRD into issues", "plan this issue", "build this issue", "what does issue X say", "open the PR for this issue", "link this repo to a project", "post this issue to the marketplace", "accept this proposal", "approve the contract", "set up payouts".
---

# Epic CLI

`epic` drives a project through PRD → issues → build. Three facts shape everything below:

- **Content lives in the database.** An issue's body and a PRD's body are DB columns reached over the API. There are no `.epic/issues/*.md` or `.epic/prds/*.md` files — do not create them, do not look for them.
- **The repo carries machine config only**: the gitignored `.epic/settings.local.json` (linked `projectId`, prefix) and `.epic/.worktreeinclude`. `.epic/sessions/` holds ephemeral per-phase scratch.
- **Commands need a linked project.** Anything touching issues or PRDs fails with "this repo is not linked to a project" until `epic project link` has run in that repo.

## Check the target before any write

`epic whoami` prints the active user and the backend URL it will hit. Do that first when the session is new or the target is unclear — the same command against a different profile writes to a different world.

- `epic profile list` — all profiles, `*` on the active one. (`epic profile` with no subcommand prints help, not the list.)
- `epic --as <profile> <command>` — one-off override, or `epic profile switch <name>` to change the default.
- Credentials resolve from `EPIC_OAUTH_TOKEN`, then the pair `EPIC_API_URL` + `EPIC_ACCESS_TOKEN`, then the active profile. **`EPIC_OAUTH_TOKEN` alone targets production**, whatever the profile says. Leave those variables unset and let the profile resolve.

## Output modes: `-b` or you get silence

`epic issue list` and `epic prd list` render a TUI. Without a terminal — in a script, a pipe, an agent session — **they print nothing and exit 0**, which reads exactly like an empty project. Always pass `-b`:

| Want | Command |
|---|---|
| List issues | `epic issue list -b` |
| List PRDs | `epic prd list -b` |
| Read an issue body | `epic issue show <ID> -b` |
| Read a PRD body | `epic prd show <PRD-ID>` |
| Active agent sessions | `epic issue sessions` · `epic prd sessions` |
| Agent transcript | `epic issue log <ID> [--session build\|verify\|merge]` |

Anything that runs an agent (`build`, `plan`, `execute`, `verify`, `fix`, `review`, `generate`, `break`, `interview`) attaches a live viewer by default. Pass `-b` to detach and return immediately; without it, in a non-interactive context, the command holds the terminal.

## Create and link

```bash
epic project new todo-app --web        # scaffold + GitHub repo + register (no spaces in the name)
epic project list                      # ID / STATUS / PREFIX / NAME / DATE
epic project link <8-char-id-or-exact-name>   # link an existing repo; --force skips the origin check
```

`--web` scaffolds from the epic-web template and is the type the build lifecycle expects; `--terminal` and `--empty` exist for other shapes. `--online` also provisions a cloud sandbox.

Three things `project new` does that are easy to be surprised by: the name **cannot contain
spaces** (`todo-app`, not "Todo App"), it **creates a real repository in the user's GitHub
account** through `gh`, and it registers the project on the backend the active profile points
at. Confirm the name and the target before running it. `project link` refuses a repo whose
git origin does not match the project's repo — `--force` links anyway and records that it was
forced.

## PRD → issues

```bash
epic prd generate "<one paragraph describing the product>" -b   # authors PRD-N in the DB
epic prd show PRD-1                                             # read what it wrote
epic prd plan PRD-1 -b                                          # rewrite the body as a structured spec
epic prd break PRD-1 -b                                         # decompose into issues, in dependency order
epic issue list -b                                              # the issues it created
```

`break` writes each issue through the API with its `dependsOn` edges, so `epic project build` can walk them in order. `--replace` redoes a breakdown, deleting its untouched issues first. A finished breakdown settles the PRD on `ready` — decomposed, nothing running — whichever client ran it. `building` means a build actually started (`prd build` sets it).

## One issue, end to end

```bash
epic issue new "Add a todo list page"    # title only; prints the identifier
epic issue build TOD-3 --local -b        # plan → execute → verify → fix, on this machine
epic issue log TOD-3                     # what the agent did
epic issue pr TOD-3                      # push the branch, open the PR
epic issue approve TOD-3                 # merge and mark Done
```

`epic issue new` takes a **title only** — there is no flag for the body. The body is authored by a build phase, by `epic issue interview <ID>`, or in the web app.

`--local` runs the worktree and agent here; `--remote` posts a cloud build (add `--foreground` to poll it to completion). `--mode manual` (the default) stops at In Review for `epic issue approve`; `--mode auto` self-merges each issue. Individual phases run standalone: `epic issue plan|execute|verify|fix|review <ID> -b`.

A remote build only works against a **publicly reachable backend**. The CLI inside the cloud
sandbox is pointed at the app's own base URL, so a backend on `localhost` is the sandbox's
loopback, not yours: the sandbox provisions and then the build dies on its first call home.
Use `--local` against a local backend, and keep `--remote` for staging or production.

`epic issue log` reads a **local** build's transcript from disk. A remote build's transcript
lives in the web app, not on this machine.

## The content contract during a phase

Each phase fetches the issue body from the API into a scratch buffer, hands the agent that **absolute path** in the prompt, and PATCHes the file back when the phase ends. So:

- Edit the file the prompt names. Never invent a path, never write under `.epic/issues/` or `.epic/prds/`, and never assume the file survives the run.
- While a build is active the content is locked to that build's grant. A write from anywhere else gets `409 ISSUE_LOCKED_BUILDING` — the answer is to wait or stop the build, not to retry harder.
- A stuck job self-heals: a build whose state has not moved for 30 minutes releases the lock on the next write.

## Marketplace: an issue, a proposal, a paid contract

The same issue can be handed to an outside developer. Money moves through this flow, so
every command below is an action in the real world, not a draft.

```bash
# client — open the issue to the marketplace and pick an offer
epic request new 42 --budget 800        # <issue-id>; budget is orientative, USD only
epic proposal list --for 42             # what came in
epic proposal accept <proposal-id>      # creates the contract, and the client then funds it

# developer — take the work and deliver
epic contract list                      # yours, as client or developer
epic contract start <ref>               # waits for the client's payment to clear
epic contract submit <ref> -m "Done" --link https://github.com/org/repo/pull/1
epic payouts setup                      # Stripe onboarding, once, before getting paid

# client — close it out
epic contract approve <ref>             # completes the contract and releases the money
epic contract changes <ref> -m "Add tests"   # send it back instead
```

`<ref>` is a contract or request UUID, or the numeric issue id it came from.

Actions that cannot be walked back: `proposal accept` (creates a funded obligation),
`proposal reject` and `proposal withdraw` (permanent), `contract approve` (releases
payment), `contract dispute`. Each prompts for confirmation; **`--yes` skips that prompt**,
so only pass it when the user has asked for that exact action. `contract refund` freezes the
contract for up to 7 days while the developer answers with `refund-accept` / `refund-reject`.

`epic contract watch <ref>` follows a contract's status live and exits on
completed/refunded. `epic contract pay` is a debug poll of payment status — `contract start`
already waits for the payment, so reach for `pay` only when diagnosing. `epic payouts setup`
defaults to **country BR**; pass `--country <iso2>` for anyone else, and finish the KYC in the
browser at the URL it prints. Marketplace admin commands (`admin freelancer …`) need an admin
profile, usually via `epic --as <admin-profile>`.

## When something looks stuck

| Symptom | What it means | Do this |
|---|---|---|
| A list command printed nothing | TUI with no terminal | Re-run with `-b` |
| "session in progress" but nothing is running | Sidecar outlived its tmux session | `epic issue stop <ID>` / `epic prd stop <ID>`, then re-run |
| `409 ISSUE_LOCKED_BUILDING` | A build owns the content | `epic issue sessions`; wait, or stop the build |
| "not linked to a project" | No `projectId` in this repo | `epic project link <ref>` |
| "Your session has expired" | Token is stale | `epic login` |
| A write landed somewhere unexpected | Wrong profile | `epic whoami` before writes |
| A detached (`-b`) agent vanished right after starting | Its tmux server was a child of the shell that launched it and died with it | Launch it detached from the process group: `setsid epic issue build <ID> --local -b` |
| A remote build starts, then fails on its first call home | The sandbox cannot reach a `localhost` backend | Build `--local`, or point at a publicly reachable backend |

Content that was already PATCHed is safe in the database; a phase that dies mid-flight leaves
its buffer on disk and settles on the next foreground run of that phase.

## Full command surface

Every command, subcommand and flag: `references/commands.md`. Any command also prints its own usage — `epic <command> --help`, `epic <command> <subcommand> --help`.
