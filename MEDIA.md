# Media — the "live TV" wrapper over YouTube-hosted video

**Status: DRAFT (2026-09-04), version 1 built and live at `/media/`; split across two sites on
2026-10-08 (§0); on 2026-10-09 the manifest's author became CAMT's Channel Manager (§5) and the page
dropped the site masthead for a bar and footer of its own (§2, §6).** Freeze criteria at the bottom. This file is the contract for the engine on **both** sites.

## 0. Two sites since 2026-10-08

The owner's ask, in his words: *"move the non-fashion related things to the Cadenza [Arthouse]
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
| the page | `media/index.html` | stage (poster → player), view tabs, guide, browse, app, the honesty note; and, since 2026-10-09, its own slim bar, Menu panel and footer: **it has no site masthead** |
| the page's own chrome | `media/chrome.css`, `media/chrome.js` | the bar (Back to Model Auctions, the brand, Menu), the Menu panel that holds the site's navigation, the footer, and the bar's slide-away on scroll. Loaded by this page only; `chrome.js` is the same file as on cadenzaarthouse.com |
| the engine | `media/media.js` | schedule math, guide and browse rendering, click-to-load player |
| the lineup | `media/channels.json` | channels, their order, each video's id, title, duration |
| channel art | `media/art/*.jpg` | one image per channel for the browse hero cards |
| styles | `style.css` § MEDIA PAGE | shared stylesheet, same as every other page |

**Channels are lineups the owner keeps in CAMT's Channel Manager** (§5), in his order, with his names:
Live Shows, Fashion Shows, Houston, Atmosphere. They began as his YouTube playlists, and a channel's
playlist id is kept only as a reference. (Since 2026-10-08 this site carries Fashion Shows only; the
other three are on cadenzaarthouse.com, §0.) A video may appear in more than one lineup. Videos on the
channel but in no lineup show under *Also on the channel* in browse and play as a one-item channel.

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

**Who writes it.** Since 2026-10-09 (CAMT `ADR/ADR-0020`) **CAMT's Channel Manager is the only author
of this file, on both sites** (run.bat 40, `jobs\channels.py`; its contract is CAMT's
`CHANNEL_MANAGER.md`). Do not hand-edit the manifest and do not push a change to it from a shared
checkout. The manager keeps its own model of each lineup, emits this file from it, and publishes from
its own clean clone: it checks every video, shows a diff, asks the owner to type a phrase, pushes,
waits for the deploy, and then fetches the **live** file and compares it with what was intended. A
manifest changed outside CAMT is surfaced as drift and refused until the owner adopts it.

The format is fixed, because the manager re-emits the file byte for byte:
`json.dumps(indent=2, ensure_ascii=False)`, LF line endings, no trailing newline. A channel's
`playlist` id is **reference only**: a YouTube playlist no longer drives a lineup (the public feeds
already disagreed with what was live), and CAMT's `youtube_lineup.py fetch` is import-only, so it
proposes additions into the manager's draft and never rewrites, removes, reorders or commits. A
channel with **no videos breaks this page** (the engine divides the clock by the loop length and then
reads the first video), so the manager refuses to publish one. The YouTube API key is **optional**:
without it, titles come from YouTube's public lookup and exact lengths from the player in the
owner's own browser. A key, if one is stored, is a Cloud-project credential in CAMT's DPAPI box and is
never in this repo or in page source.

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
- **The page has no masthead (2026-10-09, owner's ask).** A site masthead above a streaming screen reads as two
  different products, so `/media/` has a slim dark bar of its own (Back to Model Auctions, the brand, and a Menu
  holding the site's navigation, where Media and Streaming move their *You are here* marker with the view) and its
  own footer. The footer is written without the sitewide "No trackers" line: Cloudflare adds its own scripts to every
  page it serves, so that claim is not safe to repeat in new copy. The engine (`media.js`) is untouched. Do not
  restore the masthead here; the same change was made on cadenzaarthouse.com.

## 7. Known gaps

| Gap | Detail |
|---|---|
| Short catalog | every loop is under eleven minutes, so the guide repeats fast. Long recordings fix this, not code |
| No per-day schedule | he described *"Aisha's Sunday class … weekly on Sundays"*. V1 is one loop per channel, all day. A day/hour grid over the loop is the next step and the manifest shape allows it |
| Lineup health is checked on demand | the Channel Manager's health check (`jobs\channels.py check [--notify]`, or `H` in menu 40) says when a video goes private, disappears or changes length. It is not scheduled yet: that waits on the owner's word. Adding or removing a video is the manager's `A` and `R`, then Publish |
| Autoplay policy | browsers permit autoplay after a click; the first click is the user gesture, so the player starts. If a browser still refuses, the YouTube play button is right there |
| Atmosphere art | none; falls back to the clip thumbnail |

## Freeze criteria

FROZEN when all four are true:

- [ ] One lineup contains a recording longer than the guide column (≥ 5 min), and the guide has
      been checked against a wall clock on two devices.
- [ ] The owner has ruled on the Sunrise title and the Vigil placement.
- [ ] A day schedule exists or has been explicitly declined for V1.
- [x] The page has been ported to cadenzaarthouse.com -- built 2026-10-08 (`CadenzaFeed/media/`) and published the same day on the owner's word; live at https://cadenzaarthouse.com/media/.
