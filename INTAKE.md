# Model Auctions — Submission Intake

**Status: DRAFT (2026-08-07).** Written by reading the deployed forms and the submit
handlers, not from memory. Open questions and freeze criteria at the bottom.

This document exists because `modelauctions.net` collects **the most sensitive data in the
Cadenza Arthouse ecosystem** — a named person's photographs, phone number, social handle and body
measurements — and until today nothing about that was written down anywhere. CAMT already
knew to be careful (`EMAIL_INTAKE.md` routes this address at the strictest level); the site
side had no counterpart.

**The CAMT side is `EMAIL_INTAKE.md`, in `F:\Apps\Cadenza Arthouse Media Tools\`.** This file
covers only what the *site* does and what it hands over. Neither restates the other.

---

## 1. The two intakes, and they are not the same thing

Both forms POST to the same Web3Forms key and land in the same inbox. They are told apart by
the `subject` line and, for models, a hidden `type` field.

| | `/models/` — Become a Model | `/photographers/` — Hire Photography |
|---|---|---|
| Subject | `New Model Auctions application — Become a Model` | `New Model Auctions inquiry — Hire Photography` |
| Hidden `type` | `model` | *(none)* |
| Files | **yes — required** | no |
| Uploads to R2 | **yes** | no |
| Sensitivity | **high** — photos, measurements, phone | ordinary business contact |

This is exactly the case `EMAIL_INTAKE.md` open question 7 flags as unresolved: *"`submission`
is one word for two things."* Here they are two things, and **the discriminator already
exists in the payload** — a consumer does not have to guess.

## 2. What the model application collects

| Field | Required | Notes |
|---|---|---|
| `name` | ✅ | |
| `email` | ✅ | |
| `phone` | ✅ | recorded into `info.json` by the Worker from 2026-09-06 (it previously reached only the email) so the review page can offer a `tel:` link |
| `instagram` | — | |
| `measurements` | — | free text. Sent to the Worker under the name **`notes`**, not `measurements` |
| `photos` | ✅ | multiple; `jpeg png webp heic heif` |
| `age_consent` | ✅ | see §5 — this is the important one |
| `_context` | auto | every query-string param the visitor arrived with, plus `document.referrer` |
| `submission_id` | auto | returned by the Worker in step 1 |
| *(Worker adds)* `userAgent` | auto | the browser's User-Agent string, recorded by the Worker into `info.json`. Not sent by the form; learned 2026-09-05 from the Worker source |

`_context` is real provenance, not tracking cruft: a QR code carrying `?event=` or `?card=`
tells you which printed card or which event produced the application. It rides along into
both the R2 `info.json` and the email.

## 3. The pipeline, as deployed

```
applicant
   │
   ├─ Step 1  photos + name/email/social/notes/_context
   │          POST → https://cadenza-upload.fmohod.workers.dev   (Cloudflare Worker)
   │          Worker verifies Turnstile, writes objects + info.json to R2,
   │          returns { ok, id }
   │
   ├─ Step 2  the same structured fields, MINUS photos and Turnstile token
   │          POST → https://api.web3forms.com/submit
   │          → notification email to the team inbox
   │
   └─ redirect → /thank-you/?ref=<submission id>
```

Two anti-bot layers: a hidden `botcheck` honeypot, and Cloudflare Turnstile verified
server-side by the Worker. The Turnstile token is deliberately stripped before step 2 —
Web3Forms would otherwise trigger its own paid Turnstile integration and reject the send.

**The Web3Forms access key is public** (`dd5e7f84-…`), visible in page source. That is normal
for Web3Forms and is not a leak — it addresses an inbox, it does not grant access to one. It
does mean anyone can send mail to that inbox, which is one more reason nothing downstream
may auto-apply a submission.

**The photographs are never in the email.** Web3Forms' free plan carries no attachments, so
R2 holds the only copy. The email is a *notification*, not the record.

## 4. Failure mode: the orphan submission

Step 1 and step 2 are independent network calls, and step 1 is the one that stores data. If
step 2 fails, the applicant sees:

> Photos were received, but the notification email failed: …

At that moment **a real person's photographs, phone number and measurements are sitting in
R2 and nobody has been told.** There is no notification, no desk entry, no reconciliation
pass comparing R2 objects against the mailbox. The submission simply does not exist as far
as any human or any tool is concerned.

This is not hypothetical plumbing — the diagnostic message in the handler exists because
step 2 *has* failed. Any reconciliation the consumer eventually performs should treat R2 as
the authority for "did a submission happen," and the mailbox as the authority for "was it
seen."

## 5. The age gate admits minors, and nothing records it

The required consent reads:

> I confirm I am 18 years of age or older, **or that a parent/guardian is submitting this
> application**

That second clause is deliberate and defensible — families do submit for young performers.
But the consequence is not currently handled anywhere:

- **A single checkbox covers both cases.** Nothing in the payload distinguishes an adult
  applicant from a parent submitting for a child.
- So the pipeline can legitimately receive **a minor's photographs, measurements, phone
  number and Instagram handle**, and the email, the R2 `info.json`, and CAMT's `restricted`
  default all treat that submission identically to an adult's.
- No guardian name, guardian contact, or subject date-of-birth is collected, so there is no
  way to verify the claim or contact the responsible adult.

**This is the highest-priority open item in this document.** It is a data-handling question
before it is a schema question, and it should be settled *before* the CAMT submission
consumer is built — retrofitting a minor flag onto records already in the bucket means going
back through them by hand.

Three ways out, none adopted here because this is the owner's call:

1. Split the consent into two checkboxes and, when the guardian branch is chosen, require
   guardian name and contact plus the applicant's date of birth.
2. Set a hard floor — applications accepted from 18+ only — and route minors to a separate
   process that starts with a conversation.
3. Keep the current wording and add an explicit `is_minor` field the Worker records, so at
   minimum the handling difference is *visible* downstream.

### RESOLVED 2026-08-31 — option 2, and the box now gates the upload

**Owner ruling** (Attention Desk, `modelauctions-minor-consent`):

> *"They have to check the box that says they are 18 years old or older, so no minor better
> submit photos. **If that box is not checked I don't want them to even be able to submit the
> photo.** … And no parents submitting pictures of their kids, because I just don't have the
> capacity or anything to deal with kids and Model Auctions right now — unlike with Cadenza
> Arthouse Education tools where I do keep the records for kids, because that's part of the
> business. In the case of Model Auctions, kids are not part of the business."*

Note the reasoning, because it is not a blanket policy and a future session should not
generalise it: **CAET keeps records about children on purpose, because teaching them is the
business.** Model Auctions has no such need, so it takes none.

What changed in `models/index.html`:

- **The guardian branch is gone.** The consent read *"or that a parent/guardian is submitting
  this application on my behalf"*, which is precisely what let a child's photographs and
  measurements into the pipeline with nothing recording it. It now reads 18+ only.
- **The checkbox gates the file picker.** `required` alone only blocks a *submit*, so the
  picker was live from page load and a minor could stage photographs before the form ever
  refused them. The input is now `disabled` until the box is ticked, and unticking it
  **clears any selection already made** rather than leaving files staged behind a disabled
  control.
- **The submit handler checks again.** A disabled input is a UI state and anyone with devtools
  can undo it. Verified by doing exactly that in a browser: with the attribute stripped and
  consent unticked, no upload fires and the form says *"You must confirm you are 18 or older
  before submitting."*

**Still open, and deliberately not invented here:** nothing verifies the claim, and the Worker
records no age assertion alongside the submission. A checkbox is an assertion, not a
verification — this closes the *"we collected it without noticing"* hole, not the *"someone
lied"* one.

## 6. What happens after the email — and what does not

**Nothing automatic.** There is no CAMT consumer for these messages yet.
`EMAIL_INTAKE.md` files the message as a desk entry at publication level `restricted` and
stops. Per that contract, the eventual consumer must be built **never-publishes**, with a
review view that shows personal data on screen.

Three standing rules that already bind, stated here so the site side knows them:

- **No tool raises a publication level. Only the owner, per record** (CAS §9.13). An
  application arriving does not make anyone publishable.
- **Approving an application publishes nothing.** It creates or updates a person entity —
  a different shape from the calendar's propose→approve→publish, and the reason
  `EMAIL_INTAKE.md` refuses to extract a shared interface until a second consumer exists.
- **`DATA_MODEL.md` has no notion of "someone who applied."** That concept does not exist in
  the Entity Registry yet, and inventing it casually is how a second person database gets
  born.

### Editorial coverage is not applicant data

`0010/` and `0011/` are published articles — event coverage that names people, in the same
format CadenzaFeed uses. They are **not** applications and nothing in this document governs
them. Do not let the two flow together: a name that appears in a runway report has not
consented to appear in a talent database, and an applicant has not consented to be written
about.

## 7. Retention

**Undecided, and it needs deciding.** Nothing currently states how long R2 keeps the
photographs of an application that is declined or never answered.

The archive's own principle, settled 2026-08-03 for email, points the way: **keep the
record, not the payload.** The durable thing is a small structured record — who applied,
when, from what context, what was decided — and a link. Bulk originals for a person who was
never onboarded are cost and exposure with no corresponding value.

## 8. Known gaps in this repo

| Gap | Detail |
|---|---|
| ~~`R2_SETUP_GUIDE.md`~~ | **Closed 2026-09-05.** The guide still does not exist, but the bucket (`cadenza-private`, bound as `CADENZA_BUCKET`), the key layout (`applications/models/SUB-<id>/info.json` + `01-<file>`…, an id never a name) and the `info.json` shape are now written down in CAMT at `workers\cadenza-upload\README.md`, read from the deployed Worker |
| ~~Worker source~~ | **Mirrored 2026-09-05** to CAMT `workers\cadenza-upload\index.js` via the Cloudflare connector. Kept out of this repo on purpose: modelauctions.net is served by a Worker with this repo as static assets, so a file here is a public URL. The deployed Worker stays authoritative; the mirror can go stale because the Worker is still edited by paste in the dashboard |
| No reference number for the applicant | `/thank-you/?ref=<id>` receives the submission id and never displays it, so an applicant has no way to reference their own submission |
| Field name drift | the form's `measurements` is sent to the Worker as `notes`; the review page labels it *Notes / measurements* |
| ~~No privacy notice~~ | **Closed 2026-09-04.** `legal/terms/` §1.6 (Applications and the information you send us) and §1.8 (Privacy) now state what the form collects, where photographs go, that applying is not publication, how to withdraw, and which service providers see technical data. Written from this document, not from memory. Retention is still undecided (§7) and the terms deliberately state no period. **If a form field changes, §1.6 and this file change in the same session.** |

## 10. The review loop — notify, review on the phone, decide, promote (DRAFT design, 2026-09-06)

**The ask** (owner, 2026-09-05/06, in his words): *"eventually I want CAMT to check for new
submissions and let me know via ntfy. And then I can click the ntfy bubble and see a mobile-friendly
review where I can actually click the link to the Instagram page, or swipe through the pictures they
sent, all without having to come to the desktop and open that shortcut and click through every
individual picture that opens as its own tab … and I could even tap approve that person to be saved
as an entity and a round-one research can be done to build up a public profile bio report."*

**What already exists, so nothing is invented twice.** ntfy is CAMT's phone channel: self-hosted
on the owner's machine, reached over the tailnet, `core.notify(title, body, priority, click=…)`,
with the phone-priority policy in `ANNOUNCEMENTS.md`. The Worker already lists submissions at
`/admin`. The email notification already files a `restricted` desk entry (`EMAIL_INTAKE.md`). What
is missing is the glue, in four stages that ship one at a time.

**Where the Worker lives now (owner ruling 2026-09-06):** its own private GitHub repo,
`cadenza-upload`, cloned at `F:\Apps\cadenza-upload`, deployed by Workers Builds on push exactly
as `modelauctions-site` is. Editing in the dashboard ends the day that connection is made. The
CAMT copy under `workers\cadenza-upload\` becomes a pointer, not a mirror.

### Stage 1 — CAMT notices a submission

`jobs\submissions_watch.py`, unattended (`JOB_CONTRACT.md`), every few minutes: list `*/info.json`
under every type prefix in `cadenza-private`, compare against a local ledger, push one notification
per new id and record it. This is where **R2 is the authority for "did a submission happen"** (§4)
finally gets a reader, and the **orphan check** (freeze criterion 4) falls out of the same ledger:
ids in R2 with no desk entry.

- Needs an **R2 API token, read-only, scoped to `cadenza-private`**, in CAMT's DPAPI box beside the
  Square token. That is a new outbound channel under AGENTS rule 8 (**#9, owner ruling required**;
  payload: nothing leaves, it reads). The Worker's own binding is not a credential CAMT can use.
- The ledger (`registry\submissions.yaml`, via `core.py`, never written directly) holds the
  **record, not the payload** (settled 2026-08-03): `submission_id, type, submitted_at, file_count,
  context, notified_at, decision, decided_at, entity_id` — no name, no email, no photographs. The
  photographs stay in R2, which is where the review happens.
- The push carries **no personal data**: *"New model application · SUB-M8X2K1A-QZ4T · 3 photos ·
  via card 12"*, priority per policy, `click` = the review page below. ntfy is private over the
  tailnet, but the lock screen is a public surface (`core.notify` already reasons this way).
- Offline: degrades, says so, retries next tick. Never a core dependency (rule 8).

### Stage 2 — the review page, on the phone

The Worker gains `GET /admin/review/<submission-id>`: one submission, mobile-first. Full-width
photographs in a horizontal **scroll-snap strip** (swipe; tap for full screen; no new tabs), then
the contact block as **tappable links** — the handle as `https://instagram.com/<handle>` with the
`@` stripped, phone as `tel:`, email as `mailto:` — then notes/measurements and the arrival context.
The `/admin` list links each row to it. Same Basic-auth gate as today; **Cloudflare Access in front
of `/admin` is the recommended replacement** (dashboard setting, free at this size), because a
one-tap Google login on the phone beats a shared password typed on glass.

### Stage 3 — decisions, without an inbound port

Buttons on the review page: **Approve · File as entity · Later · Decline** (built 2026-09-06). Each
writes `decision.json` beside `info.json` in R2 (`{decision, decided_at, by:"admin"}`); the Worker
has the binding, so no new credential. *File as entity* is the owner's instruction to stage 4; the
Worker only records it. **Delete** (also built) removes every object under the submission's folder,
one from the review page or several from the list's select mode, after a confirm. The payload is
gone; the notification email and, later, the CAMT ledger record remain, which is exactly the
*records not payloads* shape retention wants. CAMT's poller reads decisions on its next tick and applies them. R2 is the mailbox in
both directions; CAMT never listens on a public port. Declined submissions become the first real
input to **retention** (freeze criterion 2): a declined or ignored application's photographs are
cost and exposure with no value (§7).

### Stage 4 — approve → entity → round-one research

Approving is the owner's confirmation in the authority chain (**model proposes → CAMT validates →
owner confirms → CAMT executes**, `CONSOLE.md`); the tap *is* the confirmation, so CAMT executes:

1. **A person entity**, through `core.py` (rule 2), `verification: self_identified` — the applicant
   said who they are; nobody has confirmed it (open question 3 below, now with a proposed answer).
   **`publication: restricted`.** No tool raises it (CAS §9.13), and the Terms (`legal/terms/`
   §1.6) promise the applicant that nothing they sent is published or used publicly without separate
   written consent. Approval is an internal state, not a page.
2. **Round-one research** — a report, `restricted`, filed on the entity, built the way the newsroom
   jobs already build research: from what the applicant handed over (their photographs, their handle,
   their notes) and the public profile that handle points at. Purpose: prepare the owner for the
   conversation and the shoot. **Not** a dossier: no scraping beyond the profile they gave, nothing
   from people who did not apply, and the report never leaves `restricted` on its own. If it is ever
   to become a public bio, that is a separate written-consent step with the person, the same as any
   feature.

This stage is the one that needs the most owner rulings before code: the verification level, what
"round one" may look at, and where the report lives on the entity.

### Order and gates

Stage 1 is worth building alone and needs only the R2 token ruling. Stage 2 is Worker-only and
needs no ruling. Stage 3 needs 1 and 2. Stage 4 needs 3 plus the three rulings above. None of it
touches the forms, so §2 and the Terms are unchanged.

## 9. Open questions

1. **The minor question (§5)** — which of the three options.
2. **Retention (§7)** — how long, and what the lifecycle rule actually is.
3. **Does an accepted applicant become a `person` entity, and at what `verification` level?**
   They self-identified, which is real evidence but not the owner's confirmation.
   *Proposed 2026-09-06 (§10 stage 4): yes, on the owner's approve tap, at `self_identified`,
   `restricted`.*
4. **Who reconciles R2 against the mailbox**, and how often, so orphans surface?
   *Proposed 2026-09-06 (§10 stage 1): `jobs\submissions_watch.py`, every few minutes, from its
   own ledger.*
5. **Do the two intakes stay in one inbox?** Separate addresses would let
   `EMAIL_INTAKE.md` route them at different sensitivities without reading the body.

## Freeze criteria

FROZEN when all four are true:

- [ ] The minor-handling decision is made and reflected in the form.
- [ ] A retention rule exists and is implemented as an R2 lifecycle policy.
- [ ] One real application has travelled the whole length — form → R2 → email → CAMT desk
      entry → owner decision — with the personal data never leaving `restricted`.
- [ ] An orphan check exists: something can answer *"is there anything in R2 that never
      produced a desk entry?"*
