---
name: epic
description: Drive the Epic CLI (`epic`) — projects, PRDs, issues, and the agent build lifecycle (plan → execute → verify → fix → review → merge). Issue and PRD content lives in the Epic database and is reached through this CLI, never through files. Use when the user asks to create a project, write or break a PRD, register a PRD they already have, create/plan/build/review/merge an issue, read what an issue or PRD says, run a preview or worktree for one, or set up the machine to build at all. Also covers the marketplace side — publishing an issue as a request, proposals, funded contracts, and Stripe payouts. Triggers on "create a project", "generate a PRD", "here is my PRD", "import this PRD", "I already have the PRD", a pasted product spec to turn into issues, "break the PRD into issues", "plan this issue", "build this issue", "what does issue X say", "open the PR for this issue", "link this repo to a project", "why won't my build start", "connect Claude", "set up the agent credential", "post this issue to the marketplace", "accept this proposal", "approve the contract", "set up payouts".
---

# Epic CLI

`epic` drives a project through PRD → issues → build. Four facts shape everything below:

- **Content lives in the database.** An issue's body and a PRD's body are DB columns reached over the API. There are no `.epic/issues/*.md` or `.epic/prds/*.md` files — do not create them, do not look for them.
- **The repo carries machine config only**: the gitignored `.epic/settings.local.json` (linked `projectId`, prefix) and `.epic/.worktreeinclude`. `.epic/sessions/` holds ephemeral per-phase scratch.
- **Commands need a linked project.** Anything touching issues or PRDs fails with "this repo is not linked to a project" until `epic project link` has run in that repo.
- **A build is local unless you ask for the cloud.** `--remote` (alias `--cloud`) is the only thing that sends a build to a sandbox. Nothing else — no project setting, no environment — makes that decision for you.

## Setup, once — and `epic doctor` is how you check it

```bash
epic doctor          # every prerequisite, and the exact fix for each gap
```

Run it first when a build misbehaves. It checks this machine (`gh`, git), the Epic login, the lifecycle skills this repo needs, and — when the repo is linked — what a cloud build additionally requires: the GitHub app and the agent credential **on your account**. It only reports; it never fixes.

Its exit code carries the verdict, so `epic doctor && epic issue build …` is safe: **a local gap exits 1** (nothing builds), a cloud-only gap exits **0** and says local builds are ready.

The three things it will tell you to do:

```bash
epic login                    # authenticate (see the pty note below)
epic skill install            # the workflow skills the build prompts follow
epic credential login         # mint + store the token cloud builds authenticate with
```

`epic skill install` is not optional flavour. Each build phase hands the agent a prompt saying *follow the project's execute skill (`.claude/skills/execute/SKILL.md`)* — a path relative to the repo being built. In a repo without those files the agent finds nothing and improvises: the build still runs, just not the way it was designed to. Once per machine for `epic`, once per repo for the lifecycle skills.

## The agent credential: which build needs what

The two build targets authenticate differently, and confusing them is the most common false alarm.

| Build | Authenticates with | Set up by |
|---|---|---|
| local (default) | the `claude` **on this machine**, with whatever login it already has | `claude` itself — nothing to do in Epic |
| `--remote` | a token stored on your **Epic account** | `epic credential login` |

So a laptop with a perfectly good `claude` login and an empty account still cannot build in the cloud — and a missing account credential never blocks a local build.

```bash
epic credential login                  # mint + store + verify, in one step (needs a terminal)
epic credential login --skip-mint      # you already have a token; just paste it
epic credential status                 # what the account has, and whether it still works
epic credential delete                 # erase it from the account

claude setup-token                     # mint by hand; prints the token, saves it nowhere
pbpaste | epic credential set          # store one you already have — piping keeps it out of history
epic credential set --token sk-ant-oat01-…
```

`credential login` hands the terminal to `claude setup-token` (which opens a browser and blocks), then takes the paste and verifies it with Anthropic. **It needs a TTY** — an agent or a script cannot run it, and the CLI's own remedies know that: without a terminal they tell you to ask the user to mint with `claude setup-token` and then store it with `epic credential set --token <token>`. Do that, rather than blocking on an interactive command.

That token is one-year and **inference-only** — it can run the agent and nothing else with the account. It belongs to the **account**, not to a repo, and a build authenticates as the project's owner wherever it runs.

`epic credential status` asks Anthropic whether the token still works, and exits non-zero when the answer is no. Three answers, and they mean different things: connected, **rejected** (mint a new one), and **could not reach Anthropic** — which is a statement about the network, not about the token.

## Check the target before any write

`epic whoami` prints the active user and the backend URL it will hit. Do that first when the session is new or the target is unclear — the same command against a different profile writes to a different world.

It answers *where*, not *whether*: `whoami` reports the stored profile and **does not validate the token**, so it prints a clean name and email against a session that expired weeks ago. The cheap real check is any read that hits the API — `epic project list` — which is what surfaces `Your session has expired`.

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

Anything that runs an agent (`build`, `plan`, `execute`, `verify`, `fix`, `review`, `generate`, `break`, `interview`) attaches a live viewer by default. Pass `-b` to detach and return immediately; without it, in a non-interactive context, the command holds the terminal. On the builds that take a viewer, `--no-tty` is the middle ground: it shows progress and exits when the build ends, instead of waiting for a `q` nobody will press.

`attach` is the exception that cannot be worked around: `tmux attach` requires a controlling terminal, so **`epic issue attach` / `epic prd attach` refuse without a TTY** rather than starting an agent nothing can reach. To see what a session is doing from a script, use `sessions` and `log`.

### `epic login` has no `-b` — give it a pty

`epic login` renders its device-authorization flow through the same TUI, and has no `-b`. With
no terminal it prints **nothing and exits 1** — the verification URL and code never appear.
Wrap it in a pty:

```bash
script -qec "epic login <profile> --url <backend-url>" /dev/null
```

The output is a raw ANSI dump with the URL and the 8-character code among the escape
sequences. It blocks polling until approved, so run it in the background.

## Typos are refused, not absorbed

Every `project`, `prd`, `issue`, `doctor` and `credential` subcommand declares the flags it
accepts, and anything else **exits 1 naming what it does accept**. `--provider` is validated
against the set that command allows (`claude`, `claude-headless`, `codex`, `opencode`; the PRD
authoring commands take `claude|codex`), and a value-taking flag left without a value
(`--status`, `--base`, `--token`, `--limit`) is an error rather than "absent". So a mistyped
flag never runs a whole build on a different agent, or a different operation than the one
typed.

## Create and link

```bash
epic project new todo-app --web        # scaffold + GitHub repo + register (no spaces in the name)
epic project list                      # ID / STATUS / PREFIX / NAME / DATE
epic project link <8-char-id-or-exact-name>   # link an existing repo; --force skips the origin check
```

`epic project` is lifecycle only — `new`, `list`, `link`. **Nothing under `project` runs an
agent or builds.** Issues are built through the PRD that owns them (`epic prd build <PRD-ID>`,
which stacks them on the `prd-<n>` integration branch and opens one PR) or one at a time
(`epic issue build <ID>`).

`--web` scaffolds from the epic-web template and is the type the build lifecycle expects;
`--terminal` and `--empty` exist for other shapes. Projects register as **local**; `--remote`
(alias `--cloud`) also provisions a sandbox and registers a cloud project.

Three things `project new` does that are easy to be surprised by: the name **cannot contain
spaces** (`todo-app` or `org/todo-app`, not "Todo App" — extra positionals are refused), it
**creates a real repository in the user's GitHub account**, and it registers the project on the
backend the active profile points at. Confirm the name and the target before running it.
`project link` refuses a repo whose git origin does not match the project's repo — `--force`
links anyway and records that it was forced.

## PRD → issues

```bash
epic prd import ./prd.md                                        # a document you ALREADY have, verbatim
epic prd generate "<one paragraph describing the product>" -b   # or: let an agent author PRD-N
epic prd show PRD-1                                             # read what it wrote
epic prd plan PRD-1 -b                                          # rewrite the body as a structured spec
epic prd break PRD-1 -b                                         # decompose into issues, in dependency order
epic issue list -b                                              # the issues it created
epic prd build PRD-1                                            # build them onto prd-1, in order
epic prd approve PRD-1                                          # merge prd-1 -> main, PRD done
```

`break` writes each issue through the API with its `dependsOn` edges, so `prd build` can walk
them in order. `--replace` redoes a breakdown, deleting its untouched issues first, and is
refused if any of them has started. A finished breakdown settles the PRD on `ready` —
decomposed, nothing running; `building` means a build actually started.

`epic prd approve` is the landing, not a check: it merges the `prd-<n> → main` pull request,
stamps the PRD `done`, deletes the integration branch and points the project sandbox at the new
main. It is valid only from `in_review` (every issue done), and the server owns that gate.

**Two different `--local` flags, on purpose.** On `prd build` it means *where the build runs*.
On `prd generate` / `prd break` it means *do not touch the backend at all* — offline authoring.

### The user already has the PRD — `import`, never `generate`

When the document exists — pasted into the conversation, sent over WhatsApp, written in another
tool — it goes in **verbatim**:

```bash
epic project new recipe-box --web     # only if there is no project yet
epic prd import ./prd.md              # the document, byte for byte
epic prd break PRD-1 -b               # issues, in dependency order
```

`epic prd generate "<the pasted text>"` is the wrong reflex and the expensive one: it spends an
agent run **rewriting** a document that was already final, and returns the model's wording in
place of the author's. `import` runs no agent, takes one round trip, and stores exactly what it
was given.

- `--title "…"` overrides the title; without it the title is the document's first `# ` heading,
  then the file name.
- `--prd PRD-2` **replaces** that PRD's document instead of creating one. It is also how you
  finish an import whose content write failed — the error names that exact command.
- `-` reads the document from stdin (`cat prd.md | epic prd import -`).
- Refused rather than half-done: a missing file, a directory, an empty document, one over
  100,000 characters, or `--title` with no value.

**Write the file with your file-writing tool, never a shell heredoc.** A PRD is full of `$VAR`,
backticks and quotes; an unquoted heredoc expands `$DATABASE_URL` to nothing and can execute
what is inside backticks, corrupting the document silently. If you must use a heredoc, quote the
delimiter (`<<'EOF'`).

## One issue, end to end

```bash
epic issue new "Add a todo list page"    # title only; prints the identifier
epic issue build TOD-3 -b                # plan → execute → verify → fix, on this machine
epic issue log TOD-3                     # what the agent did
epic issue pr TOD-3                      # push the branch, open the PR
epic issue approve TOD-3                 # merge and mark Done
```

`epic issue new` takes a **title only** — there is no flag for the body. The body is authored by a build phase, by `epic issue interview <ID>`, or in the web app.

**Two independent axes, and they are not alternatives to each other.** Local vs `--remote` is
*where* the build runs; `--mode auto|manual` is *how it finishes*. `--mode manual` (the default)
stops at In Review for `epic issue approve`; `--mode auto` self-merges each issue. Individual
phases run standalone: `epic issue plan|execute|verify|fix|review <ID> -b`.

A remote build only works against a **publicly reachable backend**. The CLI inside the cloud
sandbox is pointed at the app's own base URL, so a backend on `localhost` is the sandbox's
loopback, not yours: the sandbox provisions and then the build dies on its first call home.
Build locally against a local backend, and keep `--remote` for staging or production.

`--record` films each scenario during every verify attempt, one video per acceptance
criterion, and the review page plays them back. Off by default because filming slows the
phase — turn it on when the question is *why did verify think this passed*.

`epic issue log` reads a **local** build's transcript from disk. A remote build's transcript
lives in the web app, not on this machine.

## The content contract during a phase

Each phase fetches the issue body from the API into a scratch buffer, hands the agent that **absolute path** in the prompt, and PATCHes the file back when the phase ends. So:

- Edit the file the prompt names. Never invent a path, never write under `.epic/issues/` or `.epic/prds/`, and never assume the file survives the run.
- While a build is active the content is locked to that build's grant. A write from anywhere else gets `409 ISSUE_LOCKED_BUILDING` — the answer is to wait or stop the build, not to retry harder.
- A stuck job self-heals: a build whose state has not moved for 30 minutes releases the lock on the next write.

## Stopping the right thing

`epic issue stop` and `epic prd stop` end a **local** tmux session and settle its sidecar — this
is the fix for "session in progress" when nothing is running. `prd stop` also returns a PRD
frozen in `generating` or `breaking` to `draft`, which is the state the command exists to
rescue; a PRD in `building` is left alone, because that status belongs to the issue build queue.

A cloud build has no session on this machine, and there is **no CLI command that stops one** —
stop it from the web app.

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
| Anything about a build, before guessing | — | `epic doctor` |
| A list command printed nothing | TUI with no terminal | Re-run with `-b` |
| A cloud build is refused for a missing agent credential | The account has no token; the machine's `claude` login is a different thing | `epic credential login` — or, with no TTY, have the user run `claude setup-token` and store it with `epic credential set --token …` |
| A cloud build authenticates, then the agent fails on auth | The stored token was revoked | `epic credential status` to confirm, then mint and set a new one |
| "session in progress" but nothing is running | Sidecar outlived its tmux session | `epic issue stop <ID>` / `epic prd stop <ID>`, then re-run |
| A PRD sits in `generating` / `breaking` forever | Its agent was killed, so the settle hook never ran | `epic prd stop <PRD-ID>` — it reverts the status to `draft` |
| Nothing here stops a cloud build | `issue stop` / `prd stop` are local-session commands | Stop it from the web app |
| `409 ISSUE_LOCKED_BUILDING` | A build owns the content | `epic issue sessions`; wait, or stop the build |
| "not linked to a project" | No `projectId` in this repo | `epic project link <ref>` |
| `epic project build` is not a command | Project-level building does not exist | `epic prd build <PRD-ID>`, or `epic issue build <ID>` |
| "Your session has expired" | Epic token is stale (not the agent's) | `epic login` — under a pty, see above |
| `epic login` printed nothing and exited 1 | TUI device flow with no terminal, and there is no `-b` | Re-run under a pty: `script -qec "epic login …" /dev/null` |
| `whoami` looks healthy but every command says the session expired | `whoami` reads the stored profile without validating the token | Trust `epic project list`, not `whoami`, then `epic login` |
| A write landed somewhere unexpected | Wrong profile | `epic whoami` before writes |
| `attach` refuses with "needs a terminal" | tmux cannot take over a non-TTY stdin | Use `sessions` / `log`, or attach from an interactive shell |
| "unknown flag(s) for …" | The subcommand does not accept it | Use one of the accepted flags it names |
| A detached (`-b`) build printed the reason it died | The parent watches for an early exit and quotes the log | Fix what the quoted log says, then re-run |
| A detached (`-b`) agent vanished right after starting | Its tmux server was a child of the shell that launched it and died with it | Launch it detached from the process group: `setsid epic issue build <ID> -b` |
| A remote build starts, then fails on its first call home | The sandbox cannot reach a `localhost` backend | Build locally, or point at a publicly reachable backend |
| The agent ignored the plan/execute/verify workflow | The repo has no lifecycle skills for the prompt to name | `epic skill install --project` |

Content that was already PATCHed is safe in the database; a phase that dies mid-flight leaves
its buffer on disk and settles on the next foreground run of that phase.

## Full command surface

Every command, subcommand and flag: `references/commands.md`. Any command also prints its own usage — `epic <command> --help`, `epic <command> <subcommand> --help`.
