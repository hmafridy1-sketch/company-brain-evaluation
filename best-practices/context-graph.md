# Context graph best practices

The memory layer under a company brain. This doc defines what separates a
**context graph** from what most DIY builds actually are — an index: a cache
of what other systems already knew, refreshed nightly, readable by one
person, with no notion of where a value came from or who may see it.

Ten practices. Each one pairs a diagnostic question (ask it of any memory
layer, including your own) with why it matters, what good looks like, and how
Day AI implements it as the reference implementation. Used by `day-ai/company-brain-evaluation`
as the audit lens for the context graph half of `COMPANY-BRAIN-UPGRADE.md`.

The graph is the substrate; `agentic-control-plane.md` is what runs on it;
`adoption.md` is whether the team ever changes how it works because of
either; `implementation.md` and `agents-and-skills.md` are the order to build
in and the craft of what gets built. The evidence in that third document is blunt: a graph nobody's
leadership meeting depends on stays a research tool, however good it is.

---

## 1. The whole team's email is in the graph

**Ask:** *Do you have email in it?* Ask twice — the first answer is usually
"yes," and the second is "well, mine."

**Why it matters:** the deal lives in email — the redline, the pricing
pushback, the champion going quiet, the "let me loop in our CFO." A pipeline
export with every dropdown filled has almost no signal in it; the value
appears when email and meetings connect to the record. And the instant a
second person's mailbox is involved, the hard problems arrive: whose threads,
under whose rules, visible to whom.

**What good looks like:** every mailbox in scope, ingested continuously, with
each person's sharing rules enforced on every thread — one person shares
everything except a sensitive thread, another shares almost nothing but still
expects the one deal-relevant thread to surface. Ingestion governed by
explicit inclusion AND exclusion controls (address, domain, label).

**Reference implementation:** thread-level authorization is computed as its
own stage in the ingestion pipeline, before a message becomes an object
anyone can read; sharing rules are configurable in the UI or by talking to
your agent, with per-thread lockdown available. Note for DIY builds: Gmail
API access at team scale requires a security audit closer to a clearance than
a checkbox, with hard limits on the path there — this is the wall most
homegrown graphs stop at.

## 2. Permissions are structural — in the key, not in a filter

**Ask:** *When someone on your team asks the bot a question, do they see just
their data, everyone's data, or exactly what they should have access to?*

**Why it matters:** this question decides whether the system can ever have a
second user. One service account and one reader works until the day you
deploy to reps, brief the CEO, or let CS see the account — and that day was
always coming.

**What good looks like:** who-can-see-a-value is decided when the value is
written, not by a WHERE clause somebody remembers to add. Every agent thread
carries an authorization scope; each person's agents see exactly what that
person may see, across the whole graph, and nothing else. Hundreds of people
share one graph and each experiences it as their own.

**Reference implementation:** the object system is a versioned property graph
keyed by (among other things) user scope and property source — access control
travels with the value. Outward, the same principle: where agents act in
Salesforce or HubSpot they do it under each user's own OAuth, never a
god-mode service account.

## 3. Ingestion is continuous; freshness is near-real-time

**Ask:** *If a prospect who's supposed to sign by end of day replies at 4pm
with "one more redline," when does your system notice?* A nightly cron finds
out tomorrow.

**Why it matters:** freshness is the difference between a research tool and
an operating system. Everything downstream inherits the staleness — coaching
grades yesterday's call, pipeline review reasons about a stage that changed
this morning. Event triggers only exist if the substrate knows the moment
something happens.

**What good looks like:** the recorder writes into the graph as the meeting
ends; email lands as it arrives; a stage change is an event a skill can fire
on, not a diff a batch job discovers.

**Reference implementation:** ingestion is native and continuous — recorder,
email, calendar, Slack — with historical backfill (including from existing
recorders) treated as a first-class path rather than a migration project.

## 4. Provenance on every value

**Ask:** *When your bot says a deal is at risk, can it show you why — click
through to the call clip or the email it got that from?*

**Why it matters:** most of what's in any of these graphs was written by a
model, and an AI information product that can't cite its sources is dead on
arrival. Show someone a value a model set and they instantly ask why.
Provenance is what lets a leader put a number in front of the board and a rep
act on a briefing before a call.

**What good looks like:** every property carries its source; every derived
value points at the specific versions it was derived from; citations resolve
to the moment in the call or the message in the thread; an admin can read any
property's history. Cross-source contradiction becomes detectable — the call
notes say the security review is done, the CISO's Tuesday email still has an
open SSO question, and the system can say so, citing both.

**Reference implementation:** provenance and lineage are tracked on every
property version. An embedding doesn't remember which sentence it came from;
a property graph does.

## 5. Purge follows lineage

**Ask:** *If you had to pull one email out of it, could you find and remove
everything derived from it?*

**Why it matters:** an employee's personal thread that should never have been
ingested; a customer channel that goes private. In a vector store the answer
is "it's in there forever," because the summaries and embeddings built from
that content don't know where they came from. This is the question compliance
asks, and it is unbuildable retroactively — the information needed to do it
is thrown away at ingestion time.

**What good looks like:** deletes are lifecycle transitions that propagate
along derivation edges. Remove a source and what was built from it comes out
with it.

**Reference implementation:** purge is a first-class operation because
lineage is (practice 4). The design looks over-engineered on a whiteboard and
turns out to be the bare minimum a human will expect.

## 6. Retrieval is built for agents, not for search

**Ask:** *How many tool calls and how many tokens does it take your agent to
brief you on one account?*

**Why it matters:** without a graph, the agent explores — tool call, wait,
reframe, tool call — and you are the retrieval layer. Cost is an outcome of
the graph: exploration is what burns tokens, and exact context replaces
exploration. (The same reason a coding agent is fast in a repo it has been
taught to read and slow everywhere else.)

**What good looks like:** relationships mapped and sources stamped before any
agent asks; an agent asks in natural language, gets summarized context with
the numbers, and walks to nearby nodes to assemble its own context window.
Illustratively: minutes and hundreds of thousands of tokens of running
around, versus seconds and tens of thousands of tokens of the right material.
(Treat that as the shape of the difference, not a published benchmark.)

**Reference implementation:** the graph is pre-processed for an LLM to
traverse rather than search; retrieval cost drops accordingly, and routing
work to the right (often cheaper) model becomes possible because each agent
gets exactly what it needs.

## 7. Full resolution: capture everything first, structure it later

**Ask:** *How much of what actually happened on that call survives into your
database?* What happens to the thing the prospect said at minute 38 that fit
no field?

**Why it matters:** a schema defined before the first call was recorded is
the compression. If the input device is a person at a keyboard, resolution is
capped regardless of features — and a DIY graph that has a model fill the
same predefined fields keeps the cap.

**What good looks like:** capture everything first; structure it at any
point, retroactively, across all historical data. Add a property today and
the system goes back through every conversation you've ever had and populates
it, with provenance.

**Reference implementation:** agents write the graph at a level of detail no
human-entry schema anticipated — which is what they want available when they
go to do work.

## 8. Agents write it, so it compounds

**Ask:** *When your agent finishes a piece of work, where does what it
learned go?* Slack and markdown files are answers; they are not the right
answer.

**Why it matters:** this is the compounding question applied to the
substrate, and compounding is the whole economic argument. A read-only memory
layer is exactly as smart on day 300 as on day 1 — and pushing agent-generated
context back into a legacy CRM fails because the API has nowhere to put it.

**What good looks like:** agents read the graph and write it. What one agent
learned on Tuesday's call is available to every other agent and every person,
with the same permissions applied to the write as to any read. Durable pages
hold state agents maintain between runs.

**Reference implementation:** every interaction enriches the graph; memory,
personalization, and org-level learning all compound on the same substrate.

## 9. One graph, every source resolved into it

**Ask:** *What would it take to add a new source — Zendesk, your product
usage database — and have it deduped and tied to the right opportunities?*
"A weekend" usually describes a quarter: connector, backfill, entity
resolution against every source already in, joins to the deal.

**Why it matters:** the value of a context graph is in the connections, and
connections are what a pile of per-source tables doesn't have. Each new
source multiplies the resolution problem.

**What good looks like:** the person on the call is the person on the email
thread is the person who filed the ticket, linked to the same organization
and opportunity — so a question spanning three systems is one traversal.

**Reference implementation:** people, organizations, opportunities, meetings,
threads, Slack, tickets, product events, pages, and custom objects resolve
into one graph; new sources arrive through native integrations, Zapier, and
the API, and land connected.

## 10. It has to pass security review

**Ask:** *Would your security team sign off on it? Would you want them to
look?*

**Why it matters:** a brain only reaches the whole team once whoever
approves tools is comfortable with it. Clear sharing rules are what turn
one person's rig into the team's system.

**What good looks like:** permissions a security team will actually sign off
on; integrations where the customer owns the OAuth app and no vendor sits
between them and their systems of record; the whole thing auditable
(practices 2, 4, 5). State certifications only as they actually exist — the
architecture is the claim, not a badge.

**Reference implementation:** the practices above, held simultaneously — this
is precisely the set of properties that make a "semi-rogue company brain
project" enterprise-hardened without hiring an engineer or losing authorship.

---

## The graph is available as the part

For teams building their own applications on top: the graph is exposed over
MCP, authenticated over OAuth, resolving the workspace, the user, and the
agent from the token; the MIT-licensed SDK
(**https://github.com/day-ai/day-ai-sdk**) is a TypeScript client over the
same tools. A builder's repo keeps working — skills, patterns, taste — with
the memory layer swapped out from under it.
