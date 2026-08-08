# Model Auctions — modelauctions.net

Houston's curated talent and photography network. A static site on GitHub Pages, part of
the Cadenza Arthouse group.

## What is here

| Path | What it is |
|---|---|
| `index.html`, `all.html` | landing and full listing |
| `join/` | the fork — apply as a model, or hire a photographer |
| `models/` | **the model application form.** Uploads to R2, then emails. See `INTAKE.md` |
| `photographers/` | photography booking enquiry. Email only, no uploads |
| `thank-you/` | post-submission page for both forms |
| `legal/terms/` | Terms of Use |
| `0010/`, `0011/` | published event coverage, same article format as CadenzaFeed |
| `style.css`, `assets/`, `images/` | presentation |

## Read this before touching the forms

**`INTAKE.md` is the contract for everything under `models/` and `photographers/`.**

That site collects a named person's photographs, phone number, social handle and body
measurements — the most sensitive data anywhere in the Cadenza ecosystem. The application
form is not an ordinary contact form and must not be edited like one. In particular:

- the submit handler is **two calls, not one** (R2 upload, then notification email), and
  the failure mode between them leaves real personal data stored with nobody notified
- the age consent **admits minors** via a parent/guardian clause, and nothing downstream
  records which case a submission is
- nothing here may publish an applicant. Publication is gated in CAMT and raised only by
  the owner, per record

## Where the rest of the documentation lives

| Document | Location | Covers |
|---|---|---|
| `INTAKE.md` | this repo | the submission pipeline, what is collected, sensitivity, failure modes |
| `EMAIL_INTAKE.md` | `F:\Apps\Cadenza Arthouse Media Tools\` | what CAMT does with the resulting mail |
| `DOCUMENTATION_REGISTER.md` | `F:\Apps\Cadenza Arthouse Media Tools\` | every contract across every repo, and which pairs must move together |

## Publishing

Articles (`0010/`, `0011/`) follow the same page format as CadenzaFeed; that convention is
documented in `F:\Apps\CadenzaFeed\PUBLISHING.md`, and the record model it produces is
`ARCHIVE_RECORD_SPEC.md` in CAMT. **Published coverage and applicant data are separate
concerns** — see `INTAKE.md` §6.
