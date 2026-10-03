# Content & copyright guide

*Practical guidance, not legal advice. Before a commercial launch, have a lawyer review this.*

## The short version

| Do | Don't |
|---|---|
| **Embed** pitch clips from official YouTube channels (Shark Tank Global, Sony Pictures Television, CNBC) with the standard YouTube player | Download, re-upload or self-host Shark Tank footage |
| Use **fictional** sharks with original names, avatars and lines | Use real sharks' names, photos, voices or catchphrases as characters |
| Name the game something original ("Tank Day") | Use "Shark Tank" in the product name, logo or domain |
| Write your own short summaries of facts and outcomes, with linked sources | Copy articles or transcripts wholesale |
| Credit the source channel under every clip, plus a "not affiliated" footer | Imply endorsement by ABC, Sony or any shark |

## Why embeds and not downloads

Shark Tank episodes are owned by Sony Pictures Television / ABC. Downloading clips from YouTube breaks YouTube's Terms of Service, and re-hosting them publicly is copyright infringement. That's true whether or not anyone emails you about it. A takedown would also break the game.

**Embedding** is different. When a rights holder uploads to YouTube with embedding enabled, YouTube's Terms let anyone show that video through YouTube's own player. The views count for the owner and their ads still run, and the owner can switch embedding off at any time. This is the legitimate way to show these clips publicly, and it's what Tank Day does: every pitch uses `"video": {"type": "youtube", ...}` pointing at an **official** upload.

Checklist when adding a YouTube clip:

1. The uploader is an official channel. Check with `curl "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json"`: `author_name` should be e.g. *Shark Tank Global* or *Sony Pictures Television*.
2. Embedding is allowed: that same oEmbed call returns HTTP 200, not 401.
3. Use `start` / `end` to stop before the deal. Use the YouTube player's own parameters only; don't strip ads or branding.
4. Fill in `source.channel` and `source.url`. The UI credits them under the player.

If an owner disables embedding, the pitch stops playing. `make validate` won't catch that, so re-check the clips occasionally.

## Long-term: own your content

To grow beyond what's on YouTube, or to monetise, move toward content you control:

- **YC Demo Day and accelerator pitches.** Many are published by the accelerator, but check each license.
- **Founder-submitted pitches.** Ask founders for a 2–3 minute video plus a simple release that grants you a license. This is the most scalable option.
- **Licensing.** Sony Pictures Television licenses Shark Tank clips commercially; contact their licensing team if the game takes off.
- **Original re-enactments / animated pitches** written from public facts.

Self-hosted clips use `"video": {"type": "file", "path": "clip.mp4"}` (see `scripts/trim_clip.sh`). Only use this for content you have rights to.

## Facts and outcomes

Facts and figures aren't copyrightable, but the words used to express them are. Write `facts`, `story` and `headline` in your own words, keep them short, and always list `sources`. Mark private-company valuations as `"value_basis": "estimate"`. The UI labels these as estimates and shows the `as_of` date.

## Clip-spoiler note

YouTube shows the video title on hover in the embedded player, and some official titles hint at the result (e.g. "A Bidding War Breaks Out…"). Prefer neutral clip titles when you have a choice.
