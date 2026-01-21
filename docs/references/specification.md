# Epic CLI Specification Format

This document defines a **operation-centric specification system** for describing CLI applications. Specifications are organized into two categories:

**Functional Specifications** describe *what the CLI does* from the user's perspective. They form a hierarchy:

```
Project -> Flow -> Command -> Operation
```

**Technical Specifications** describe *how the CLI is built* from the developer's perspective. They are a flat catalog of implementation units:

```
Function | Class | Integration
```

**Operation is the bridge between both.** It is the leaf of the Functional hierarchy and the unit that Technical specs reference. All specifications are written in concise, human-readable Markdown.

---

# Part 1: Functional Specifications

Functional specifications describe user workflows, CLI commands, and observable actions. A product manager could write and read these without knowing the codebase.

---

## 1. Project Specification Format

Project specifications describe **the entire CLI application** as a composition of commands and flows, each with their associated operations. They provide a high-level map of the system.

### Purpose

Project specifications answer:
- What commands exist in the CLI?
- What flows guide users through the CLI?
- Which operations are available for each command?
- Which operations comprise each flow?

### Structure

A project specification consists of:
1. A heading naming the **project**
2. A short description of the CLI application
3. A **Commands** section listing all commands with their operations
4. A **Flows** section listing all flows with their operations

### Conventions

- Each command entry includes the command syntax and a list of operations
- Each flow entry includes a description and an ordered list of operations
- Operations are listed by name, linking commands and flows to the operation specifications

### Example

```markdown
# Epic CLI

A command-line tool for managing software projects with GitHub integration.

## Commands

### issue
**Syntax:** `epic issue <operation>`

#### Operations
- new
- list
- sync
- start
- show
- close

### project
**Syntax:** `epic project <operation>`

#### Operations
- new
- init

### draft
**Syntax:** `epic draft <operation>`

#### Operations
- new

## Flows

### Issue Development
Guides a developer from issue creation to completion.

#### Operations
1. issue new
2. issue start
3. issue sync
4. issue close

### Project Setup
Sets up a new project with GitHub integration.

#### Operations
1. project new
2. issue new
3. issue start
```

---

## 2. Flow Specification Format

Flow specifications describe **user workflows** as ordered collections of operations across commands. A flow represents how a user accomplishes a goal through the CLI over time.

### Purpose

Flow specifications answer:
- How does a user accomplish a goal end-to-end?
- In what order are operations executed?
- Which commands are invoked?

### Structure

A flow specification consists of:
1. A heading naming the **flow**
2. A short description of the workflow and its goal
3. An ordered list of **steps**

Each step references:
- a **command** and **operation**
- a brief description of user intent

### Example

```markdown
# Issue Development

Guides a developer from issue creation through development to completion.

## Operations

1. **issue new** - `epic issue new`
   Developer creates a new issue from a draft or description.

2. **issue start** - `epic issue start PROJ-123`
   Developer creates a worktree and branch for the issue.

3. **issue sync** - `epic issue sync`
   Developer syncs local changes with GitHub issue.

4. **issue close** - `epic issue close PROJ-123`
   Developer closes the completed issue.
```

---

## 3. Command Specification Format

Command specifications describe **CLI commands** as routers to operations. They define the command's syntax and available operations.

### Purpose

Command specifications answer:
- What is this command responsible for?
- What syntax does it accept?
- Which operations are available?
- What arguments does it parse?

### Structure

A command specification consists of:
1. A heading naming the **command**
2. The command **syntax**
3. A short **overview**
4. A list of **arguments** the command parses
5. A list of **operations** available for the command

### Example

```markdown
# issue

**Syntax:** `epic issue <operation> [options]`

## Overview

Manages GitHub issues as local markdown files with bidirectional sync.

## Arguments

### operation
The operation to perform (new, list, sync, start, show, close).

### --force, -f
Force the operation even if there are conflicts.

### --all, -a
Apply operation to all matching issues.

## Operations

### new
Creates a new issue from a draft or inline description.

### list
Lists all issues in the current project.

### sync
Synchronizes local issue file with GitHub.

### start
Creates a worktree and branch for an issue.

### show
Displays issue details.

### close
Closes an issue and cleans up worktree.
```

---

## 4. Operation Specification Format

Operation specifications describe **end-to-end CLI behavior** governed by declarative rules. Operation is the leaf of the Functional hierarchy and the primary unit that Technical specs reference.

### Structure

An operation specification consists of:
1. A top-level heading naming the **operation**
2. A one-paragraph description
3. The operation directory
4. A **Dependencies** section (optional) - ordered list of prerequisite operations
5. A **Rules** section - named rules with When/Then conditions
6. An **Examples** section - concrete scenarios demonstrating the behavior

Each example may include:
- **PreState** (optional) - system state before the operation (files, git state, etc.)
- **Steps** (required) - actions and verifications
- **PostState** (optional) - system state after the operation

### Step Keywords

Steps use prefixes to distinguish actions from verifications:
- **Run:** - user executes a CLI command
- **Check:** - verification that something is true (file exists, output contains, etc.)

### Example

```markdown
# issue sync

Synchronizes a local issue markdown file with the corresponding GitHub issue.
Directory: `commands/issue/sync/`

## Rules

### Issue Must Exist
- When:
  - Issue file does not exist locally
- Then:
  - Reject with "Issue file not found"

### GitHub Issue Must Exist
- When:
  - Issue has not been created on GitHub
- Then:
  - Create GitHub issue from local file
  - Update local file with GitHub issue number

### Conflict Detection
- When:
  - Local changes conflict with GitHub changes
  - Force flag is not set
- Then:
  - Reject with "Conflict detected. Use --force to overwrite"

### Sync Direction
- When:
  - Local file is newer than GitHub issue
- Then:
  - Update GitHub issue with local content
- When:
  - GitHub issue is newer than local file
- Then:
  - Update local file with GitHub content

## Examples

### User syncs a new issue to GitHub

#### PreState
files:
path, content
docs/issues/PROJ-001-add-feature.md, "# PROJ-001 Add Feature\n\nDescription here"

github_issues:
number, title, state
(empty)

#### Steps
* Run: epic issue sync PROJ-001
* Check: Output contains "Created GitHub issue #1"
* Check: Local file updated with GitHub metadata

#### PostState
files:
path, contains
docs/issues/PROJ-001-add-feature.md, "github_issue: 1"

github_issues:
number, title, state
1, Add Feature, open

### User syncs with conflict

#### PreState
files:
path, modified
docs/issues/PROJ-001.md, 2024-01-15T10:00:00

github_issues:
number, updated_at
1, 2024-01-15T11:00:00

local_content: "Local changes"
github_content: "Different remote changes"

#### Steps
* Run: epic issue sync PROJ-001
* Check: Output contains "Conflict detected"
* Check: Exit code is 1

#### PostState
files:
path, content
docs/issues/PROJ-001.md, "Local changes"
```

### Example with Dependencies

```markdown
# issue close

Closes an issue on GitHub and optionally cleans up the local worktree.
Directory: `commands/issue/close/`

## Dependencies

1. issue new
2. issue start

## Rules

### Issue Must Exist
- When:
  - Issue does not exist
- Then:
  - Reject with "Issue not found"

### Issue Must Be Open
- When:
  - Issue is already closed
- Then:
  - Reject with "Issue is already closed"

### Worktree Cleanup
- When:
  - Issue has an associated worktree
  - Cleanup flag is set
- Then:
  - Delete the worktree directory
  - Delete the local branch

## Examples

### User closes an issue

#### PreState
files:
path, exists
docs/issues/PROJ-001.md, true

github_issues:
number, state
1, open

worktrees:
path, branch
../PROJ-001/, PROJ-001

#### Steps
* Run: epic issue close PROJ-001 --cleanup
* Check: Output contains "Issue closed"
* Check: Worktree directory removed

#### PostState
github_issues:
number, state
1, closed

worktrees:
path, branch
(empty)
```

**Rules** are named declarative constraints with When/Then conditions. Each rule has a descriptive name, a list of conditions (When), and a list of outcomes (Then). Multiple conditions are implicitly AND. For OR logic, create separate rules. **Examples** demonstrate how the operation plays out in concrete scenarios.

---

# Part 2: Technical Specifications

Technical specifications describe implementation units that realize operations. They are a flat catalog - each spec type stands alone and references operations it participates in.

---

## 5. Function Specification Format

Function specifications describe the **behavioral contract** of a single function. They focus on _intent_, not implementation.

### Structure

A function specification consists of:
1. A heading whose title is the **function signature**
2. A short description
3. A small set of keywords
4. Optional **Examples** with PreState/PostState (for functions that modify state)

### Keywords

- **Given** - input parameters and assumptions
- **Returns** - value or outcome returned
- **Throws** - error conditions
- **Calls** (optional) - direct dependencies

### Example (Simple Function)

```markdown
## parseIssueId(input: string): IssueId | null

Parses a string into a structured issue ID.

- Given: a string that may be an issue ID
- Returns: parsed IssueId object or null if invalid
```

### Example (Function with State Changes)

```markdown
## syncIssue(options: SyncOptions): Promise<SyncResult>

Synchronizes a local issue file with GitHub.

- Given: issue ID and sync options
- Returns: sync result with status and changes
- Throws: "Issue not found" if file doesn't exist
- Calls: readIssueFile, updateGitHubIssue, writeIssueFile

### Example: Sync new issue to GitHub

#### PreState
files:
path, content
docs/issues/PROJ-001.md, "# PROJ-001 Feature\nDescription"

github_issues:
(empty)

#### Steps
* Call: syncIssue({ issueId: "PROJ-001" })
* Returns: { status: "created", githubNumber: 1 }

#### PostState
github_issues:
number, title
1, Feature

### Example: Reject missing file

#### PreState
files:
(empty)

#### Steps
* Call: syncIssue({ issueId: "PROJ-001" })
* Throws: "Issue not found"
```

---

## 6. Class Specification Format

Class specifications describe **object-oriented units** including their state, methods, and relationships.

### Structure

A class specification consists of:
1. A heading naming the **class**
2. A short description of its responsibility
3. **Properties** (state)
4. **Methods** (which may reference Function specs)
5. Optional **relationships** (extends, implements, composes)
6. Optional **Examples** showing usage scenarios

### Example

```markdown
# IssueModel

Manages reading and writing issue files with front matter parsing.

## Properties
- basePath: string
- settings: Settings

## Methods
- read(issueId: string): Issue | null
- write(issue: Issue): void
- list(): Issue[]
- exists(issueId: string): boolean
- delete(issueId: string): void

## Relationships
- Composes: Settings, FrontMatterParser

## Examples

### Read an issue file

#### PreState
files:
path, content
docs/issues/PROJ-001.md, "---\ntitle: Feature\n---\nDescription"

#### Steps
* Call: model.read("PROJ-001")
* Returns: { id: "PROJ-001", title: "Feature", body: "Description" }

### List all issues

#### PreState
files:
path
docs/issues/PROJ-001.md
docs/issues/PROJ-002.md

#### Steps
* Call: model.list()
* Returns: [{ id: "PROJ-001", ... }, { id: "PROJ-002", ... }]
```

---

## 7. Integration Specification Format

Integration specifications describe **external service clients** that wrap shell commands or APIs.

### Purpose

Integration specifications answer:
- What external service does this wrap?
- What commands or APIs does it call?
- What data does it return?
- How does it handle errors?

### Structure

An integration specification consists of:
1. A heading naming the **integration**
2. A short description of the external service
3. **Commands** or **Endpoints** it wraps
4. **Methods** with their contracts
5. **Error Handling** - how failures are mapped
6. Optional **Examples**

### Example

```markdown
# GitHubIntegration

Wraps GitHub CLI (`gh`) for issue and repository operations.

## Commands
- `gh issue create`
- `gh issue view`
- `gh issue edit`
- `gh issue close`
- `gh repo view`

## Methods

### createIssue(title: string, body: string): Promise<number>
Creates a GitHub issue and returns the issue number.
- Given: issue title and body
- Returns: GitHub issue number
- Throws: "GitHub CLI not authenticated" if not logged in

### getIssue(number: number): Promise<GitHubIssue>
Fetches issue details from GitHub.
- Given: issue number
- Returns: issue object with title, body, state, labels
- Throws: "Issue not found" if issue doesn't exist

### updateIssue(number: number, updates: IssueUpdate): Promise<void>
Updates an existing GitHub issue.
- Given: issue number and fields to update
- Returns: void
- Throws: "Permission denied" if user can't edit

### closeIssue(number: number): Promise<void>
Closes an issue on GitHub.
- Given: issue number
- Returns: void
- Throws: "Issue already closed" if already closed

## Error Handling
- Exit code 1 with "not logged in" -> throw "GitHub CLI not authenticated"
- Exit code 1 with "not found" -> throw "Issue not found"
- Exit code 1 with "permission" -> throw "Permission denied"

## Examples

### Create issue successfully

#### Steps
* Call: github.createIssue("Add feature", "Description here")
* Executes: `gh issue create --title "Add feature" --body "Description here"`
* Returns: 42

### Handle missing issue

#### Steps
* Call: github.getIssue(999)
* Executes: `gh issue view 999 --json title,body,state`
* Throws: "Issue not found"
```

---

# Principles

- Operation is the bridge between Functional and Technical specs
- Functional specs describe _what_, Technical specs describe _how_
- Functional specs are hierarchical (Project -> Flow -> Command -> Operation)
- Technical specs are a flat catalog (Function, Class, Integration)
- Commands are thin routers; Operations contain the logic
- Data flows top to bottom: Command -> Operation -> Service -> Infrastructure
- State changes are explicit in examples (PreState/PostState)
- Omitted sections are meaningful
- Formats are minimal and consistent

This system is documentation, but also a **design and reasoning tool**.
