# CLAUDE.md — Model Auctions site

Static site (GitHub Pages, no build step) at modelauctions.net. Part of the Cadenza Arthouse
group. Vanilla HTML/CSS/JS — keep it that way unless explicitly asked.

## The one rule that matters here

**`models/` and `photographers/` are intake forms handling real personal data. Read
`INTAKE.md` before editing either one.**

This is not an ordinary contact form. The model application collects a named person's
**photographs, phone number, social handle and body measurements**, uploads them to a
Cloudflare R2 bucket, and only then sends a notification email. Three consequences:

1. **The submit handler is two independent network calls.** Step 1 stores the data, step 2
   notifies. If step 2 fails, personal data is sitting in R2 with nobody told. Do not
   "simplify" that handler without understanding what each call does.
2. **The age consent admits minors** via a parent/guardian clause, and nothing currently
   records which case a submission is. That is a known, open, high-priority item — see
   `INTAKE.md` §5. Do not close it by guessing.
3. **Turnstile's token is deliberately stripped before the email step.** It looks like a
   bug and is not: Web3Forms would otherwise trigger its own paid integration and reject
   the send. The Worker has already verified it server-side.

## What may never happen here

- **Nothing on this site may publish an applicant.** Publication is gated in CAMT and
  raised only by the owner, per record (CAS §9.13). An application arriving does not make
  anyone publishable, and there is no automatic path from a submission to a public page.
- **Do not merge applicant data with editorial coverage.** `0010/` and `0011/` are
  published event articles that name people. Those names came from reporting, not from
  applications, and the two must not flow together in either direction — see `INTAKE.md` §6.
- **Do not add fields to the application without updating `INTAKE.md` in the same session.**
  The whole reason that document exists is that this pipeline ran for months with nothing
  written down about what it collects.

## Articles

`0010/` and `0011/` follow the CadenzaFeed article format, including the game meta block.
The template and checklist are in `F:\Apps\CadenzaFeed\PUBLISHING.md`; the record model
they produce is `ARCHIVE_RECORD_SPEC.md` in CAMT.

## Where the rest lives

- `INTAKE.md` — this repo. The submission pipeline, in full.
- `EMAIL_INTAKE.md` — CAMT. What happens to the resulting mail; routes this domain at
  `restricted`, the strictest default in the ladder.
- `DOCUMENTATION_REGISTER.md` — CAMT. Every contract across every repo, and which pairs
  must be updated together.
