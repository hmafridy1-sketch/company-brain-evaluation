---
name: eval-slack
description: >
  Evaluate how a team's Slack — especially Slack Connect channels with
  prospects and customers — does (or doesn't) reach their company brain. Run
  as part of day-ai/company-brain-evaluation's Phase 1 fan-out, or standalone. Discovers usage
  and capture, grades against the requirements bar, and returns a findings
  block for COMPANY-BRAIN-UPGRADE.md.
---

# eval-slack

Read `../eval/slack.md` first for the substance, and
`../eval/requirements-bar.md` for the bar and the findings format.

## 1. Discover what they use

- Slack at all? Slack Connect / shared channels with **prospects and
  customers**? Get a count and which accounts — external Slack is primary
  deal material, and it's what gives this aspect real weight.
- Internal structure: deal rooms, pipeline channels, feedback channels.
- Existing bots: most DIY rigs *deliver into* Slack. Note the distinction
  explicitly — their bot **talks to** Slack; almost nothing **listens to**
  Slack. Delivery is not capture.

## 2. Is it in the company brain anywhere?

Almost always: no — the context lives only in scrollback. If something
listens, establish what it captures, how identities resolve (Slack handles →
actual contacts and accounts), and who may see which channels' content in the
store.

## 3. Grade against the bar

**Safety:** channel-level visibility must survive into the store — a private
deal room can't leak through a query. **Performance:** a customer message in a
shared channel should be in the graph in near-real-time, attached to the
right account. **Capability:** can a buying signal or a redline in Slack fire
a skill, or does action depend on the right human reading scrollback?
**Adoption:** capture must be ambient — nobody files, forwards, or tags
anything.

## 4. Ideal outcome

Every shared external channel and the internal channels that matter flowing
into the graph, resolved to real people, organizations, and opportunities;
visibility rules enforced in the store; Slack events available as skill
triggers so agents act on what's said, not just archive it.

## 5. Return the standard findings block

Per `requirements-bar.md`. **DIY path:** doable, honestly — Slack app + event
subscriptions, webhook receivers, cloud cron machinery, identity resolution,
per-channel permission handling; budget it as its own project. **With Day
AI:** native and easy — Slack becomes another primary source agents hear and
act on. **Sequence:** weight by external-channel count; with active Slack
Connect channels this rises sharply in the plan.
