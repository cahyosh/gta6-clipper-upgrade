#!/usr/bin/env bun
// GTA 6 clipper v7 — staged build (memory-safe): shots -> base -> audio mix -> text pass.
// Indonesian voice-over (ElevenLabs, voice Senandika) lives in vo/ as per-segment files
// (render inputs, not committed — like the trailer sources).
// Usage: bun main.ts <trailer2> <gta5trailer> <trailer3> <radbrad> <out.mp4>
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const SRC = process.argv.slice(2, 6);
const OUT = process.argv[6];
const DIR = new URL("./", import.meta.url).pathname;
const VO_DIR = DIR + "vo/";
const FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf";
const GAP = 0.12;

const SEG_TEXT = [
  "Kata orang, GTA enam cuma GTA lima ganti grafik.",
  "Yakin? Nih, bandingkan sendiri.",
  "Jalan yang sama. Tiga belas tahun berbeda.",
  "Di GTA lima, kota terasa sepi. Di GTA enam, semua bergerak.",
  "Kejar-kejaran di lima itu lurus-lurus saja. Di enam? Kacau total.",
  "Air, langit, lampu kota. Semuanya naik kelas.",
  "Ini bukan sekadar ganti grafik. Ini generasi baru.",
  "Sekarang jujur. Kamu tim dua ribu tiga belas, atau dua ribu dua enam? Tulis di komentar.",
];
const SEG_DUR = [4.04, 2.67, 3.66, 5.27, 4.96, 4.39, 3.98, 5.72, 3.5];
const segStart = [];
{ let t = 0; for (const d of SEG_DUR) { segStart.push(t); t += d + GAP; } }
const TOTAL = segStart[SEG_DUR.length - 1] + SEG_DUR[SEG_DUR.length - 1];

const VI = "GTA VI • 2026", V = "GTA V • 2013";
const SHOTS = [
  [0, 11.0, segStart[0], SEG_DUR[0], null],
  [2, 72.0, segStart[1], SEG_DUR[1], VI],
  [0, 142.0, segStart[2], SEG_DUR[2] / 2, VI],
  [3, 300.0, segStart[2] + SEG_DUR[2] / 2, SEG_DUR[2] / 2, V],
  [1, 20.0, segStart[3], SEG_DUR[3] / 2, V],
  [2, 18.0, segStart[3] + SEG_DUR[3] / 2, SEG_DUR[3] / 2, VI],
  [1, 55.0, segStart[4], SEG_DUR[4] / 2, V],
  [0, 128.0, segStart[4] + SEG_DUR[4] / 2, SEG_DUR[4] / 2, VI],
  [0, 146.0, segStart[5], SEG_DUR[5] / 2, VI],
  [0, 30.0, segStart[5] + SEG_DUR[5] / 2, SEG_DUR[5] / 2, VI],
  [0, 160.0, segStart[6], SEG_DUR[6], VI],
  [0, 11.0, segStart[7], SEG_DUR[7], null],
  [0, 11.0, segStart[8], SEG_DUR[8], null],
];

function run(args) {
  const r = spawnSync("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
  if (r.status !== 0) { console.error("FFMPEG FAIL:", args.slice(0, 4).join(" "), r.stderr.toString().slice(-600)); process.exit(1); }
}

// 1) shots
SHOTS.forEach(([inp, ss, , dur], i) => {
  run(["-y", "-ss", String(ss), "-i", SRC[inp], "-t", dur.toFixed(3),
    "-vf", "fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1",
    "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", `${DIR}shot${i}.mp4`]);
  console.log("shot", i, "ok");
});
// 2) base concat (copy)
writeFileSync(DIR + "shots.txt", SHOTS.map((_, i) => `file '${DIR}shot${i}.mp4'`).join("\n"));
run(["-y", "-f", "concat", "-safe", "0", "-i", DIR + "shots.txt", "-c", "copy", DIR + "base.mp4"]);
console.log("base ok, total", TOTAL.toFixed(2));
// 3) audio: silence + VO concat -> vo.wav ; bed -> bed.wav ; mix
run(["-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", String(GAP), DIR + "gap.wav"]);
{ let list = "";
  SEG_DUR.forEach((_, i) => { list += `file '${VO_DIR}s${i + 1}.mp3'\n`; if (i < SEG_DUR.length - 1) list += `file '${DIR}gap.wav'\n`; });
  writeFileSync(DIR + "vo.txt", list); }
run(["-y", "-f", "concat", "-safe", "0", "-i", DIR + "vo.txt", "-c:a", "pcm_s16le", DIR + "vo.wav"]);
run(["-y", "-ss", "11", "-i", SRC[0], "-t", TOTAL.toFixed(2), "-vn", "-af", "volume=0.10", "-c:a", "pcm_s16le", DIR + "bed.wav"]);
run(["-y", "-i", DIR + "vo.wav", "-i", DIR + "bed.wav", "-filter_complex", "[0:a][1:a]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]", "-map", "[a]", "-c:a", "aac", "-b:a", "160k", DIR + "mix.m4a"]);
console.log("audio ok");
// 4) text pass
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "’");
const dt = [];
SHOTS.forEach(([, , gs, dur, label]) => {
  if (!label) return;
  const color = label.startsWith("GTA VI") ? "FF2975" : "3DDC84";
  dt.push(`drawtext=fontfile=${FONT}:text='${esc(label)}':fontcolor=white:fontsize=42:borderw=3:bordercolor=black:box=1:boxcolor=0x${color}@0.85:boxborderw=14:x=36:y=40:enable='between(t,${gs.toFixed(2)},${(gs + dur).toFixed(2)})'`);
});
const h1e = segStart[0] + SEG_DUR[0];
dt.push(`drawtext=fontfile=${FONT}:text='GTA 6 CUMA':fontcolor=0xFFD60A:fontsize=150:borderw=10:bordercolor=black:x=(w-text_w)/2:y=110:enable='between(t,0,${h1e.toFixed(2)})'`);
dt.push(`drawtext=fontfile=${FONT}:text='GANTI GRAFIK?':fontcolor=black:fontsize=138:box=1:boxcolor=white:boxborderw=16:x=(w-text_w)/2:y=290:enable='between(t,0,${h1e.toFixed(2)})'`);
const q8s = segStart[7];
const q8e = segStart[8];
dt.push(`drawtext=fontfile=${FONT}:text='2013':fontcolor=0x3DDC84:fontsize=190:borderw=12:bordercolor=black:x=(w-text_w)/2:y=620:enable='between(t,${q8s.toFixed(2)},${q8e.toFixed(2)})'`);
dt.push(`drawtext=fontfile=${FONT}:text='atau':fontcolor=white:fontsize=90:borderw=8:bordercolor=black:x=(w-text_w)/2:y=850:enable='between(t,${q8s.toFixed(2)},${q8e.toFixed(2)})'`);
dt.push(`drawtext=fontfile=${FONT}:text='2026?':fontcolor=0xFF2975:fontsize=190:borderw=12:bordercolor=black:x=(w-text_w)/2:y=970:enable='between(t,${q8s.toFixed(2)},${q8e.toFixed(2)})'`);
// end card: referral bounty text (make.fun job terms)
const ecS = segStart[8];
dt.push(`drawbox=x=0:y=0:w=iw:h=ih:color=black@0.78:t=fill:enable='between(t,${ecS.toFixed(2)},${TOTAL.toFixed(2)})'`);
dt.push(`drawtext=fontfile=${FONT}:text='$500 BOUNTY':fontcolor=0xFFD60A:fontsize=130:borderw=9:bordercolor=black:x=(w-text_w)/2:y=500:enable='between(t,${ecS.toFixed(2)},${TOTAL.toFixed(2)})'`);
dt.push(`drawtext=fontfile=${FONT}:text='make.fun':fontcolor=white:fontsize=120:borderw=9:bordercolor=black:x=(w-text_w)/2:y=690:enable='between(t,${ecS.toFixed(2)},${TOTAL.toFixed(2)})'`);
dt.push(`drawtext=fontfile=${FONT}:text='Play code':fontcolor=white:fontsize=58:borderw=6:bordercolor=black:x=(w-text_w)/2:y=905:enable='between(t,${ecS.toFixed(2)},${TOTAL.toFixed(2)})'`);
dt.push(`drawtext=fontfile=${FONT}:text='makefun-board-timber-river':fontcolor=white:fontsize=58:borderw=6:bordercolor=black:x=(w-text_w)/2:y=985:enable='between(t,${ecS.toFixed(2)},${TOTAL.toFixed(2)})'`);
dt.push(`drawtext=fontfile=${FONT}:text='${esc("Referral: p9gwvddx")}':fontcolor=0xFFD60A:fontsize=66:borderw=7:bordercolor=black:x=(w-text_w)/2:y=1120:enable='between(t,${ecS.toFixed(2)},${TOTAL.toFixed(2)})'`);
SEG_TEXT.forEach((text, si) => {
  const words = text.split(/\s+/).filter(Boolean);
  const totalChars = words.reduce((a, w) => a + w.length + 1, 0);
  let acc = 0;
  for (const w of words) {
    const wStart = segStart[si] + (acc / totalChars) * SEG_DUR[si];
    acc += w.length + 1;
    const wEnd = segStart[si] + (acc / totalChars) * SEG_DUR[si];
    const disp = w.replace(/[.,?!]/g, "").toUpperCase();
    if (!disp) continue;
    dt.push(`drawtext=fontfile=${FONT}:text='${esc(disp)}':fontcolor=white:fontsize=118:borderw=9:bordercolor=black:x=(w-text_w)/2:y=1470:enable='between(t,${wStart.toFixed(2)},${wEnd.toFixed(2)})'`);
  }
});
run(["-y", "-i", DIR + "base.mp4", "-i", DIR + "mix.m4a",
  "-vf", dt.join(","), "-map", "0:v", "-map", "1:a",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
  "-c:a", "copy", "-movflags", "+faststart", "-t", TOTAL.toFixed(2), OUT]);
console.log("DONE", OUT);
