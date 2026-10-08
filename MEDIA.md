# Media — the "live TV" wrapper over YouTube-hosted video

**Status: DRAFT (2026-09-04), version 1 built and live at `/media/`; split across two sites on
2026-10-08 (§0).** Freeze criteria at the bottom. This file is the contract for the engine on
**both** sites.

## 0. Two sites since 2026-10-08

The owner's ask, in his words: *"move the non-fashion related things to the Cadenza Art House
media page, and the model auctions page can have all the modeling content."* (Same day's voice
log `20261008-01`: *"I don't need to have all the Houston stuff, the atmosphere ... only things
related to fashion photo shoots and models."*)

| | Model Auctions (`modelauctions.net/media/`) | Cadenza Arthouse (`cadenzaarthouse.com/media/`) |
|---|---|---|
| carries | **modeling content:** the Fashion Shows playlist (5 videos) | everything else: Live Shows (2), Houston (4), Atmosphere (1 + two Universe B trailers), and the Vigil/Canvass report |
| repo | this one | `CadenzaFeed`, folder `media/` |
| manifest | `media/channels.json` | `media/channels.json` there |

**The rule is by playlist, because channels are his playlists:** a video belongs to the site its
playlist belongs to, and a video in no playlist is not modeling content. Two calls were mine, and
each is one line to reverse: *Live Shows* (Psychotic Princess, an Empyre Room stage show; Melanin
Muse Art Show) moved as a whole playlist, and the Universe B trailers travelled with *Atmosphere*.
If Psychotic Princess is modeling content it belongs with Fashion Shows.

**The engine is mirrored, not shared** (no build step): `media/media.js` is the same file line for
line on both sites, and the stylesheet is ported (`style.css` § MEDIA PAGE here, `media/media.css`
there, with a lightened bronze accent on the main site's light page). A fix to either goes to both.
Page copy that depends on the lineup is never hard-coded: `data-channel-count` in the HTML is
filled from the manifest. `CadenzaFeed/media/README.md` has the table of what is shared.

## 1. What the owner asked for

Voice log `20260903-02` (3 September 2026), in his words, condensed:

> *"I can recreate a live television broadcast using just video clips … four different channels
> … on channel one you have the eight hour loop that's just continuously looping … it's not real
> live broadcast it's just videos that they set up in that way … design a website and make it
> look like it's a live TV streaming website … it's just video files … a user display interface
> that looks like the TV guide … my videos are literally uploaded to YouTube … we're recreating
> the wrapper … if somebody clicks play at a given time it'll just jump to that portion of the
> video as if it were playing live … using YouTube as the hosting service … pulling from the
> YouTube thumbnail."*

Two presentations named in the log, both built: the **Netflix-style menu** (headline section,
then rows of tiles, hover shows more) as an acceptable version one, and the **TV guide** (channels
lined up against the current time) as the real target. A third came on 2026-09-04 with three screenshots of the Netflix phone app (`F:\Media\inbox\screenshots\S23\Screenshot_20260904_1350*_Netflix.jpg`): the **App** view — app bar with the master logo, filter chips, a portrait billboard with the brand mark in its corner and Play / Join-live buttons, an "on now" row with the loop's progress, a picks row with corner badges, one row per channel, and a floating bottom tab bar that switches views. Gold where the reference is red; the logo is recolored by CSS mask over the master `assets/logo.png`, never a redrawn copy. The ruling that binds the whole
thing, restated in his brief for this session: **video plays only when someone actually clicks.**

Nav rulings, same day: *Castings* folds into *Events*; *Media* takes its place in the masthead;
then, once all three views existed: **the live-TV guide is "Streaming" in the masthead; "Media"
opens Browse on a desktop and App on a phone** (the owner's words: Browse suits desktop, App suits
mobile). The page routes on arrival: `?view=guide|browse|app` wins, otherwise viewport width at
768px decides. The three tabs on the page and the app's bottom bar still switch views for the
visit; nothing is remembered between visits.

## 2. What it is

| Piece | File | Job |
|---|---|---|
| the page | `media/index.html` | stage (poster → player), view tabs, guide, browse, app, the honesty note |
| the engine | `media/media.js` | schedule math, guide and browse rendering, click-to-load player |
| the lineup | `media/channels.json` | channels, their order, each video's id, title, duration |
| channel art | `media/art/*.jpg` | one image per channel for the browse hero cards |
| styles | `style.css` § MEDIA PAGE | shared stylesheet, same as every other page |

**Channels are the owner's YouTube playlists**, in his order, with his names: Live Shows, Fashion
Shows, Houston, Atmosphere. (Since 2026-10-08 this site carries Fashion Shows only; the other three
are on cadenzaarthouse.com, §0.) A video may appear in more than one lineup. Videos on the channel but
in no playlist show under *Also on the channel* in browse and play as a one-item channel.

## 3. The schedule is arithmetic, not state

Every channel is a loop: its lineup end to end, total duration `T`. The manifest fixes an
**epoch** (`2026-09-04T00:00:00-05:00`). At any instant `t`:

```
elapsed = (t − epoch) mod T
walk the lineup accumulating durations until elapsed falls inside a video
→ that video is "on now", at offset (elapsed − start of that video)
```

So every visitor, on every device, computes the same "what is on" from the clock alone. There is
no server, no cron, no state, nothing to drift. The guide draws the next `guide_window_min`
minutes (30) in `guide_step_min` (5) columns by walking each loop forward from the snapped
window start. A tick every 15 s redraws the guide and moves the now-line.

**The loop rule.** A channel whose whole loop is shorter than one guide column would draw as
confetti (Houston is 3:36 across four clips; Atmosphere is a ten-second clip). Such a channel
is drawn as one continuous block, *"Houston · loops every 3:36"*, and clicking it joins the loop
wherever it is. The rule is generic: the moment a lineup outgrows a column it gets real blocks.
This is why hour-long recordings (the yoga class he mentioned) are what make the guide sing; the
current catalog is short-form.

**Durations are load-bearing.** They come from YouTube and live in the manifest. A wrong duration
skews every "on now" after it in that loop. Keep them exact.

## 4. Nothing loads before a click

- Until a click, the page is HTML, `style.css`, `channels.json`, thumbnails from `i.ytimg.com`
  (plain image requests), and the site's own channel art. No YouTube script, no iframe.
- The first click loads the YouTube IFrame API and creates one player on
  **`youtube-nocookie.com`**, joined at the computed offset (`start=`). On `ENDED` the player
  advances to the next video in that lineup from the top, so a channel keeps going.
- *Join live* recomputes the offset and rejoins; *From the top* restarts the current video;
  *Open on YouTube* is a plain link.

The footer says *No trackers*; this page keeps it true up to the moment the viewer chooses to
play, and says so in the note at the bottom. The Terms (`legal/terms/` §1.8) list the video host
among the service providers that see technical data.

## 5. The manifest

```json
{
  "epoch": "ISO 8601 with offset",
  "guide_window_min": 30,
  "guide_step_min": 5,
  "channels": [
    { "number": 1, "id": "live", "name": "Live Shows", "tagline": "…",
      "playlist": "YouTube playlist id", "art": "art/live.jpg",
      "lineup": ["videoId", "videoId"],
      "extra":  ["videoId"] }
  ],
  "videos": {
    "videoId": { "title": "…", "duration": "m:ss or h:mm:ss or seconds",
                 "location": "…", "year": "…", "desc": "…", "yt_title": "…" }
  }
}
```

The page plays `lineup` then `extra`, in order. A lineup id that is not in `videos` throws at load
and the page says so.

**Who writes it.** CAMT `jobs\youtube_lineup.py` (menu 36; channel #8 under AGENTS rule 8, owner
ruling 2026-09-04). `fetch` rewrites every channel's `lineup` from its YouTube playlist in playlist
order, takes exact durations from the API, adds new videos to `videos`, and leaves `extra` alone,
so a clip the owner wants on a channel without moving it into the playlist survives. `title` is
rewritten from YouTube only while it still equals `yt_title` (the last YouTube title seen); a title
he edited stays. `location`, `year` and a non-empty `desc` are never overwritten. The API key is a
Cloud-project credential in CAMT's DPAPI box; it is never in this repo or in page source. Offline,
the job says so and exits 2 and the page keeps serving whatever manifest it has. Until the key
exists, the manifest is maintained by hand exactly as before.

## 6. Decisions taken in this build, each reversible

- **Titles are YouTube's**, except one: the Atmosphere clip is titled *"Cadenza Sunrise"* on
  YouTube and shows here as *"Sunrise"*, because the bare word is ruled a factual error
  (`F:\README.md`). Owner to say whether the YouTube title itself should change.
- **Channel art reuses already-published images only:** this site's 0011 thumbnail for Fashion
  Shows, CadenzaFeed's 0006 (Culture Sessions) for Houston and 0012 (Bisong artists) for Live
  Shows, each resized to 1280 wide. Nothing was pulled from the archive that had not already
  passed the publication gate (CAS §9.13). Atmosphere has no art yet and falls back to its
  thumbnail.
- **The Vigil/canvass video** is on the channel but in no playlist, so it is not in any lineup.
  It shows under *Also on the channel*. His call whether it belongs on Houston.
- **"On now" is labeled *On now*, not *LIVE*.** The note under the page says plainly that
  nothing streams. The feeling is the point; the claim would be a lie.

## 7. Known gaps

| Gap | Detail |
|---|---|
| Short catalog | every loop is under eleven minutes, so the guide repeats fast. Long recordings fix this, not code |
| No per-day schedule | he described *"Aisha's Sunday class … weekly on Sundays"*. V1 is one loop per channel, all day. A day/hour grid over the loop is the next step and the manifest shape allows it |
| Manifest by hand until the key lands | `jobs\youtube_lineup.py fetch` writes it from the playlists once the YouTube Data API key is stored (`set-key`). Adding a video to a playlist on YouTube is then the whole workflow |
| Autoplay policy | browsers permit autoplay after a click; the first click is the user gesture, so the player starts. If a browser still refuses, the YouTube play button is right there |
| Atmosphere art | none; falls back to the clip thumbnail |

## Freeze criteria

FROZEN when all four are true:

- [ ] One lineup contains a recording longer than the guide column (≥ 5 min), and the guide has
      been checked against a wall clock on two devices.
- [ ] The owner has ruled on the Sunrise title and the Vigil placement.
- [ ] A day schedule exists or has been explicitly declined for V1.
- [x] The page has been ported to cadenzaarthouse.com -- built 2026-10-08 (`CadenzaFeed/media/`) on a branch; it is live when that branch is merged and pushed on the owner's word.
