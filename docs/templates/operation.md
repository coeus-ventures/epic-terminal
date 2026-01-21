# [Operation Name]

[Description of the operation in one paragraph]

# Functional Specification

## Operation: [name]
File: `commands/[command]/operations/[operation].ts`

[Brief description of what this operation does and when users would use it]

### Preconditions

* User is in [directory/context state]
* [Required files/config] exist
* [External tool] is installed and authenticated

### [Primary Use Case]

#### Input
```
cli [command] [operation] <required-arg> [optional-arg] --flag
```

#### Workflow
* User runs `cli [command] [operation] [args]`
* CLI validates [input requirements]
* [Perform primary action]
* [Display result to user]

#### Output
```
[Expected console output on success]
```

### [Edge Case or Error Flow]

#### Workflow
* User runs command with [invalid input/missing requirement]
* CLI detects [error condition]
* Error message displayed: "[error message]"
* Exit code: [non-zero]


# Technical Specification

## Function: [operationName]
File: `commands/[command]/operations/[operation].ts`
Input: `(arg1: string, arg2?: Options)`
Returns: `Promise<void>` or `Promise<Result>`

[Single sentence describing what this function does]

### Implementation

* Parse and validate arguments
* [Check preconditions]
* [Call external tools/APIs if needed]
* [Perform file operations]
* [Display output to user]
* Handle errors with descriptive messages

---

## Utils: [utilName]
File: `commands/[command]/operations/utils.ts`

[Single sentence describing shared utilities for this command]

### Functions

* `[functionName]`: [What it does]
* `[functionName]`: [What it does]

---

## Lib: [libName]
File: `lib/[lib-name].ts`

[Single sentence describing what shared functionality this provides across commands]

### Functions

* `[functionName]`: [What it does]
* `[functionName]`: [What it does]

---

## External Dependencies

### [Tool/Service Name]
Used for: [Purpose]
Commands: `[shell commands used]`

* [How it's called]
* [What data is exchanged]
* [Error handling approach]
