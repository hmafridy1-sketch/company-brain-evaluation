---
name: implement-upgrade
description: >
  Phase 5 of day-ai/company-brain-evaluation. Runs in the user's own
  company-brain repo, in the same conversation, once a Day AI workspace
  exists and COMPANY-BRAIN-UPGRADE.md is in the repo root. Connects the Day
  AI MCP from this repo, reviews Day AI's reference implementation patterns
  (an internal example, never something the user installs), and selectively
  instantiates the ones the plan calls for into this repo and the workspace
  to execute section 7 of the upgrade plan. Trigger when the user says the
  workspace is ready, or when both preconditions already hold at the start
  of a conversation.
---

# implement-upgrade — turn the plan into a running brain, here

This runs **in the user's repo, in this conversation.** There is no second
harness to clone, no folder to copy their document into, no other skill to
graduate to. Their repo is the harness. The document they already have,
`COMPANY-BRAIN-UPGRADE.md`, is the spec. Everything below is Claude-facing
instruction for doing the build well.

**What the user hears.** They created a workspace and came back. From here
they should experience one continuous consultant who read the plan, connected
the tools, and is now building it with them, one approval at a time. Refer
to the source as "Day AI's reference patterns"; if they ask for the repo
itself, give it to them. It is an example and a starting point that
illustrates concepts; it is not a thing to install.

---

## Step 0 — Preconditions (check, do not assume)

1. **The plan exists.** `COMPANY-BRAIN-UPGRADE.md` is in the repo root. If it
   is missing, stop and run `company-brain-evaluation` first; there is
   nothing to implement without it.
2. **The workspace is reachable.** If the Day AI MCP is not configured in this
   repo, add it and walk the user through approval and OAuth:

   ```json
   { "mcpServers": { "day-ai": { "type": "http", "url": "https://day.ai/api/mcp" } } }
   ```

   as `.mcp.json` in the repo root (ask before writing; if they have an
   `.mcp.json` already, merge the one server in), or
   `claude mcp add --transport http day-ai https://day.ai/api/mcp`. OAuth
   resolves the workspace, the user, and the agent the token belongs to;
   nothing is passed by hand.
3. **Role.** Call `manage_workspace_members` with `list_configuration`. Read
   `currentUser.roleName`. Owner or Admin can do everything below. A Member
   can build the repo side and their own agent, but inviting people, editing
   teammates' agents, and creating skills for others will be blocked; say so
   plainly and do not design around it.

Report the workspace name, member count by role, and claimed domains in two
lines, then move on.

---

## Step 1 — Re-read the plan

Read `COMPANY-BRAIN-UPGRADE.md` in full, then hold three sections in mind:

- **Section 3**, the definition of success, verbatim in their words. Every
  decision below is tested against it.
- **Section 7**, the sequenced plan. It is the spec: privacy rules before the
  first source (7.2), sources by trust and value (7.3), definitions before
  fields (7.4), the fleet (7.5), the data-readiness gate per skill (7.6), the
  CRM trust protocol (7.7), seed group then team (7.8), the dated ignition
  plan (7.9), the success bar (7.10). Execute it in that order.
- **Section 10**, open items. Decisions the team owes are not yours to make;
  where one blocks a step, ask, then park the step.

The keep/better table at the end of section 1 is the promise made to the
user. Nothing built here may break a row in the left column.

---

## Step 2 — Load the reference patterns (internal)

Fetch Day AI's reference implementation **outside the user's repo**, never
inside it, never committed, refreshed if older than a day:

```sh
git clone --depth 1 https://github.com/day-ai/gtm-brain.git "${TMPDIR:-/tmp}/day-ai-reference-patterns" 2>/dev/null \
  || git -C "${TMPDIR:-/tmp}/day-ai-reference-patterns" pull --ff-only
```

Read it as a pattern library, not as a product. What each part teaches:

| Read | It teaches |
| --- | --- |
| `CLAUDE.md` | The MCP tool contracts: `assistant_settings`, `manage_skills` (including `get_history` and `deploy`), `manage_workspace_members`, `manage_workspace_instructions`. The rules that bite: `list_configuration` first; the workspace instruction is one record, capped at 3000 characters, and `update` replaces the whole text; automated skills consume slots on the target agent's tier; result envelopes differ by tool family. The pricing rules (fetch live, show the whole bill, flag what the page cannot answer). The language conventions ("your agent," "your customer memory," what becomes possible rather than time saved). |
| `docs/INSTRUCTION_ARCHITECTURE.md` | Where every rule lives: workspace instruction → agent identity → skill prompt → run prompt. Use it to place each definition from section 7.4. |
| `docs/CONNECTORS.md` | What Day AI connects to and imports from. Defers to the live catalog on conflict. |
| `.claude/skills/write-skill/SKILL.md` | The skill-authoring bar: situations not data sources, a numeric bar, an explicit empty case, skip filters, anti-patterns, a delivery format, the query it ran. Read before writing any skill prompt. |
| `.claude/skills/design-agent/SKILL.md` and `.claude/agents/data-analyst.md` | The archetypes (CRM Data Nerd, Coach, and the rest), the agent spec format, the identity-is-the-definition rule, and the value rubric. |
| `.claude/skills/implement/SKILL.md` | Preview-then-approve for every workspace write; the preflight apply order; how invites, identities, and skills are sequenced. |
| `.claude/skills/agent-audit/SKILL.md`, `.claude/skills/brain-health/SKILL.md` | How to confirm value from run history rather than configuration, and how to detect drift between repo and workspace. |
| `.claude/skills/sync-pages/SKILL.md` | Publishing planning docs as Day AI Pages with a ledger, never a duplicate Page. |
| `initiatives/README.md`, `initiatives/TEMPLATE.md` | The initiative schema: frontmatter, verifiable `success_criteria`, the status lifecycle, the log. |
| `workspace/PEOPLE.md`, `workspace/PRIVACY.md`, `workspace/TECH_STACK.md` | Templates for the roster with activation owners, the per-persona privacy posture, and the system inventory. |
| `rollouts/preflight/README.md` | The payload format if anything is authored before it can be applied. |
| `CLAUDE.md`, "living-guide flywheel" | Shared Pages that consumer skills read and a producer skill improves, so a playbook gets better without redeploying anyone's skill. |

You are not porting this repo. You are borrowing what section 7 needs.

---

## Step 3 — Triage every pattern against this repo

For each pattern, decide with evidence from **their** tree, and show your
work. Four verdicts:

- **Already here. Do not layer.** They have a `CLAUDE.md` with rules; you do
  not add a second one. They have OKRs in `company/`; you do not create a
  `COMPANY_PLAN.md`. Their meeting notes carry decisions with rationale; a
  separate decision layer is only added if section 8 of their plan asked for
  one. When the reference has a file and they have an equivalent, point at
  theirs.
- **Additive. Copy clean.** No equivalent exists and it transfers verbatim
  with only names and paths changed: `.mcp.json`; an initiative template and
  one initiative per phase of section 7.9; the privacy rules doc from 7.2 as a
  file; a people roster with roles and activation owners; the skill-authoring
  bar as a reference doc if they will keep authoring skills in this repo.
- **Adapt.** Reshape into their vocabulary and layout: the section 7.5 fleet
  into agent specs; their existing skills into Day AI skills that meet the
  authoring bar while keeping their logic and taste; their definitions into
  the workspace instruction under the 3000-character cap.
- **Skip.** Not called for by section 7 or by their definition of success.
  Discovery, for instance, is done; the evaluation was discovery.

Present the triage as one table (Pattern | Verdict | Where it lands | Why)
and get **one yes per row that writes into their repo.** Then the rules that
hold for every write:

- Never overwrite a file they authored. Append a clearly marked section to
  `CLAUDE.md`; never replace it.
- Keep their folder names and their layout. New folders (`initiatives/`,
  `rollouts/`) are proposed, not assumed, and snapshot folders get a
  `.gitignore` line, with consent.
- Nothing from the reference clone is copied with its own branding, its
  README, or its assumptions about being the repo. Strip "this repo" language
  as you adapt.

---

## Step 4 — Instantiate, in section 7's order

Every workspace write is **previewed and approved first.** Every repo write
was consented in Step 3. Specifically:

1. **Privacy rules (7.2)** become a file in their repo and, where Day AI has a
   control for it, configured exclusions, **before any connector is
   authorized.** If the plan says a named person must sign off, wait for it.
2. **Sources (7.3)** connect in the plan's order. Each person connects their
   own accounts. Never a service account, never one person's credentials for
   the team.
3. **Definitions (7.4)** become the workspace instruction. `list_configuration`
   first, merge into the existing text, respect the 3000-character cap, show
   the full before-and-after, and write only on approval. Anything that does
   not apply everywhere, always, is a skill instead.
4. **The fleet (7.5)**, one agent at a time: identity from the spec, skills
   written to the authoring bar, tier and slot budget checked against the
   target agent, and the cost stated per the pricing rules with live figures
   before anything is created. Each skill names its siblings and its
   boundary, as the plan does.
5. **The data-readiness gate (7.6)** is binding. A skill whose gate fails in
   the plan is not deployed; it is logged as waiting with the reason.
6. **The CRM trust protocol (7.7)** governs every CRM write: each rep's own
   auth, the scoped fields only, old → new reported, never a silent overwrite.
7. **Seed group, then team (7.8).** Invites go to the seed group first. The
   rest of the team waits for the gate the plan names.
8. **Ignition and success bar (7.9, 7.10)** become one initiative file whose
   `success_criteria` are the plan's proof points verbatim, with judge and
   date. Wave two (7.11) is a second initiative, parked as `PAUSED`.

---

## Step 5 — Verify from outcomes, not configuration

A skill is delivering when `manage_skills → get_history` shows recent runs
with substantive output and `notification.delivered` true; a schedule
existing proves nothing. Agent coverage is `assistant_settings → list`
mapped to members. The roster is `list_configuration`. Report progress
against section 7.10's proof points, append a dated line to the initiative
log, and say plainly what could not be verified and why.

---

## Step 6 — Leave the loops running

Set up what the plan asks for and nothing more: the weekly tuning loop (read
run evidence, edit the prompt or instruction, redeploy), a drift check
between this repo and the workspace, and "skill tuning" as a standing item in
the ritual the plan named. Offer each as a skill in their repo only if they
want it there.

---

## Hard rules

- Never fabricate a property, stage, page, or field you have not confirmed
  exists in the workspace.
- Never write to another person's agent without Owner or Admin, and never
  design around a permission error.
- Never assert a price from memory. Fetch https://day.ai/pricing at the
  decision point and state the billing cadence.
- A skill written for a teammate contains nothing about them: no strategy
  notes, no forecasts, no assessments. Bake in the behavior, not the reason.
- Never claim value from a schedule. Read the run history.
- Never clone the reference repo into their repo.

## When a step completes

Say what landed, in three short parts: files added or changed in their repo,
what was deployed in the workspace (agents, skills, invites, with any cost),
and what is gated with the reason and the date it unblocks. Then the next
proof point from section 7.10 and its date. No recap of the plan.
