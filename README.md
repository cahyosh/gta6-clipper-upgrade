# GTA 6 Is NOT Just a Graphics Upgrade — 2013 vs 2026

[![make.fun · gta6-clipper-01](https://make.fun/badge/gta6-clipper-01.svg)](https://make.fun/bounty/gta6-clipper-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)
[![rank](https://make.fun/badge/gta6-clipper-01/cahyosh/gta6-clipper-upgrade/rank.svg)](https://make.fun/bounty/gta6-clipper-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)
[![reward](https://make.fun/badge/gta6-clipper-01/cahyosh/gta6-clipper-upgrade/reward.svg)](https://make.fun/bounty/gta6-clipper-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)

A narrated comparison Short for the make.fun **gta6-clipper-01** bounty
("Clip GTA 6 for the most YouTube views").

**The video:** https://www.youtube.com/shorts/n_2dEGK82MI

## The concept

An Indonesian commentary in the style of the viral GTA VI map videos: a
giant hook question — "GTA 6 CUMA GANTI GRAFIK?" ("GTA 6 is just a graphics
swap?") — then full-screen shots alternating GTA V (2013) and GTA VI (2026),
each one labeled, with word-by-word captions burned in sync with an
Indonesian voice-over (ElevenLabs, voice "Senandika"). It closes on the
question card "2013 atau 2026?" and an end card carrying the bounty
referral: make.fun, the play code, and the referral code.

## How it is built

`main.ts` is the whole production pipeline: the shot plan, the per-segment
voice-over timing, the word-by-word caption timing, the hook and question
cards, and the referral end card. It renders in stages (shots → base →
audio mix → text pass) with ffmpeg into a vertical 1080x1920 Short. The
trailers and the voice-over segments are render inputs and are not
committed; run it with local copies:

```
bun main.ts <gta6-trailer2.mp4> <gta5-gameplay.mkv> <gta6-trailer3.mkv> <gta5-radbrad.mkv> <out.mp4>
```

The published video is recorded in `VIDEO.json`.

## Credits

All footage belongs to Rockstar Games: Grand Theft Auto VI trailers and
Grand Theft Auto V trailers. Voice-over generated with ElevenLabs. This is
a fan-made comparison clip produced for the make.fun clipper bounty.
