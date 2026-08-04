# Epic CLI — full command surface

Read this when the main skill does not cover the command you need. Every command also
prints its own usage: `epic <command> --help`.

Conventions used below:

- `-b` — plain text instead of the TUI on read commands; detach instead of attaching a
  viewer on agent commands.
- `--provider claude|claude-headless|codex|opencode` — which agent runs the phase (the PRD
  authoring commands accept `claude|codex`). Defaults to the project's agent, read from the
  API. An unknown value, or the flag with no value, is an error naming the accepted set.
- `--model NAME` — override the Claude model for every agent in the run.
- `<ID>` — an issue identifier (`TOD-3`), its sequence number (`3`), or its raw id.
  `<PRD-ID>` — `PRD-1`, `1`, or the uuid.
- Every subcommand below rejects flags it does not accept (exit 1, naming the accepted set),
  and refuses a value-taking flag left without a value.

## project

Lifecycle only — nothing here runs an agent or builds. Building goes through
`epic prd build <PRD-ID>` (the fan-out, one PR per PRD) or `epic issue build <ID>` (one issue).

| Command | Notes |
|---|---|
| `epic project new [name] [--web\|--terminal\|--empty] [--codex\|--opencode] [--remote\|--cloud]` | Name takes no spaces; `org/repo-name` is accepted, extra positionals are refused. Local by default: scaffold + a repo in the user's GitHub account + registration. `--remote` also provisions a sandbox and registers a cloud project. No name → interactive wizard. |
| `epic project list [--owned\|--team] [--limit N] [--cursor C]` | Columns: ID (8 chars) / STATUS / PREFIX / NAME / DATE. `link` accepts the 8-char ID shown here, or the exact NAME — not the PREFIX. `--limit` must be a positive integer. |
| `epic project link [ref] [--force]` | Links this repo to a project and writes `.epic/settings.local.json` (+ the `.epic` gitignore entries). No ref prints the current link. `--force` links even when the git origin does not match the project's repo. |

## issue

| Command | Notes |
|---|---|
| `epic issue new [title] [--verbose]` | Title only — the body is authored later. No title → interactive wizard. Prints the identifier the backend assigned. Creation always goes through the API. |
| `epic issue list [status] [-b]` | Optional status filter. **Prints nothing without `-b`** when there is no TTY. |
| `epic issue show <ID> [-b]` | Metadata then the body. |
| `epic issue build <ID> [--local\|--remote] [-b] [--foreground] [--no-tty] [--mode auto\|manual] [--base BRANCH] [--model NAME] [--provider P] [--record]` | plan → execute → verify → fix loop. **Local unless `--remote` (alias `--cloud`)** — no project setting decides this, and the resolution is offline. `--base` cuts the worktree from another branch. `--foreground` applies to remote builds (poll to completion). `--no-tty` exits the viewer when the build ends instead of waiting for `q`. A `-b` build that dies right after detaching is reported with its log, not as success. |
| `epic issue plan\|execute\|verify\|fix\|review <ID> [-b] [--provider P] [--model NAME]` | Individual phases. `verify` also takes `-p PORT` (default 3000) and `--record` (one video per scenario; off by default because it slows the phase). |
| `epic issue interview <ID> [--provider P]` | Q&A that rewrites the issue body. |
| `epic issue pr <ID>` | Push the worktree branch and open (or surface) its PR. |
| `epic issue merge <ID>` · `epic issue approve <ID>` | Agent-driven merge into main; `approve` also sets the issue Done. |
| `epic issue close <ID>` · `epic issue assign <ID> <user>` | Status/assignee changes. |
| `epic issue worktree <ID>` · `epic issue run <ID> -- <cmd>` | Create the worktree; run a command with its cwd set to that worktree (exit code propagates). |
| `epic issue attach <ID>` · `epic issue message <ID> "<text>" [--session build\|verify\|merge] [-b]` | Attach to a live agent session; send it a message (resumes it). `attach` requires a TTY and refuses without one, before anything is spent. |
| `epic issue log <ID> [--session build\|verify\|merge]` | Reads the transcript from disk, so it works after the session ends. Local builds only — remote transcripts live in the web app. |
| `epic issue sessions` · `epic issue stop <ID>` | List tmux-backed sessions; end one and settle its sidecar (this is the fix for a stale "session in progress"). Local only — no CLI command stops a cloud build; use the web app. |
| `epic issue start <ID> [--foreground] [--model NAME]` | Alias of `build --remote`, retained for compatibility. Prefer `build --remote`. |

## prd

| Command | Notes |
|---|---|
| `epic prd new [title] [--interview\|--generate] [--provider P] [-b] [--verbose]` | Creates the PRD record. `--generate` / `--interview` continue straight into that command on the PRD just created (with no title, they skip the wizard's mode picker); `--provider` and `-b` pass through. |
| `epic prd import <file\|-> [--title "<title>"] [--prd PRD-ID]` | Stores a document the USER wrote, **verbatim** — no agent, one round trip. `-` reads stdin. Title: `--title`, else the first `# ` heading, else the file name (capped at 200 chars). `--prd` replaces that PRD's document instead of creating one, and is also how you finish an import whose content write failed (the error names the command). Refuses a missing file, a directory, an empty document, one over 100,000 characters, and `--title` with no value. Takes no `--provider`/`-b`: nothing runs, nothing detaches. |
| `epic prd generate [PRD-ID\|description] [-b] [--local] [--provider claude\|codex]` | Authors the body with an agent — from a description (creates a draft) or from an existing PRD's body. `--local` here means offline authoring (no backend), not a build target. **Not the command for a document that already exists** — it rewrites it; use `import`. |
| `epic prd show <PRD-ID> [-b]` | Prints identifier, status and the body verbatim. |
| `epic prd list [--status draft\|generating\|breaking\|ready\|building\|in_review\|done\|archived] [--refresh] [-b]` | **Prints nothing without `-b`** when there is no TTY. `ready` = decomposed, nothing running; `building` = a build actually started. |
| `epic prd plan <PRD-ID> [-b] [--provider P]` | Rewrites the body as a structured spec. |
| `epic prd interview <PRD-ID> [--provider P]` | Q&A that rewrites the body. |
| `epic prd break <PRD-ID> [-b] [--replace] [--local] [--provider P]` | Decomposes into issues, created through the API in dependency order with their `dependsOn` edges. `--replace` deletes the previous breakdown's untouched issues first (addressed by row id) and is refused if any have started. On success the PRD settles on `ready`. `--local` = offline authoring. |
| `epic prd build <PRD-ID> [--local\|--remote] [-b] [--mode auto\|manual] [--foreground] [--no-tty] [--record]` | Builds the PRD's issues in dependency order, stacking them onto the `prd-<n>` branch. Local unless `--remote` (alias `--cloud`). |
| `epic prd approve <PRD-ID>` | Lands the PRD: merges its `prd-<n> → main` PR, sets the status `done`, deletes the integration branch and points the sandbox at the new main. Valid only from `in_review`; idempotent once done. `--squash` is refused with the reason (the PRD PR lands as a merge commit). |
| `epic prd attach <PRD-ID>` · `epic prd sessions` | Session control, same shape as the issue commands. `attach` lazily starts the PRD's agent — but only on a TTY, which it checks first. |
| `epic prd stop <PRD-ID>` | Ends the session and settles the sidecar, **and** reverts a PRD stuck in `generating` / `breaking` back to `draft`. `building` is left alone (it belongs to the issue build queue). |

## setup, auth and profiles

Two different credentials, and mixing them up is the usual confusion. The **Epic** login
(`epic login`) is who you are to the backend. The **agent** credential (`epic credential`) is
what a cloud build authenticates to Anthropic with. A local build uses neither — it runs the
`claude` on this machine with whatever login that already has.

| Command | Notes |
|---|---|
| `epic doctor` | Every prerequisite for a build — machine, Epic login, agent credential, this repo's lifecycle skills, and (when linked) the cloud-build requirements — with the fix for each gap. Reports only; never writes. **Exits 1 on a local gap** (nothing builds); a cloud-only gap exits 0 and says local builds are ready. |
| `epic skill install [<name>…] [--user\|--project] [--type web\|terminal] [--check] [--force] [--prune] [-y]` | Installs the skills the build prompts name by relative path. Without them the agent improvises. `--check` exits 1 if anything is missing or stale (CI). Hand-edited skills are reported and skipped unless `--force`. |
| `epic skill list` | Every bundled skill and its status at both targets. Never writes. |
| `epic credential login [--skip-mint]` | Mint and store in one step: hands the terminal to `claude setup-token`, takes the paste, verifies it with Anthropic. **Needs a TTY** — `setup-token` opens a browser and blocks, so a script or an agent cannot use this. `--skip-mint` when the token was minted elsewhere. |
| `epic credential set [--token <tok>]` | Stores a token you already have — the non-interactive door. With no `--token` it reads stdin: prefer `pbpaste \| epic credential set`, since an argument lands in shell history and `ps`. `--token` without a value is refused rather than falling through to stdin. |
| `epic credential status [--no-verify]` | What the **account** has on file, and whether Anthropic still accepts it. Reports the last 4 characters of the token, never the token. `--no-verify` skips the round trip. Exits non-zero when the token is rejected. |
| `epic credential delete` | Erases the token from the account. Does not revoke it at Anthropic — do that there if you need it dead everywhere. |
| `epic whoami` | `Name (email) — role` then `profile → URL`. |
| `epic login [name] [--url URL] [--rebind]` | Browser device-auth flow; the profile name defaults to a slug of the URL. |
| `epic logout [--purge]` | Blanks the token, or deletes the profile with `--purge`. |
| `epic profile list [--reveal]` | Columns: NAME / ROLE / EMAIL / URL, `*` on the active profile. Emails masked unless `--reveal`. |
| `epic profile switch [name]` · `epic profile show [name]` · `epic profile add <name> [--url URL]` · `epic profile set-url <name> <url>` · `epic profile rename <old> <new>` · `epic profile remove <name>` | Profile management. `switch` with no argument needs a terminal. |
| `epic --as <profile> <command>` | One-off profile override for a single command. |

Precedence when resolving the **Epic** credential (not the agent one): `EPIC_OAUTH_TOKEN` (baseUrl = `EPIC_API_URL` if set, **otherwise production**) → the pair `EPIC_API_URL` + `EPIC_ACCESS_TOKEN` → the active profile. Setting only one half of the pair is ignored with a warning.

## worktrees, previews, design, debugger

| Command | Notes |
|---|---|
| `epic wt list [--paths]` · `new <branch> [path]` · `path <branch>` · `switch <branch> [-c] [-x cmd -- args]` · `remove [branch]` · `prune` | Git worktree management. All plain text. |
| `epic preview start\|stop\|url <ID>` · `epic preview list` | Per-issue dev server; `list` shows ID / URL / PID / STATUS. |
| `epic design new [title]` · `generate [description] [-b]` · `apply [-b]` · `attach` · `stop` | Authors and applies `DESIGN.md`. |
| `epic debugger on\|off` | Toggles `EPIC_DEBUGGER_ENABLED` in `.env`. |

## marketplace

Two sides: the **client** publishes an issue and pays; the **developer** proposes, delivers
and gets paid. `<ref>` is a request/contract UUID or the numeric issue id behind it.
Confirmation prompts guard the irreversible steps — `--yes` skips the prompt, so pass it
only for the action the user actually asked for. Amounts are in dollars (`800`, `800.50`);
USD is the only currency the marketplace supports today.

### request (client)

| Command | Notes |
|---|---|
| `epic request new <issue-id> [--budget <dollars>] [--currency usd]` | Opens an existing issue to the marketplace. The budget is orientative. |
| `epic request list [--open] [--limit N] [--cursor C]` | Your requests. |
| `epic request show <ref>` | Request detail. |
| `epic request set-budget <ref> --budget <dollars>` · `--clear` | Change or drop the orientative budget while the request is open. |
| `epic request close <ref> [--yes]` | Stops accepting proposals. |

### proposal (developer offers, client decides)

| Command | Notes |
|---|---|
| `epic proposal new --request <ref> --price <dollars> --eta <days> -m "<message>"` | Submit or update your pending proposal. |
| `epic proposal list [--for <ref>] [--limit N] [--cursor C]` | Defaults to your own proposals; `--for` lists a request's. |
| `epic proposal show <proposal-id>` | Proposal detail. |
| `epic proposal accept <proposal-id> [--yes]` | **Client. Creates the contract** — the commitment starts here. |
| `epic proposal reject <proposal-id> [--yes]` · `withdraw <proposal-id> [--yes]` | Both permanent. |

### contract (both sides)

| Command | Notes |
|---|---|
| `epic contract list [--limit N] [--cursor C]` · `show <ref>` | Yours as client or developer; `show` includes submissions. |
| `epic contract start <ref>` | Developer. Waits for the client's payment to clear before starting. |
| `epic contract submit <ref> -m "<msg>" --link <url> [--label <name>]` | Developer. Repeatable — each call is a new submission. |
| `epic contract approve <ref> [--yes]` | **Client. Completes the contract and releases payment.** |
| `epic contract changes <ref> [-m "<feedback>"]` | Client. Sends the latest submission back. |
| `epic contract dispute <ref> [--yes] [-m "<reason>"]` | Either side. Flags the contract for resolution. |
| `epic contract refund <ref> [--yes] [-m "<reason>"]` | Client. Freezes the contract up to 7 days for the developer's answer. |
| `epic contract refund-accept <ref> [--yes]` · `refund-reject <ref> [--yes]` | Developer's answer to a pending refund. |
| `epic contract watch <ref> [--interval S] [--max-duration S]` | Live status; exits on completed/refunded. Caps at 1h by default. |
| `epic contract pay <ref> [--interval S] [--timeout S] [--once]` | Debug poll of payment status. Not needed in the happy path. |

### payouts (developer) and admin

| Command | Notes |
|---|---|
| `epic payouts setup [--country <iso2>]` | Stripe Express onboarding; prints a URL to finish KYC in a browser. Defaults to BR. Required before any payout. |
| `epic payouts status` · `epic payouts dashboard` | Account status; Stripe Express login link. |
| `epic admin freelancer invite <email>` · `list [--status pending\|accepted\|revoked\|expired]` · `revoke <invitationId>` | Marketplace admin only — typically run as `epic --as <admin-profile> admin …`. |

## stage and prototype

| Command | Notes |
|---|---|
| `epic stage assign --stage "<stage name>" --user <username>` | Auto-assign a user when an issue reaches that stage (e.g. `--stage "In Review"`). Stored in `.epic/settings.local.json` as `stageAssign`. |
| `epic prototype new "<description>" [--web\|--terminal] [--provider P]` | Scaffolds a numbered prototype folder, writes `prompt.md`, and hands the terminal to the agent, which creates `page.tsx` (web) or `screen.tsx` (terminal). Root defaults to the project type. |
| `epic prototype list` | Prototypes under `app/prototypes/` (web) or `prototypes/` (terminal); Enter resumes that prototype's agent session, `q` quits. |

## Errors worth recognising

| Message | Meaning |
|---|---|
| `409 ISSUE_LOCKED_BUILDING` | A build's grant owns the issue content. Wait for it, or stop the build. A job whose state has not moved for 30 minutes releases the lock on the next write. |
| `this repo is not linked to a project` | Run `epic project link <ref>`. |
| `session in progress; use 'epic <kind> attach' ... or 'stop' ...` | A sidecar outlived its tmux session. `epic issue stop <ID>` / `epic prd stop <ID>` clears it. |
| `Your session has expired` | `epic login`. |
| `unknown flag(s) for '<cmd> <sub>'` | The flag is a typo or belongs to another subcommand; the message lists what this one accepts. |
| `--provider must be one of: …` | An unknown or empty `--provider`. It is refused instead of falling back to the default agent. |
| `attach needs a terminal — stdin is not a TTY` | `attach` cannot hand the terminal to tmux. Use `sessions` / `log`, or run it from an interactive shell. |
| `Cannot reach <url>` | The backend is down or the profile points somewhere unreachable — check `epic whoami`. |
| `REMOTE_REQUIRES_AGENT_PROVIDER` | The account has no agent credential. `epic credential login` at a terminal; otherwise have the user run `claude setup-token` and store it with `epic credential set --token …`. A working `claude` on this machine does not count — that one is for local builds. |
| `AGENT_CREDENTIAL_MISSING` / `AGENT_CREDENTIAL_REVOKED` | Same fix, found later: the build's own pre-flight. Confirm with `epic credential status`. |
| `REMOTE_REQUIRES_GITHUB_APP` / `GITHUB_CONNECTION_REQUIRED` | Cloud builds push through the Epic GitHub App, so it must be installed on the repo's owner — the error carries the install URL. |
| `DEFAULT_BRANCH_MUST_BE_MAIN` | Cloud-build precondition: the repo's default branch must be `main`. |
| `SNAPSHOT_OUTDATED` | The cloud sandbox ships an older `epic` than the backend requires. Not fixable from here — the snapshot has to be rebuilt. |
