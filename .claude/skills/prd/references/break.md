# Break PRD

Given the existing PRD the user references (by id — content lives in the Epic
database, not in files), break it into issues created on the Epic backend. This
mode does **not** edit the PRD body — it reads the PRD and produces issues from
it. The CLI (`epic prd break`) drives this: the agent writes one markdown file
per issue into an **ephemeral, gitignored staging directory** the CLI provides
(never a committed `.epic/issues/*.md`), and the CLI creates each issue via the
API in dependency order, mapping placeholder ids to the identifiers the backend
mints.

- Break the PRD into issues. The number of issues should match the PRD: one per requirement or capability. Do not pad with extra issues, and do not invent requirements that are not in the PRD.
- Each issue is just the title and a brief overview. The **build** flow turns each one into a full plan and implements it later.
- Issues follow this naming convention (use Title Case for operation and command names, converting kebab-case to space-separated words):
  - Implement [Operation Name] Operation in [Command Name] Command
  - Change [Operation Name] Operation in [Command Name] Command to [What Change We Want]
  - Fix [Operation Name] Operation in [Command Name] Command

## Using Flows for Ordering and Dependencies

If the PRD includes a **Flows** section or describes user journeys, use it to:

1. **Order issues correctly**: capabilities that appear earlier in a flow must be implemented before capabilities that appear later.
2. **Populate the `depends_on` front matter field**: list the placeholder issue IDs (from this same batch) that must be completed before this issue can start. Use `depends_on: []` for issues with no dependencies. Do NOT use a `### Dependencies` body section — `depends_on` is the only source of truth; the CLI reads it to order backend creation, and `epic project build` reads it to schedule work.

Each staged file carries only the minimal front matter the break flow reads —
`id` (the placeholder `PREFIX-N`, remapped to the backend-minted identifier on
create), `depends_on`, and `prd_id` — then an H1 `# <id> <title>` and the body:

```
---
id: PROJ-12
prd_id: PRD-1
depends_on: [PROJ-10, PROJ-11]
---
```

Rules for determining dependencies:

- Within a flow, each capability depends on the capabilities listed before it in that flow.
- If a capability appears in multiple flows, combine all dependencies.
- Only list **direct** dependencies (not transitive ones).
- Reference dependencies by their issue ID (e.g. `PROJ-10`), not by title.
- All IDs in `depends_on` must refer to issues created in this same batch.

Order issues in implementation sequence: foundational capabilities before dependent capabilities. Use the Flows section to determine the correct order when available.

- Write one staged file per issue (`[placeholder-id]-[slug].md`) into the ephemeral break staging directory the CLI provides; the CLI creates the issues on the Epic backend from them. Do not write to `.epic/issues/` — there are no committed issue files.
