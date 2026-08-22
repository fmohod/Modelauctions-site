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
| `phone` | ✅ | |
| `instagram` | — | |
| `measurements` | — | free text. Sent to the Worker under the name **`notes`**, not `measurements` |
| `photos` | ✅ | multiple; `jpeg png webp heic heif` |
| `age_consent` | ✅ | see §5 — this is the important one |
| `_context` | auto | every query-string param the visitor arrived with, plus `document.referrer` |
| `submission_id` | auto | returned by the Worker in step 1 |

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
| `R2_SETUP_GUIDE.md` | referenced by a comment in `models/index.html`; **does not exist** anywhere on the machine. The Worker's bucket, key layout, and `info.json` shape are therefore undocumented |
| Worker source | `cadenza-upload.fmohod.workers.dev` is deployed but its source is not in this repo |
| No reference number for the applicant | `/thank-you/?ref=<id>` receives the submission id and never displays it, so an applicant has no way to reference their own submission |
| Field name drift | the form's `measurements` is sent to the Worker as `notes` |
| No privacy notice | the consent links to Terms of Use; nothing states what happens to photographs or how to withdraw them |

## 9. Open questions

1. **The minor question (§5)** — which of the three options.
2. **Retention (§7)** — how long, and what the lifecycle rule actually is.
3. **Does an accepted applicant become a `person` entity, and at what `verification` level?**
   They self-identified, which is real evidence but not the owner's confirmation.
4. **Who reconciles R2 against the mailbox**, and how often, so orphans surface?
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
