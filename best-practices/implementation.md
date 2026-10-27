# Implementation best practices

How to sequence the build. The other documents in this folder say what a
company brain has to be (`context-graph.md`, `agentic-control-plane.md`),
what the team has to do for it to stick (`adoption.md`), and what a good
local brain looks like on its own terms (`basic-company-brain-definition.md`).
This one says what order to do things in, and which gates to refuse to skip —
drawn from dozens of real implementations, most of which paid for at least
one of these lessons the hard way.

Ten practices. Each pairs a diagnostic question with why it matters, what good
looks like, and what we have seen. Used by `day-ai/company-brain-evaluation` as the
standard section 7 of `COMPANY-BRAIN-UPGRADE.md` is written to: every step in
the plan should be specific enough to execute, DIY or on Day AI, and should
respect the ordering here.

---

## 1. Outcomes, then workflows, then agents, then data — fields last

**Ask:** *What outcome is this for, in whose words, and what number will show
it moved?*

**Why it matters:** the instinct is to start with the schema — pipelines,
properties, fields — because that is what a CRM taught everyone to do. It
produces a well-configured system nobody has a reason to open. Working
backwards from an outcome the customer already cares about (more capacity,
faster deals, a forecast they trust) tells you which workflow is broken,
which agent removes the bottleneck, and only then which data that agent needs
and where it must come from.

**What good looks like:** a one-line outcome in the team's own words, mapped
to growth, efficiency, or predictability; the workflow that produces it and
the step where it breaks; the agent and skills that remove the break; the
data each needs; and for each data type, its source, its accuracy today, and
a named owner. Fields are derived from what agents need, never designed
first.

**What we have seen:** this ordering appears independently in every
implementation method that has worked. The most common early failure is the
reverse: weeks configuring properties, then discovering the daily briefing
needs none of them and the data it does need was never trusted.

## 2. Privacy rules before the first source connects

**Ask:** *Whose email is excluded, which domains are excluded, and who decided
that — before anything was ingested?*

**Why it matters:** a company brain that ingests email, calendar, and Slack
is holding the most sensitive data the company has. Sharing rules decided
after the fact are decided after someone has already seen something they
should not have. Handled well in week one, privacy is a differentiator the
security team will thank you for. Handled late, it slows the rollout.

**What good looks like:** email-sharing rules, domain exclusions (personal
domains, HR, legal, board), label-based exclusions, and workspace-level
settings decided and written down before any connector is authorized. Set
expectations plainly about what ingestion will do automatically — for
example, that contacts are created from the domains that appear in email —
so nobody is surprised.

**Reference implementation:** inclusion and exclusion controls by address,
domain, and label, with per-thread lockdown; thread-level authorization
computed before a message becomes an object anyone can read
(`context-graph.md`, practices 1–2).

## 3. Connect sources by trust and value: meetings first, write-back last

**Ask:** *What is the order your sources go live, and what has to be true
before each one?*

**Why it matters:** each source carries a different ratio of value to
sensitivity. Meeting recording is the fastest wow and the least sensitive.
Email and calendar are the richest signal and the most sensitive. Writing
into the CRM is the highest-stakes action in the whole system. Sequencing by
that ratio means the team feels value before it is asked to trust anything
consequential.

**What good looks like:** meeting recording first, with historical backfill
from any existing recorder. Then email, calendar, and Slack, after the
privacy rules of practice 2 exist. Then the CRM connected read-only, after
value has been demonstrated. CRM write-back last of all, and only under the
discipline of practice 9. Specialized sources (support, product usage,
tickets) after the core is trusted.

**What we have seen:** email data is typically visible and useful within a
business day of connecting; recorder onboarding is minutes per person. The
teams that connected the CRM first spent their first month debugging field
semantics instead of reading briefings.

## 4. Definitions before fields

**Ask:** *Can a new hire read your stage definitions and place a deal
correctly without asking anyone?*

**Why it matters:** the quality of definitions matters far more than the
number of stages or fields. "Stage 2" means nothing; "the buyer has confirmed
budget and named an economic buyer, and the deal goes stale after fourteen
days without a prospect-owned next step" is something an agent can enforce
and a human can argue with. The same is true of every property: a name is not
a definition, and a tight picklist flattens the nuance that is often the
whole answer.

**What good looks like:** workspace-level instructions written before any
deep agent work — the definitions everyone and every agent inherits. Each
pipeline stage written like a brief to a new hire: entry condition, exit
condition, staleness rule. Separate pipelines only for genuinely separate
motions, sharing one opportunity schema. Each property starting from a
definition observed in the real workflow (a recorded working session is the
best build spec), preferring rich text over picklists, and assigned one of
three update modes deliberately: AI-managed, human-in-the-loop, or manual
only — pain points AI-managed, stage and forecast human-in-the-loop, amount
manual.

**Reference implementation:** workspace instructions apply everywhere at
once — chat, skills, scheduled runs. An AI-managed property's description is
a prompt: write the null case first, then non-overlapping rules per option,
return null on ambiguity rather than guessing, and backfill the definition
across all history (`context-graph.md`, practice 7).

## 5. Don't migrate what native ingest rebuilds cleaner

**Ask:** *Of the fields in your current CRM, how many were touched in the
last year — and which of them describe things your email and calendar
already know?*

**Why it matters:** a fifteen-year CRM export contains a great deal of
history and a great deal of sediment. Contacts and companies mostly rebuild
themselves from live email, calendar, and meeting flow, cleaner than any
import. Deals and pipeline history usually do need to come over. Migrating
everything imports the sediment; migrating nothing loses the history.

**What good looks like:** export and inventory every field; query actual
usage and treat the low-usage set as a candidate list for humans to
spot-check, never a delete list; keep, merge, or discard with a written
rationale for each; let an agent normalize picklist sprawl into a handful of
current values; map legacy stages to new ones by definition, not by name;
filter to active records; sequence email and recording first, then deals,
then a flexible backfill of historical transcripts. Set a baseline date —
"the brain is source of truth from this date onward" — and say it out loud.
"Done" means spot checks pass against the legacy system, the team's ops owner
signs off on the definitions, and day-one reporting parity is captured.

**What we have seen:** migration is workshop facilitation, not data mapping.
Teams discover mid-migration that they disagree with each other about their
own stage definitions. The builder's job is to run that conversation, not to
guess the answer.

## 6. The data-readiness gate: never build and hope

**Ask:** *For each skill you plan to ship, is the data it reads present,
authoritative, single-source, and owned by a named person — today?*

**Why it matters:** the single most repeated implementation failure is
building a skill on data nobody trusts. The skill runs, its output is
plausible and wrong, the champion notices once, and every subsequent output is
read with suspicion. Recovering trust costs far more than the week it would
have taken to fix the source first.

**What good looks like:** a per-skill precondition, checked before the prompt
is written: the data exists, one system is authoritative for it, there is no
second copy that disagrees, and someone owns keeping it right. If the gate
fails, fix the source or descope the skill. The plan should show which skills
passed and which are waiting on data work.

**What we have seen:** the phrase that recurs, almost verbatim, across
accounts: "I was starting to put it in, but then I questioned the data and I
stopped." Every one of those stalls traces to a skill built before its data
was ready.

## 7. Connections are per person, they rot, and "live" is verified from output

**Ask:** *For every person on the team, is their own connection to each
source healthy today — and how would you know if it broke?*

**Why it matters:** there is no such thing as a workspace-level connection to
someone's mailbox or CRM seat. Every person authorizes their own, and the
most common adoption failure is people who never finish that step — the
connection sits one click from complete for weeks. Connections also break
silently after password changes, security policy updates, and token expiry,
and a scheduled skill cannot prompt anyone to reconnect. A skill with a
schedule is not a skill that ran.

**What good looks like:** a per-user connection tracker with dates, swept on
a cadence. Skills that declare which connectors they depend on and degrade
loudly — "pipeline tier unverified, reconnect your CRM to confirm" — rather
than guessing. Slack added explicitly to every channel it should hear;
connecting the workspace is not enough, and ingestion is forward-looking.
Health checked from run output, never from configuration.

**What we have seen:** connector health across a whole customer base is far
worse than anyone assumes until they audit it. Silence is how trust dies: an
agent that quietly stops seeing the CRM keeps producing confident briefings
with a hole in them.

## 8. Seed group first; the team comes in last, onto a working system

**Ask:** *Who are the three to five people connecting first, and what has to
be true before anyone else is invited?*

**Why it matters:** an empty brain does not impress anyone. Until data has
accumulated and skills have been validated against real work, there is no
"wow" — there is a setup checklist. Bringing the whole team in during week
one means the whole team experiences the setup checklist and forms its
opinion then.

**What good looks like:** a seed group whose connections build the memory and
whose reactions tune the first skills. A gate. Then a single recorded
training session for the team, with every integration verified beforehand
and connection instructions sent in advance. An intensive first week — three
to five days of heavy use beats a slow trickle. Human-in-the-loop first,
automation as trust builds. Per-seat activation treated as an owned process
with a deadline: every seat receiving named, role-specific output within
forty-eight hours of kickoff, and "seats still on default skills" tracked as
a red metric until it reads zero.

**What we have seen:** self-serve "set up your own skills" homework leaves
most seats on stock defaults indefinitely. The seats that got activated were
the ones someone owned. People who can read and chat without a paid seat are
a rollout lever — they accumulate data and habit before anyone commits
budget.

## 9. CRM discipline: the record is the first stop, and writes are earned

**Ask:** *When the brain and the CRM disagree about a deal, which one does
the briefing believe — and does it say so?*

**Why it matters:** the CRM is the thing leadership already trusts. A single
briefing that contradicts it unannounced — a wrong executive name inferred
from a transcript, an amount that does not match the report — costs more
credibility than a month of good output earns back. Writes raise the stakes
further: one bad autonomous write to a record everyone depends on ends the
experiment.

**What good looks like:** a trust protocol. The CRM is the mandatory first
stop for any deal fact; softer sources (calls, email) enrich it but never
contradict it silently; every fact traces its source; changed values are
reported as old-to-new with dates, never overwritten quietly, because the
movement is the signal. Field mapping uses runtime discovery for structure
and a customer-authored spec for meaning — structure is introspectable,
semantics never are — and the agent never guesses a field name, relationship
path, or picklist value; if it is not documented, it stops and asks. Writes
are phased: audit-only proposals to a review surface first (proposed value,
current value, evidence with source, date, and the business reason), then
human-approved writes, then automation only where a clean record has earned
it. Confirm which environment is connected before trusting a single number.

**Reference implementation:** agents act in the CRM under each person's own
OAuth, never a shared credential (`eval/salesforce.md`, `eval/hubspot.md`).
Separate reader skills from actor skills; they have different risk profiles
and different failure modes (`agents-and-skills.md`, practice 6).

## 10. Success has a number, a judge, and a date — and drafted fixes ship

**Ask:** *What will be true in two weeks, measured how, judged by whom, on
what date — and where is the list of things you deliberately deferred?*

**Why it matters:** the strongest signal across every implementation studied
is that teams which never set a measurable bar could not tell whether they
had succeeded, and the decision drifted. "Adoption feels natural" is not a
criterion. Equally, an evaluation that drafts fixes nobody deploys is theater:
the misses recur in kind the following week.

**What good looks like:** two or three narrow proof points, each with a
baseline, a target, a named judge, and a date, plus the action test — is the
output driving action, or just being read? Scope filtered honestly: two
weeks can prove "reps act on a useful brief," not "win rate improved";
anything gated on an integration is scheduled for the next phase, never
dropped; anything that would have crept in goes on a visible deferred list.
The decision meeting on the calendar from kickoff, with criteria re-read
verbatim — no moving goalposts in either direction. An improvement loop that
reads field evidence, edits the prompt or playbook, and redeploys — weekly in
the first month, monthly after — with the champion's sentiment watched like a
metric. Output watched, not configuration: the two rot vectors are seats
still on default skills and connectors that broke silently.

**What we have seen:** great outcomes are achievable without any of this —
through expensive, unrepeatable heroics. The gates exist because each one
was, at some real account, the thing that was missing.

---

## Where this lands in `company-brain-evaluation`

- **Phase 1:** practices 2, 4, 6, and 7 are auditable from the folder —
  are there written sharing rules, stage definitions, a source registry with
  owners, any record of per-user connection health?
- **Phase 3, section 7:** the upgrade plan follows the order here. Outcome
  and workflow first; privacy rules; sources by trust and value; definitions;
  the data-readiness gate per planned skill; seed group then team; CRM
  bridge under the trust protocol; a dated success bar with a named judge.
- **Phase 5 (`implement-upgrade/`):** this document is the pre-flight checklist for
  every implementation initiative that skill produces.
