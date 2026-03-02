#!/usr/bin/env node
const fs = require('fs');

// --- Argument parsing ---
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help') {
  console.log(`Usage: node parse-vmd.js <vmd_path> [options]

Options:
  --mode <type>     summary|keyframes|angles|velocity|extensions (default: summary)
  --bones <list>    Comma-separated bone names (default: arm bones)
  --seconds <n>     Analyze first N seconds (default: 30)
  --all-bones       Show all bone names found in the VMD

Examples:
  node parse-vmd.js motion.vmd
  node parse-vmd.js motion.vmd --mode extensions --seconds 60
  node parse-vmd.js motion.vmd --mode angles --bones 左ひじ,右ひじ
  node parse-vmd.js motion.vmd --all-bones`);
  process.exit(0);
}

const vmdPath = args[0];
let mode = 'summary';
let bonesFilter = null;
let maxSeconds = 30;
let showAllBones = false;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--mode' && args[i + 1]) { mode = args[++i]; }
  else if (args[i] === '--bones' && args[i + 1]) { bonesFilter = args[++i].split(','); }
  else if (args[i] === '--seconds' && args[i + 1]) { maxSeconds = parseInt(args[++i]); }
  else if (args[i] === '--all-bones') { showAllBones = true; }
}

const DEFAULT_ARM_BONES = ['左腕', '右腕', '左ひじ', '右ひじ', '左手首', '右手首', '左中指１', '右中指１'];
const targetBones = bonesFilter || DEFAULT_ARM_BONES;

// --- VMD Parser ---
const buf = fs.readFileSync(vmdPath);
let offset = 0;

function readStr(len) {
  const raw = buf.subarray(offset, offset + len);
  offset += len;
  const end = raw.indexOf(0);
  return new TextDecoder('shift_jis').decode(raw.subarray(0, end >= 0 ? end : len));
}
function readU32() { const v = buf.readUInt32LE(offset); offset += 4; return v; }
function readF32() { const v = buf.readFloatLE(offset); offset += 4; return v; }

const magic = readStr(30);
const model = readStr(20);
const boneCount = readU32();

const allKeyframes = {};
const boneNameSet = new Set();

for (let i = 0; i < boneCount; i++) {
  const name = readStr(15);
  const frame = readU32();
  const px = readF32(), py = readF32(), pz = readF32();
  const qx = readF32(), qy = readF32(), qz = readF32(), qw = readF32();
  offset += 64; // interpolation

  boneNameSet.add(name);
  if (!allKeyframes[name]) allKeyframes[name] = [];
  allKeyframes[name].push({ frame, px, py, pz, qx, qy, qz, qw });
}

// Sort all
for (const name of Object.keys(allKeyframes)) {
  allKeyframes[name].sort((a, b) => a.frame - b.frame);
}

const FPS = 30;
const MAX_FRAME = maxSeconds * FPS;

// --- Utility functions ---
function quatAngle(qw) {
  return 2 * Math.acos(Math.min(1, Math.abs(qw))) * (180 / Math.PI);
}

function quatConj(q) {
  return { qw: q.qw, qx: -q.qx, qy: -q.qy, qz: -q.qz };
}

function quatMul(a, b) {
  return {
    qw: a.qw * b.qw - a.qx * b.qx - a.qy * b.qy - a.qz * b.qz,
    qx: a.qw * b.qx + a.qx * b.qw + a.qy * b.qz - a.qz * b.qy,
    qy: a.qw * b.qy - a.qx * b.qz + a.qy * b.qw + a.qz * b.qx,
    qz: a.qw * b.qz + a.qx * b.qy - a.qy * b.qx + a.qz * b.qw,
  };
}

function angularDelta(prev, curr) {
  const delta = quatMul(curr, quatConj(prev));
  return 2 * Math.acos(Math.min(1, Math.abs(delta.qw))) * (180 / Math.PI);
}

function slerp(a, b, t) {
  let dot = a.qx * b.qx + a.qy * b.qy + a.qz * b.qz + a.qw * b.qw;
  const flip = dot < 0;
  if (flip) { b = { qx: -b.qx, qy: -b.qy, qz: -b.qz, qw: -b.qw }; dot = -dot; }
  if (dot > 0.9995) {
    return {
      qx: a.qx + t * (b.qx - a.qx), qy: a.qy + t * (b.qy - a.qy),
      qz: a.qz + t * (b.qz - a.qz), qw: a.qw + t * (b.qw - a.qw),
    };
  }
  const theta = Math.acos(dot);
  const sinT = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sinT;
  const wb = Math.sin(t * theta) / sinT;
  return {
    qx: wa * a.qx + wb * b.qx, qy: wa * a.qy + wb * b.qy,
    qz: wa * a.qz + wb * b.qz, qw: wa * a.qw + wb * b.qw,
  };
}

function getQuatAtFrame(boneName, frame) {
  const kfs = allKeyframes[boneName];
  if (!kfs || kfs.length === 0) return { qx: 0, qy: 0, qz: 0, qw: 1 };
  if (frame <= kfs[0].frame) return kfs[0];
  if (frame >= kfs[kfs.length - 1].frame) return kfs[kfs.length - 1];
  for (let i = 0; i < kfs.length - 1; i++) {
    if (kfs[i].frame <= frame && kfs[i + 1].frame > frame) {
      const t = (frame - kfs[i].frame) / (kfs[i + 1].frame - kfs[i].frame);
      return slerp(kfs[i], kfs[i + 1], t);
    }
  }
  return kfs[kfs.length - 1];
}

function fmt(n, w) { return String(n).padStart(w); }
function fmtF(n, d, w) { return n.toFixed(d).padStart(w); }

// --- Output modes ---

if (showAllBones) {
  console.log(`Model: ${model} | Magic: ${magic}`);
  console.log(`Total bone keyframes: ${boneCount}`);
  console.log(`\nBone names found (${boneNameSet.size}):`);
  const sorted = [...boneNameSet].sort((a, b) => {
    const ac = (allKeyframes[a] || []).length;
    const bc = (allKeyframes[b] || []).length;
    return bc - ac;
  });
  for (const name of sorted) {
    const count = (allKeyframes[name] || []).length;
    const inRange = (allKeyframes[name] || []).filter(k => k.frame <= MAX_FRAME).length;
    console.log(`  ${name.padEnd(15)} ${fmt(count, 5)} total  ${fmt(inRange, 5)} in 0-${maxSeconds}s`);
  }
  process.exit(0);
}

console.log('='.repeat(70));
console.log(`VMD: ${vmdPath}`);
console.log(`Model: ${model} | Bones: ${boneCount} keyframes | Analyzing: 0-${maxSeconds}s`);
console.log('='.repeat(70));

if (mode === 'summary') {
  // Keyframe counts
  console.log('\nKeyframe counts:');
  for (const bone of targetBones) {
    const kfs = allKeyframes[bone] || [];
    const inRange = kfs.filter(k => k.frame <= MAX_FRAME).length;
    console.log(`  ${bone.padEnd(12)} ${fmt(inRange, 5)} in 0-${maxSeconds}s  (${fmt(kfs.length, 5)} total)`);
  }

  // Per-second angle summary for elbow bones
  const elbows = targetBones.filter(b => b.includes('ひじ'));
  if (elbows.length > 0) {
    console.log(`\nPer-second elbow angle (bar = 10°):`);
    console.log(`${'sec'.padStart(4)}  ${elbows.map(e => e.padEnd(16)).join('')}`);
    console.log('-'.repeat(4 + elbows.length * 16));
    for (let sec = 0; sec <= maxSeconds; sec++) {
      const f = sec * FPS;
      let line = fmt(sec, 3) + 's';
      for (const bone of elbows) {
        const q = getQuatAtFrame(bone, f);
        const angle = quatAngle(q.qw);
        const bar = '\u2588'.repeat(Math.round(angle / 10));
        line += `  ${fmtF(angle, 0, 4)}\u00b0 ${bar.padEnd(10)}`;
      }
      console.log(line);
    }
  }
}

if (mode === 'keyframes') {
  for (const bone of targetBones) {
    const kfs = (allKeyframes[bone] || []).filter(k => k.frame <= MAX_FRAME);
    console.log(`\n--- ${bone} (${kfs.length} keyframes) ---`);
    console.log('frame   time    angle   qx      qy      qz      qw      px      py      pz');
    for (const kf of kfs) {
      const angle = quatAngle(kf.qw);
      console.log(
        `${fmt(kf.frame, 5)}  ${fmtF(kf.frame / FPS, 1, 6)}s  ${fmtF(angle, 0, 4)}\u00b0` +
        `  ${fmtF(kf.qx, 3, 7)} ${fmtF(kf.qy, 3, 7)} ${fmtF(kf.qz, 3, 7)} ${fmtF(kf.qw, 3, 7)}` +
        `  ${fmtF(kf.px, 2, 7)} ${fmtF(kf.py, 2, 7)} ${fmtF(kf.pz, 2, 7)}`
      );
    }
  }
}

if (mode === 'angles') {
  for (const bone of targetBones) {
    console.log(`\n--- ${bone} (interpolated per frame) ---`);
    console.log('frame   time   angle  delta  | bar');
    let prev = getQuatAtFrame(bone, 0);
    for (let f = 0; f <= MAX_FRAME; f++) {
      const q = getQuatAtFrame(bone, f);
      const angle = quatAngle(q.qw);
      const delta = angularDelta(prev, q);
      if (f % 3 === 0) {
        const bar = '\u2588'.repeat(Math.round(angle / 3));
        console.log(`${fmt(f, 5)}  ${fmtF(f / FPS, 1, 5)}s  ${fmtF(angle, 0, 4)}\u00b0  ${fmtF(delta, 1, 5)}  | ${bar}`);
      }
      prev = q;
    }
  }
}

if (mode === 'velocity') {
  for (const bone of targetBones) {
    console.log(`\n--- ${bone}: angular velocity spikes ---`);
    console.log('frame   time   speed  prev   decel  angle');

    let prev = getQuatAtFrame(bone, 0);
    let prevDelta = 0;
    for (let f = 1; f <= MAX_FRAME; f++) {
      const q = getQuatAtFrame(bone, f);
      const delta = angularDelta(prev, q);
      const decel = prevDelta - delta;
      const angle = quatAngle(q.qw);

      if (Math.abs(decel) > 5) {
        console.log(
          `${fmt(f, 5)}  ${fmtF(f / FPS, 1, 5)}s  ${fmtF(delta, 1, 5)}  ${fmtF(prevDelta, 1, 5)}  ${fmtF(decel, 1, 5)}  ${fmtF(angle, 0, 4)}\u00b0`
        );
      }

      prev = q;
      prevDelta = delta;
    }
  }
}

if (mode === 'extensions') {
  for (const side of ['\u5de6', '\u53f3']) {
    const elbowName = side + '\u3072\u3058';
    const upperName = side + '\u8155';

    console.log(`\n--- ${side === '\u5de6' ? 'Left' : 'Right'} Arm ---`);

    let peakAngle = 0;
    let peakFrame = 0;
    let extending = false;

    for (let f = 0; f <= MAX_FRAME; f++) {
      const q = getQuatAtFrame(elbowName, f);
      const angle = quatAngle(q.qw);

      if (angle > peakAngle) {
        peakAngle = angle;
        peakFrame = f;
      }

      if (angle > 30) extending = true;
      if (extending && angle < 15) {
        const t = fmtF(f / FPS, 1, 5);
        const pt = fmtF(peakFrame / FPS, 1, 5);
        console.log(
          `  f${fmt(f, 4)} (${t}s) extended \u2014 peak ${fmtF(peakAngle, 0, 4)}\u00b0 at f${fmt(peakFrame, 4)} (${pt}s)` +
          `  gap=${fmtF((f - peakFrame) / FPS, 1, 4)}s`
        );
        extending = false;
        peakAngle = 0;
      }
    }
  }
}
