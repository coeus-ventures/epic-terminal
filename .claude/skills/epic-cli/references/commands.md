# Epic CLI — full command surface

Read this when the main skill does not cover the command you need. Every command also
prints its own usage: `epic <command> --help`.

Conventions used below:

- `-b` — plain text instead of the TUI on read commands; detach instead of attaching a
  viewer on agent commands.
- `--provider claude|codex|opencode` — which agent runs the phase (PRD commands accept
  `claude|codex`). Defaults to the project's agent, read from the API.
- `--model NAME` — override the Claude model for every agent in the run.
- `<ID>` — an issue identifier (`TOD-3`), its sequence number (`3`), or its raw id.
  `<PRD-ID>` — `PRD-1`, `1`, or the uuid.

## project

| Command | Notes |
|---|---|
| `epic project new [name] [--web\|--terminal\|--empty] [--codex\|--opencode] [--online]` | Name takes no spaces. Offline by default: scaffold + a repo in the user's GitHub account + registration. `--online` also provisions a sandbox. No name → interactive wizard. |
| `epic project list [--owned\|--team] [--limit N] [--cursor C]` | Columns: ID (8 chars) / STATUS / PREFIX / NAME / DATE. `link` accepts the 8-char ID shown here, or the exact NAME — not the PREFIX. |
| `epic project link [ref] [--force]` | Links this repo to a project and writes `.epic/settings.local.json` (+ the `.epic` gitignore entries). No ref prints the current link. `--force` links even when the git origin does not match the project's repo. |
| `epic project build [--local\|--remote] [--mode auto\|manual] [--clean] [--foreground] [--no-tty]` | Builds every issue in dependency order, in parallel up to `maxParallelIssues`. |

## issue

| Command | Notes |
|---|---|
| `epic issue new [title] [--verbose]` | Title only — the body is authored later. No title → interactive wizard. Prints the identifier the backend assigned. (`--no-sync` still appears in the help but is ignored; creation always goes through the API.) |
| `epic issue list [status] [-b]` | Optional status filter. **Prints nothing without `-b`** when there is no TTY. |
| `epic issue show <ID> [-b]` | Metadata then the body. |
| `epic issue build <ID> [--local\|--remote] [-b] [--foreground] [--mode auto\|manual] [--base BRANCH] [--model NAME] [--provider P]` | plan → execute → verify → fix loop. Target defaults to the project's mode. `--base` cuts the worktree from another branch. `--foreground` applies to remote builds (poll to completion). |
| `epic issue plan\|execute\|verify\|fix\|review <ID> [-b] [--provider P] [--model NAME]` | Individual phases. `verify` also takes `-p PORT` (default 3000). |
| `epic issue interview <ID> [--provider P]` | Q&A that rewrites the issue body. |
| `epic issue pr <ID>` | Push the worktree branch and open (or surface) its PR. |
| `epic issue merge <ID>` · `epic issue approve <ID>` | Agent-driven merge into main; `approve` also sets the issue Done. |
| `epic issue close <ID>` · `epic issue assign <ID> <user>` | Status/assignee changes. |
| `epic issue worktree <ID>` · `epic issue run <ID> -- <cmd>` | Create the worktree; run a command with its cwd set to that worktree (exit code propagates). |
| `epic issue attach <ID>` · `epic issue message <ID> "<text>" [--session build\|verify\|merge] [-b]` | Attach to a live agent session; send it a message (resumes it). |
| `epic issue log <ID> [--session build\|verify\|merge]` | Reads the transcript from disk, so it works after the session ends. Local builds only — remote transcripts live in the web app. |
| `epic issue sessions` · `epic issue stop <ID>` | List tmux-backed sessions; end one and reconcile its sidecar (this is the fix for a stale "session in progress"). |
| `epic issue start <ID> [--foreground] [--model NAME]` | Shorthand for a remote build. |

## prd

| Command | Notes |
|---|---|
| `epic prd new [title] [--interview\|--generate] [--verbose]` | Creates the PRD record. The flags skip the wizard's mode picker. |
| `epic prd generate [PRD-ID\|description] [-b] [--provider claude\|codex]` | Authors the body with an agent — from a description (creates a draft) or from an existing PRD's body. |
| `epic prd show <PRD-ID> [-b]` | Prints identifier, status and the body verbatim. |
| `epic prd list [--status draft\|generating\|breaking\|ready\|building\|in_review\|done\|archived] [--refresh] [-b]` | **Prints nothing without `-b`** when there is no TTY. `ready` = decomposed, nothing running; `building` = a build actually started. |
| `epic prd plan <PRD-ID> [-b] [--provider P]` | Rewrites the body as a structured spec. |
| `epic prd interview <PRD-ID> [--provider P]` | Q&A that rewrites the body. |
| `epic prd break <PRD-ID> [-b] [--replace] [--provider P]` | Decomposes into issues, created through the API in dependency order with their `dependsOn` edges. `--replace` deletes the previous breakdown's untouched issues first and is refused if any have started. On success the PRD settles on `ready`. |
| `epic prd build <PRD-ID> [--local\|--remote] [-b] [--mode auto\|manual] [--foreground] [--no-tty]` | Builds the PRD's issues, stacking them onto a `prd-<n>` branch. |
| `epic prd approve <PRD-ID> [--squash]` | Linked repo: readiness check. Local repo: merges the integration PR and sets the PRD done. |
| `epic prd attach <PRD-ID>` · `epic prd stop <PRD-ID>` · `epic prd sessions` | Session control, same shape as the issue commands. |

## auth and profiles

| Command | Notes |
|---|---|
| `epic whoami` | `Name (email) — role` then `profile → URL`. |
| `epic login [name] [--url URL] [--rebind]` | Browser device-auth flow; the profile name defaults to a slug of the URL. |
| `epic logout [--purge]` | Blanks the token, or deletes the profile with `--purge`. |
| `epic profile list [--reveal]` | Columns: NAME / ROLE / EMAIL / URL, `*` on the active profile. Emails masked unless `--reveal`. |
| `epic profile switch [name]` · `epic profile show [name]` · `epic profile add <name> [--url URL]` · `epic profile set-url <name> <url>` · `epic profile rename <old> <new>` · `epic profile remove <name>` | Profile management. `switch` with no argument needs a terminal. |
| `epic --as <profile> <command>` | One-off profile override for a single command. |

Precedence when resolving credentials: `EPIC_OAUTH_TOKEN` (baseUrl = `EPIC_API_URL` if set, **otherwise production**) → the pair `EPIC_API_URL` + `EPIC_ACCESS_TOKEN` → the active profile. Setting only one half of the pair is ignored with a warning.

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
| `Cannot reach <url>` | The backend is down or the profile points somewhere unreachable — check `epic whoami`. |
| `GITHUB_CONNECTION_REQUIRED` / `DEFAULT_BRANCH_MUST_BE_MAIN` | Cloud-build preconditions: connect GitHub in Settings → Integrations; the repo's default branch must be `main`. |
