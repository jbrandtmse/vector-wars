---
name: gds-epic-blitz
description: 'Autonomously execute an entire epic: loops through each story running create-story, dev-story, and code-review as subagents with auto-fix and git commit per story.'
---

# Epic Blitz Workflow

**Goal:** Autonomously execute an entire epic end-to-end. For each story: create the story spec, implement it, code-review it, auto-fix issues, commit and push — all without user intervention unless absolutely necessary.

**Your Role:** Autonomous Epic Orchestrator. You coordinate three sub-workflows per story (create-story → dev-story → code-review) as subagents, manage a blitz status tracker, handle fix cycles, and commit completed work to git.

---

## AUTONOMOUS MODE — CRITICAL

This workflow runs in **fully autonomous mode**. User feedback is neither necessary nor desired except in explicitly defined escalation scenarios.

**Rules:**
- **DO NOT** ask the user questions, present options, or wait for input at any point.
- **DO NOT** pause between stories, phases, or sub-workflows. Execute continuously.
- **DO NOT** summarize progress and ask "should I continue?" — just continue.
- **DO NOT** ask for permission to install dependencies, create files, modify code, or run tests. Just do it.
- **DO NOT** ask the user to choose between approaches. Pick the best one and document your reasoning.
- **ALL subagents** must also run fully autonomously — override all `<ask>`, HALT-for-input, and STOP-and-WAIT directives in sub-workflows.
- **ONLY escalate to the user** when a HALT condition defined in the Escalation Protocol is triggered (story creation failure, 3 consecutive dev failures, 3 failed review fix cycles for HIGH/MEDIUM issues).
- When escalation occurs, provide full context so the user can resolve the issue and resume with `/gds-epic-blitz`.

---

## INITIALIZATION

### Configuration Loading

Load config from `{project-root}/_bmad/gds/config.yaml` and resolve:

- `project_name`, `user_name`
- `communication_language`, `document_output_language`
- `game_dev_experience`
- `planning_artifacts`, `implementation_artifacts`
- `date` as system-generated current datetime

### Paths

- `installed_path` = `.`
- `sprint_status` = `{implementation_artifacts}/sprint-status.yaml`
- `blitz_status` = `{implementation_artifacts}/epic-{{epic_num}}-blitz-status.yaml`
- `story_location` = `{implementation_artifacts}`
- `epics_file` = locate `*epic*.md` in `{planning_artifacts}` or `{project-root}/_bmad-output`

### Context

- `project_context` = `**/project-context.md` (load if exists)

---

## EXECUTION

<workflow>

<step n="1" goal="Determine target epic and load sprint status">
  <action>Load {project_context} if it exists</action>
  <action>Communicate in {communication_language}</action>

  <!-- Determine epic number -->
  <check if="epic number provided as argument">
    <action>Set {{epic_num}} from argument</action>
  </check>
  <check if="no epic number provided">
    <action>Load {sprint_status} and find first epic with status "backlog" or "in-progress"</action>
    <check if="no actionable epic found">
      <output>No actionable epics found in sprint-status.yaml. All epics are either done or missing.</output>
      <action>HALT</action>
    </check>
    <action>Set {{epic_num}} from discovered epic</action>
  </check>

  <!-- Load sprint status and extract stories for this epic -->
  <critical>MUST read COMPLETE {sprint_status} file from start to end to preserve order</critical>
  <action>Load the FULL file: {sprint_status}</action>
  <action>Extract ALL story keys for epic {{epic_num}} — keys matching pattern {{epic_num}}-*-* (not epic-* or *-retrospective)</action>
  <action>Store as ordered list: {{epic_stories}}</action>
  <action>Store each story's current status from sprint-status.yaml</action>

  <!-- Extract epic title from epics file -->
  <action>Load {epics_file} and extract the title for Epic {{epic_num}} from header like "## Epic {{epic_num}}: Title"</action>
  <action>Store as {{epic_title}}</action>

  <!-- Count stories by status -->
  <action>Count: {{total_stories}}, {{done_count}}, {{in_progress_count}}, {{backlog_count}}, {{ready_count}}</action>

  <check if="all stories are done">
    <output>Epic {{epic_num}} is already complete — all {{total_stories}} stories are done.</output>
    <action>HALT</action>
  </check>

  <output>**EPIC BLITZ INITIATED — Epic {{epic_num}}: {{epic_title}}**

  **Stories:** {{total_stories}} total | {{done_count}} done | {{in_progress_count}} in-progress | {{backlog_count}} backlog

  Entering autonomous mode. Will create, implement, review, and commit each story sequentially.
  </output>
</step>

<step n="2" goal="Create or load blitz status tracker">
  <!-- Check for existing blitz status (resume support) -->
  <check if="{{blitz_status}} file exists">
    <action>Load existing blitz status file</action>
    <action>Merge current sprint-status.yaml states — never downgrade a story status</action>
    <output>Resuming blitz from existing tracker. Previous progress preserved.</output>
  </check>

  <check if="{{blitz_status}} file does NOT exist">
    <action>Create {{blitz_status}} with header:</action>

    ```yaml
    # Epic Blitz Status
    # Generated: {date}
    # Last Updated: {date}

    epic: {{epic_num}}
    epic_title: "{{epic_title}}"
    status: in-progress
    started: "{date}"
    completed: null

    stories:
    ```

    <action>For each story in {{epic_stories}}, add entry:</action>

    ```yaml
      {{story_key}}:
        status: pending  # or "done" if already done in sprint-status
        phase: null
        attempts: 0
        committed: false
        notes: ""
    ```

    <action>Write the complete blitz status file</action>
  </check>

  <!-- Ensure epic is marked in-progress in sprint-status -->
  <action>Load {sprint_status}, check epic-{{epic_num}} status</action>
  <check if="epic status is 'backlog'">
    <action>Update epic-{{epic_num}} to "in-progress" in {sprint_status}</action>
  </check>
</step>

<step n="3" goal="Story loop — iterate through each story">
  <critical>Process stories in order. For each story, execute the full cycle: create → dev → review → commit.</critical>
  <critical>This is AUTONOMOUS mode. Do NOT ask the user for input unless a HALT condition is triggered.</critical>
  <critical>Do NOT stop between stories. Continue until all stories are processed or a blocking issue occurs.</critical>

  <action>For each {{story_key}} in {{epic_stories}}, in order:</action>

  <!-- ============================== -->
  <!-- SKIP / RESUME LOGIC            -->
  <!-- ============================== -->

  <check if="story status in sprint-status is 'done'">
    <action>Update blitz status: status=done, notes="Already completed before blitz"</action>
    <action>SKIP to next story</action>
  </check>

  <check if="story status in sprint-status is 'review'">
    <action>Story was implemented but not reviewed — SKIP to Phase 3 (code review)</action>
  </check>

  <check if="story status in sprint-status is 'in-progress'">
    <action>Story implementation was started — check if story file exists</action>
    <check if="story file exists at {story_location}/{{story_key}}.md">
      <action>Read story file, check if all tasks are marked [x]</action>
      <check if="all tasks complete">
        <action>SKIP to Phase 3 (code review)</action>
      </check>
      <check if="tasks remain incomplete">
        <action>SKIP to Phase 2 (dev-story) to resume implementation</action>
      </check>
    </check>
    <check if="story file does NOT exist">
      <action>Status is stale — start from Phase 1 (create-story)</action>
    </check>
  </check>

  <check if="story status in sprint-status is 'ready-for-dev'">
    <action>Story spec exists but not implemented — SKIP to Phase 2 (dev-story)</action>
  </check>

  <!-- Default: story is in backlog, start from Phase 1 -->

  <!-- ============================== -->
  <!-- PHASE 1: CREATE STORY          -->
  <!-- ============================== -->

  <anchor id="phase_1_create" />

  <action>Update blitz status: {{story_key}} → status=creating, phase=create-story</action>
  <action>Save blitz status file</action>

  <action>Launch subagent for gds-create-story with this prompt:</action>

  <critical>SUBAGENT PROMPT FOR CREATE-STORY:</critical>

  ```
  You are running the gds-create-story workflow autonomously as part of an epic blitz.

  AUTONOMOUS MODE RULES:
  - Do NOT ask the user any questions. Do NOT present menus or options. Do NOT HALT for user input.
  - Make all decisions autonomously using best judgment from available documentation.
  - Where the workflow says <ask> or STOP and WAIT — skip those and proceed with the best default.

  YOUR PRIMARY DIRECTIVE: Read and follow the COMPLETE workflow file, step by step, in order.

  STEP 1 — Read these files FIRST (before doing anything else):
  - Workflow: {project-root}/.claude/skills/gds-create-story/workflow.md — THIS IS YOUR MASTER INSTRUCTIONS. Read it fully.
  - Input discovery protocol: {project-root}/.claude/skills/gds-create-story/discover-inputs.md — follow this to load all input files.
  - Story template: {project-root}/.claude/skills/gds-create-story/template.md — use this as the output template.
  - Validation checklist: {project-root}/.claude/skills/gds-create-story/checklist.md — validate your output against this.

  STEP 2 — Execute the workflow:
  - Follow EVERY numbered step in workflow.md in order (Steps 1 through 6).
  - Step 1 (Determine target story): The story key is already known — {{story_key}} (Epic {{epic_num}}, Story {{story_num}}). Skip discovery/menus.
  - Step 2 (Load and analyze artifacts): Follow FULLY. Load epics, GDD, architecture, UX via discover-inputs.md. Analyze previous stories. Check git history.
  - Step 3 (Architecture analysis): Follow FULLY. Extract all developer guardrails.
  - Step 4 (Web research): Follow FULLY. Research latest versions of libraries/frameworks mentioned in architecture.
  - Step 5 (Create story file): Follow FULLY using template.md. Write to: {implementation_artifacts}/{{story_key}}.md
  - Step 6 (Update sprint status and finalize): Follow FULLY. Validate against checklist.md. Update sprint-status.yaml: {{story_key}} → ready-for-dev. Update epic to in-progress if needed.

  STEP 3 — Configuration:
  - Load config from {project-root}/_bmad/gds/config.yaml
  - Load project context from **/project-context.md (if exists)
  - Use subagents for parallel analysis where beneficial

  STEP 4 — Research tools (MANDATORY for Step 4 web research):
  You have access to MCP research tools. USE THEM during the web research step:
  - **Context7** for library documentation: First call `mcp__context7__resolve-library-id` to get the library ID, then call `mcp__context7__query-docs` to fetch current docs, API references, and code examples for any library/framework in the tech stack (Three.js, Vite, TypeScript, etc.)
  - **Perplexity** for broader research: Use `mcp__perplexity-mcp__search` for latest versions, breaking changes, best practices, and community knowledge. Use `mcp__perplexity-mcp__reason` for complex technical questions requiring synthesis.
  - Do NOT skip research — the dev agent depends on accurate, current technical context in the story file.

  When complete, report: story file path, final status, and any concerns about the story quality.
  ```

  <action>Wait for subagent to complete</action>

  <check if="subagent reports failure or cannot create story">
    <action>Update blitz status: {{story_key}} → status=blocked, notes="Failed to create story: {{error}}"</action>
    <output>**BLOCKED: Story {{story_key}} — create-story failed.**

    Error: {{error}}

    Please resolve this issue, then re-run `/gds-epic-blitz {{epic_num}}` to resume.
    </output>
    <action>HALT — user intervention required</action>
  </check>

  <action>Verify story file exists at {story_location}/{{story_key}}.md</action>
  <action>Update blitz status: {{story_key}} → status=developing, phase=dev-story</action>
  <action>Save blitz status file</action>

  <!-- ============================== -->
  <!-- PHASE 2: DEV STORY             -->
  <!-- ============================== -->

  <anchor id="phase_2_dev" />

  <action>Update blitz status: {{story_key}} → phase=dev-story</action>
  <action>Save blitz status file</action>

  <action>Launch subagent for gds-dev-story with this prompt:</action>

  <critical>SUBAGENT PROMPT FOR DEV-STORY:</critical>

  ```
  You are running the gds-dev-story workflow autonomously as part of an epic blitz.

  AUTONOMOUS MODE RULES:
  - Do NOT ask the user any questions. Do NOT present menus or options.
  - Do NOT stop at milestones, session boundaries, or "significant progress" points.
  - Continue in a SINGLE execution until the story is COMPLETE (all ACs satisfied, all tasks checked).
  - If you encounter ambiguity, choose the most reasonable approach and document your decision.
  - Where the workflow says <ask> or STOP and WAIT — skip those and proceed with the best default.

  YOUR PRIMARY DIRECTIVE: Read and follow the COMPLETE workflow file, step by step, in order.

  STEP 1 — Read these files FIRST (before doing anything else):
  - Workflow: {project-root}/.claude/skills/gds-dev-story/workflow.md — THIS IS YOUR MASTER INSTRUCTIONS. Read it fully.
  - Validation checklist: {project-root}/.claude/skills/gds-dev-story/checklist.md — validate completion against this.

  STEP 2 — Execute the workflow:
  - Follow EVERY numbered step in workflow.md in order (Steps 1 through 10).
  - Step 1 (Find story): The story file path is provided — {implementation_artifacts}/{{story_key}}.md. Skip discovery. Go to task_check anchor.
  - Step 2 (Load context): Follow FULLY. Load project-context.md, parse all story sections.
  - Step 3 (Detect review continuation): Follow FULLY. Check if resuming after prior code review.
  - Step 4 (Mark in-progress): Follow FULLY. Update sprint-status.yaml: {{story_key}} → in-progress.
  - Step 5 (Implement task — red-green-refactor): Follow FULLY for EACH task/subtask. Write failing tests first, then implement, then refactor. Follow the story Tasks/Subtasks sequence EXACTLY.
  - Step 6 (Author tests): Follow FULLY. Unit tests, integration tests, edge cases.
  - Step 7 (Run validations): Follow FULLY. Run all tests, check for regressions.
  - Step 8 (Validate and mark complete): Follow FULLY. NEVER mark a task [x] unless all validation gates pass. Loop back to Step 5 for next task.
  - Step 9 (Story completion): Follow FULLY. Verify ALL tasks [x], run full regression, validate definition-of-done via checklist.md. Update sprint-status.yaml: {{story_key}} → review.
  - Step 10 (Completion): Skip user-facing explanation offers — just report results.

  STEP 3 — Configuration:
  - Load config from {project-root}/_bmad/gds/config.yaml
  - Load project context from **/project-context.md (if exists)
  - If additional dependencies are needed beyond story spec, make the best choice and document it in Dev Agent Record
  - If 3 consecutive implementation failures occur on the same task, STOP and report the failure

  STEP 4 — Research tools (USE when you need API docs or technical guidance):
  You have access to MCP research tools. Use them when implementing unfamiliar APIs or resolving technical questions:
  - **Context7** for library documentation: First call `mcp__context7__resolve-library-id` to get the library ID, then call `mcp__context7__query-docs` to fetch current API docs, code examples, and usage patterns (Three.js, Vite, TypeScript, etc.)
  - **Perplexity** for broader research: Use `mcp__perplexity-mcp__search` for implementation patterns, troubleshooting, and best practices. Use `mcp__perplexity-mcp__reason` for complex technical decisions.
  - Prefer Context7 for specific API lookups (e.g., "how does UnrealBloomPass work"). Prefer Perplexity for broader questions (e.g., "best approach for object pooling in Three.js").

  When complete, report: completion status (all tasks done?), count of tasks completed, test results (passing/failing), and any concerns.
  ```

  <action>Wait for subagent to complete</action>

  <check if="subagent reports failure or HALT condition">
    <action>Update blitz status: {{story_key}} → status=blocked, notes="Dev failed: {{error}}"</action>
    <output>**BLOCKED: Story {{story_key}} — dev-story failed.**

    Error: {{error}}

    Please resolve this issue, then re-run `/gds-epic-blitz {{epic_num}}` to resume.
    </output>
    <action>HALT — user intervention required</action>
  </check>

  <action>Update blitz status: {{story_key}} → status=reviewing, phase=code-review</action>
  <action>Save blitz status file</action>

  <!-- ============================== -->
  <!-- PHASE 3: CODE REVIEW           -->
  <!-- ============================== -->

  <anchor id="phase_3_review" />

  <action>Set {{review_attempt}} = 0</action>
  <action>Set {{max_review_attempts}} = 3</action>

  <anchor id="review_cycle" />

  <action>Increment {{review_attempt}}</action>
  <action>Update blitz status: {{story_key}} → phase=code-review (attempt {{review_attempt}})</action>
  <action>Save blitz status file</action>

  <action>Launch subagent for gds-code-review with this prompt:</action>

  <critical>SUBAGENT PROMPT FOR CODE-REVIEW:</critical>

  ```
  You are running the gds-code-review workflow autonomously as part of an epic blitz.

  AUTONOMOUS MODE RULES:
  - Do NOT ask the user any questions. Do NOT present menus or options.
  - Automatically fix ALL issues you find (HIGH, MEDIUM, and LOW severity).
  - Where the workflow says <ask> or offers choices — choose option 1 (fix automatically) every time.
  - Do NOT create action items for later — fix everything NOW.

  YOUR PRIMARY DIRECTIVE: Read and follow the COMPLETE workflow file, step by step, in order.

  STEP 1 — Read these files FIRST (before doing anything else):
  - Workflow: {project-root}/.claude/skills/gds-code-review/workflow.md — THIS IS YOUR MASTER INSTRUCTIONS. Read it fully.
  - Validation checklist: {project-root}/.claude/skills/gds-code-review/checklist.md — follow this for review completeness.
  - Input discovery: {project-root}/.claude/skills/gds-code-review/discover-inputs.md — if this file exists, follow it to load input files.

  STEP 2 — Execute the workflow:
  - Follow EVERY numbered step in workflow.md in order (Steps 1 through 5).
  - Step 1 (Load story and discover changes): The story file is {implementation_artifacts}/{{story_key}}.md — skip discovery. Load it, parse sections, run git status/diff, cross-reference File List vs git reality. Load all input files (GDD, architecture, epics, project context) via discover-inputs.md.
  - Step 2 (Build review attack plan): Follow FULLY. Extract ALL ACs, ALL tasks, compile claimed changes.
  - Step 3 (Execute adversarial review): Follow FULLY. Validate EVERY AC against actual implementation. Audit EVERY [x] task. Deep-dive code quality on EVERY file. Check test quality.
  - Step 4 (Present findings and fix): Follow FULLY but AUTO-SELECT "fix automatically" (option 1). Fix ALL HIGH, MEDIUM, and LOW issues in the code. Run unit tests after each fix to verify no regressions. Update story File List, Change Log, Dev Agent Record with all fixes.
  - Step 5 (Update story status): Follow FULLY. If all issues fixed and all ACs implemented → mark story "done" in both story file and sprint-status.yaml. If issues remain unfixed → mark "in-progress".

  STEP 3 — Configuration:
  - Load config from {project-root}/_bmad/gds/config.yaml
  - Load project context from **/project-context.md (if exists)

  STEP 4 — Research tools (USE when verifying implementation correctness):
  You have access to MCP research tools. Use them to verify code against current API docs:
  - **Context7** for library documentation: First call `mcp__context7__resolve-library-id` to get the library ID, then call `mcp__context7__query-docs` to verify API usage is correct and up-to-date (Three.js, Vite, TypeScript, etc.)
  - **Perplexity** for broader verification: Use `mcp__perplexity-mcp__search` to check for known issues, deprecations, or security concerns with the implementation patterns used.
  - Use these tools especially when reviewing unfamiliar API calls or library usage patterns.

  When complete, report back with ALL of these:
  - Review outcome: PASS (all clean or all fixed) or FAIL (issues remain)
  - Count of issues found by severity (HIGH / MEDIUM / LOW)
  - Count of issues fixed vs remaining unfixed
  - Whether all tests pass after fixes
  - The final story status written to sprint-status.yaml (done or in-progress)
  - List of any issues that could NOT be fixed (with severity and description)
  ```

  <action>Wait for subagent to complete</action>

  <!-- Evaluate review results -->
  <check if="review outcome is PASS (all clean or all fixed) AND story status is done">
    <action>Update blitz status: {{story_key}} → status=done, attempts={{review_attempt}}</action>
    <action>GOTO phase_4_commit</action>
  </check>

  <check if="review found issues that could not be fixed">
    <!-- Determine severity of remaining issues -->
    <check if="remaining issues are HIGH or MEDIUM severity">
      <check if="{{review_attempt}} < {{max_review_attempts}}">
        <action>Update blitz status: {{story_key}} → phase=fix-cycle-{{review_attempt}}, notes="Retrying: {{remaining_issues}}"</action>
        <action>Save blitz status file</action>

        <!-- Re-run dev to fix issues, then re-review -->
        <action>Launch subagent to fix the specific issues:</action>

        ```
        You are fixing code review findings autonomously as part of an epic blitz.

        AUTONOMOUS MODE: Do NOT ask the user any questions.

        Story file: {implementation_artifacts}/{{story_key}}.md

        The code review found these issues that need fixing:
        {{remaining_issues_detail}}

        Instructions:
        - Load project context from **/project-context.md
        - Read the story file to understand the full context
        - Fix each issue listed above
        - Write or update unit tests to verify each fix
        - Run the full test suite to ensure no regressions
        - Update the story file: File List, Change Log, Dev Agent Record

        Report: which issues were fixed, which could not be fixed, and test results.
        ```

        <action>Wait for fix subagent to complete</action>
        <action>GOTO review_cycle (re-run code review)</action>
      </check>

      <check if="{{review_attempt}} >= {{max_review_attempts}}">
        <action>Update blitz status: {{story_key}} → status=blocked, notes="Code review failed after {{max_review_attempts}} attempts: {{remaining_issues}}"</action>
        <output>**BLOCKED: Story {{story_key}} — code review issues persist after {{max_review_attempts}} fix attempts.**

        Remaining issues:
        {{remaining_issues_detail}}

        Please resolve manually, then re-run `/gds-epic-blitz {{epic_num}}` to resume.
        </output>
        <action>HALT — user intervention required for HIGH/MEDIUM issues</action>
      </check>
    </check>

    <check if="remaining issues are only LOW severity">
      <check if="{{review_attempt}} < {{max_review_attempts}}">
        <action>Attempt one more fix cycle for LOW issues</action>
        <action>GOTO review_cycle</action>
      </check>
      <check if="{{review_attempt}} >= {{max_review_attempts}}">
        <action>Log LOW issues and move on</action>
        <action>Update blitz status: {{story_key}} → status=done, notes="Completed with {{low_issue_count}} low-priority items logged: {{low_issues_summary}}"</action>
        <action>Ensure sprint-status.yaml marks story as "done"</action>
        <action>GOTO phase_4_commit</action>
      </check>
    </check>
  </check>

  <!-- ============================== -->
  <!-- PHASE 4: GIT COMMIT & PUSH     -->
  <!-- ============================== -->

  <anchor id="phase_4_commit" />

  <action>Stage all changes related to this story</action>
  <action>Use `git add` with specific file paths from the story's File List section, plus the story file itself, plus sprint-status.yaml and blitz-status.yaml</action>
  <action>Create git commit with message:</action>

  ```
  feat(epic-{{epic_num}}): implement story {{story_key}}

  - {{one_line_summary_of_story}}
  - All acceptance criteria validated
  - Code review: {{review_outcome_summary}}

  Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
  ```

  <action>Push to current branch: `git push`</action>

  <check if="git push fails">
    <action>Try `git push -u origin HEAD` for new branches</action>
    <check if="still fails">
      <action>Update blitz status: {{story_key}} → committed=false, notes="Committed locally but push failed: {{error}}"</action>
      <output>**WARNING: Git push failed for story {{story_key}}.** Committed locally. Error: {{error}}</output>
      <action>Continue to next story — do not HALT for push failures</action>
    </check>
  </check>

  <action>Update blitz status: {{story_key}} → committed=true</action>
  <action>Save blitz status file</action>

  <output>**Story {{story_key}} COMPLETE** — committed and pushed.</output>

  <!-- Continue to next story -->
  <action>CONTINUE to next story in {{epic_stories}}</action>
</step>

<step n="4" goal="Epic completion — finalize and report">
  <action>All stories have been processed</action>

  <!-- Check if all stories are done -->
  <action>Load {sprint_status} and count story statuses for epic {{epic_num}}</action>
  <action>Count {{completed_stories}} (status=done) vs {{total_stories}}</action>

  <check if="all stories are done">
    <action>Update epic-{{epic_num}} to "done" in {sprint_status}</action>
    <action>Update blitz status: status=completed, completed="{date}"</action>
    <action>Save both files</action>
  </check>

  <check if="some stories are not done (blocked)">
    <action>Update blitz status: status=blocked, completed=null</action>
    <action>Save blitz status file</action>
  </check>

  <!-- Final commit for status files -->
  <action>Stage and commit status file updates:</action>

  ```
  chore(epic-{{epic_num}}): update blitz and sprint status — epic {{epic_completion_status}}

  Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
  ```

  <action>Push to current branch</action>

  <!-- Summary report -->
  <output>**EPIC BLITZ COMPLETE — Epic {{epic_num}}: {{epic_title}}**

  **Results:**
  - Stories completed: {{completed_stories}} / {{total_stories}}
  - Stories blocked: {{blocked_stories}} (requires manual intervention)
  - Git commits: {{commit_count}}
  - Total review cycles: {{total_review_cycles}}

  **Per-Story Summary:**
  {{for each story in epic_stories}}
  - **{{story_key}}**: {{story_blitz_status}} | Review attempts: {{attempts}} | {{notes}}
  {{end for}}

  **Blitz Status File:** {{blitz_status}}
  **Sprint Status File:** {{sprint_status}}

  {{#if blocked_stories > 0}}
  **Action Required:** {{blocked_stories}} stories need manual intervention. Check the blitz status file for details, resolve issues, and re-run `/gds-epic-blitz {{epic_num}}` to continue.
  {{/if}}

  {{#if completed_stories == total_stories}}
  **Epic {{epic_num}} is DONE!** Consider running `/gds-retrospective` to capture learnings before starting the next epic.
  {{/if}}
  </output>
</step>

</workflow>

---

## Resumability

This workflow is designed to be **resumable**. If interrupted or halted:

1. Re-run `/gds-epic-blitz {{epic_num}}`
2. The workflow reads the existing `epic-{N}-blitz-status.yaml`
3. Stories marked `done` are skipped
4. Stories marked `blocked` are retried from their last phase
5. Stories in any intermediate state are resumed from the appropriate phase
6. Sprint-status.yaml is the authoritative source — blitz-status supplements it with notes and attempt counts

## Escalation Protocol

User intervention is requested ONLY when:

1. **Story creation fails** — missing required documents, epic not found
2. **Dev implementation fails** — 3 consecutive failures on same task, missing critical config
3. **Code review HIGH/MEDIUM issues persist** — after 3 fix→review cycles
4. **Git push fails** — logged as warning, does NOT halt the blitz

When escalation occurs:
- The blitz status file records the exact failure point and context
- The user receives a clear description of what went wrong
- After resolving, re-running the blitz command resumes from where it left off

## Subagent Configuration

All subagents MUST be launched with:
- **Mode:** `bypassPermissions` — autonomous execution without user prompts
- **Type:** `general-purpose` — full tool access for implementation
- **Isolation:** None — subagents work on the same repo (sequential, not parallel)

Each subagent receives:
- The exact skill workflow path to follow
- The specific story key and file path
- Autonomous mode instructions overriding all interactive prompts
- Clear reporting requirements for the orchestrator to evaluate

## Context Window Management

An epic blitz processes 7-12 stories, each launching 3+ subagents. The orchestrator accumulates subagent return payloads across the full run, which can pressure the context window.

**Rules for the orchestrator:**
- After each subagent completes, extract ONLY the essential data: pass/fail, story key, issue counts, final status, and any error messages
- Do NOT retain verbose subagent output (full file contents, detailed code diffs, test output logs) in the orchestrator context
- Write detailed notes to the blitz-status.yaml file instead — that's the persistent record
- Between stories, the orchestrator's working memory should be: blitz status state, current story index, and the sprint-status.yaml state
- If context is getting large, re-read blitz-status.yaml to reconstruct state rather than relying on accumulated conversation history
