#!/usr/bin/env node
const fs = require('fs');

// --- Argument parsing ---
const args = process.argv.slice(2);
if (args.length < 2 || args[0] === '--help') {
  console.log(`Usage: node validate-vmd-pmx.js <vmd_path> <pmx_path>

Validates VMD↔PMX compatibility and produces a compatibility report.`);
  process.exit(args[0] === '--help' ? 0 : 1);
}

const vmdPath = args[0];
const pmxPath = args[1];

if (!fs.existsSync(vmdPath)) { console.error(`VMD not found: ${vmdPath}`); process.exit(1); }
if (!fs.existsSync(pmxPath)) { console.error(`PMX not found: ${pmxPath}`); process.exit(1); }

// --- VMD Parser ---
const vmdBuf = fs.readFileSync(vmdPath);
let vmdOff = 0;

function vmdStr(len) {
  const raw = vmdBuf.subarray(vmdOff, vmdOff + len);
  vmdOff += len;
  const end = raw.indexOf(0);
  return new TextDecoder('shift_jis').decode(raw.subarray(0, end >= 0 ? end : len));
}
function vmdU32() { const v = vmdBuf.readUInt32LE(vmdOff); vmdOff += 4; return v; }
function vmdF32() { const v = vmdBuf.readFloatLE(vmdOff); vmdOff += 4; return v; }

const vmdMagic = vmdStr(30);
const vmdModel = vmdStr(20);
const vmdBoneCount = vmdU32();

const vmdBoneNames = new Set();
const vmdBoneKeyframes = {};

for (let i = 0; i < vmdBoneCount; i++) {
  const name = vmdStr(15);
  const frame = vmdU32();
  const px = vmdF32(), py = vmdF32(), pz = vmdF32();
  const qx = vmdF32(), qy = vmdF32(), qz = vmdF32(), qw = vmdF32();
  vmdOff += 64; // interpolation

  vmdBoneNames.add(name);
  if (!vmdBoneKeyframes[name]) vmdBoneKeyframes[name] = [];
  vmdBoneKeyframes[name].push({ frame, qx, qy, qz, qw });
}

// Sort keyframes
for (const name of Object.keys(vmdBoneKeyframes)) {
  vmdBoneKeyframes[name].sort((a, b) => a.frame - b.frame);
}

// --- PMX Parser (bones + IK only) ---
const pmxBuf = fs.readFileSync(pmxPath);
let pmxOff = 0;

function pmxU8() { return pmxBuf[pmxOff++]; }
function pmxU32() { const v = pmxBuf.readUInt32LE(pmxOff); pmxOff += 4; return v; }
function pmxI32() { const v = pmxBuf.readInt32LE(pmxOff); pmxOff += 4; return v; }
function pmxF32() { const v = pmxBuf.readFloatLE(pmxOff); pmxOff += 4; return v; }
function pmxIdx(size) {
  if (size === 1) { const v = pmxBuf.readInt8(pmxOff); pmxOff += 1; return v; }
  if (size === 2) { const v = pmxBuf.readInt16LE(pmxOff); pmxOff += 2; return v; }
  const v = pmxBuf.readInt32LE(pmxOff); pmxOff += 4; return v;
}

function pmxText(encoding) {
  const len = pmxU32();
  if (len === 0) return '';
  const raw = pmxBuf.subarray(pmxOff, pmxOff + len);
  pmxOff += len;
  if (encoding === 0) {
    // UTF-16LE
    const chars = [];
    for (let i = 0; i < raw.length; i += 2) {
      chars.push(String.fromCharCode(raw[i] | (raw[i + 1] << 8)));
    }
    return chars.join('');
  }
  return new TextDecoder('utf-8').decode(raw);
}

// Header
const pmxMagic = pmxBuf.subarray(0, 4).toString('ascii');
pmxOff = 4;
const pmxVersion = pmxBuf.readFloatLE(pmxOff); pmxOff += 4;
const globalsCount = pmxU8();
const globals = [];
for (let i = 0; i < globalsCount; i++) globals.push(pmxU8());

const encoding = globals[0]; // 0=UTF-16LE, 1=UTF-8
const addUVCount = globals[1];
const vertIdxSize = globals[2];
const texIdxSize = globals[3];
const matIdxSize = globals[4];
const boneIdxSize = globals[5];
const morphIdxSize = globals[6];
const rigidIdxSize = globals[7];

// Model info
const pmxNameJP = pmxText(encoding);
const pmxNameEN = pmxText(encoding);
const pmxCommentJP = pmxText(encoding);
const pmxCommentEN = pmxText(encoding);

// Skip vertices
const vertCount = pmxI32();
for (let i = 0; i < vertCount; i++) {
  pmxOff += 12 + 12 + 8; // pos + normal + uv
  pmxOff += addUVCount * 16; // additional UVs
  const weightType = pmxU8();
  if (weightType === 0) { pmxOff += boneIdxSize; }
  else if (weightType === 1) { pmxOff += boneIdxSize * 2 + 4; }
  else if (weightType === 2) { pmxOff += boneIdxSize * 4 + 16; }
  else if (weightType === 3) { pmxOff += boneIdxSize * 2 + 4 + 12 * 3; }
  else if (weightType === 4) { pmxOff += boneIdxSize * 4 + 16; }
  pmxOff += 4; // edge scale
}

// Skip faces
const faceCount = pmxI32();
pmxOff += faceCount * vertIdxSize;

// Skip textures
const texCount = pmxI32();
for (let i = 0; i < texCount; i++) pmxText(encoding);

// Skip materials
const matCount = pmxI32();
for (let i = 0; i < matCount; i++) {
  pmxText(encoding); pmxText(encoding); // names
  pmxOff += 16 + 12 + 4 + 12 + 4; // diffuse + specular + specCoeff + ambient + drawFlags
  pmxOff += 16 + 4; // edgeColor + edgeSize
  pmxOff += texIdxSize * 3; // texture + sphere + toon
  pmxU8(); // sphereMode
  const toonFlag = pmxU8();
  if (toonFlag === 0) pmxOff += texIdxSize; else pmxOff += 1;
  pmxText(encoding); // memo
  pmxOff += 4; // faceCount
}

// Parse bones
const boneCount = pmxI32();
const pmxBones = [];
const pmxBoneNames = new Set();
const pmxIKBones = [];

for (let i = 0; i < boneCount; i++) {
  const nameJP = pmxText(encoding);
  const nameEN = pmxText(encoding);
  pmxOff += 12; // position
  const parentIdx = pmxIdx(boneIdxSize);
  pmxOff += 4; // layer
  const flags = pmxBuf.readUInt16LE(pmxOff); pmxOff += 2;

  pmxBoneNames.add(nameJP);
  pmxBones.push({ name: nameJP, nameEN, flags, index: i });

  // Connection
  if (flags & 0x0001) { pmxOff += boneIdxSize; } else { pmxOff += 12; }
  // Rotation/Translation grant
  if (flags & 0x0100 || flags & 0x0200) { pmxOff += boneIdxSize + 4; }
  // Fixed axis
  if (flags & 0x0400) { pmxOff += 12; }
  // Local axis
  if (flags & 0x0800) { pmxOff += 24; }
  // External parent
  if (flags & 0x2000) { pmxOff += 4; }
  // IK
  if (flags & 0x0020) {
    const ikTarget = pmxIdx(boneIdxSize);
    const ikLoop = pmxI32();
    const ikAngle = pmxF32();
    const ikLinkCount = pmxI32();

    pmxIKBones.push({ name: nameJP, target: ikTarget, linkCount: ikLinkCount });

    for (let j = 0; j < ikLinkCount; j++) {
      pmxIdx(boneIdxSize);
      const hasLimit = pmxU8();
      if (hasLimit) pmxOff += 24; // min + max
    }
  }
}

// --- Analysis ---
const report = {
  vmdModel,
  pmxModel: pmxNameJP,
  checks: {},
  score: 100,
};

// 1. Bone match
const matched = [];
const vmdOnly = [];
const pmxOnly = [];

const IGNORABLE_PREFIXES = ['スカート', 'j_f_', 'j_ago', 'n_sippo', 'Glasses', '新規ボーン'];
const IGNORABLE_SUFFIXES = ['指先'];
function isIgnorable(name) {
  for (const p of IGNORABLE_PREFIXES) { if (name.startsWith(p)) return true; }
  for (const s of IGNORABLE_SUFFIXES) { if (name.endsWith(s)) return true; }
  return false;
}

for (const bone of vmdBoneNames) {
  if (pmxBoneNames.has(bone)) matched.push(bone);
  else if (!isIgnorable(bone)) vmdOnly.push(bone);
}

const matchRate = vmdBoneNames.size > 0 ? matched.length / vmdBoneNames.size * 100 : 0;
report.checks.boneMatch = {
  matched: matched.length,
  total: vmdBoneNames.size,
  rate: matchRate.toFixed(1) + '%',
  missing: vmdOnly,
};
if (matchRate < 80) report.score -= 20;
else if (matchRate < 90) report.score -= 10;

// 2. IK compatibility
const ikTargetNames = pmxIKBones.map(ik => pmxBones[ik.target]?.name).filter(Boolean);
const ikBoneInVmd = ikTargetNames.some(n => vmdBoneNames.has(n));
const fkBoneNames = ['左足', '右足', '左ひざ', '右ひざ'];
const fkInVmd = fkBoneNames.some(n => vmdBoneNames.has(n));
const ikNamesInVmd = ['左足ＩＫ', '右足ＩＫ'].filter(n => vmdBoneNames.has(n));

report.checks.ikCompat = {
  pmxHasIK: pmxIKBones.length > 0,
  vmdHasIKTracks: ikNamesInVmd.length > 0,
  vmdHasFK: fkInVmd,
  conflict: fkInVmd && pmxIKBones.length > 0 && ikNamesInVmd.length === 0,
};
if (report.checks.ikCompat.conflict) report.score -= 5;

// 3. Source model detection
const DUMMY_BONES = ['左ダミー', '右ダミー'];
const hasDummy = DUMMY_BONES.some(n => vmdBoneNames.has(n));
const dummyInPmx = DUMMY_BONES.some(n => pmxBoneNames.has(n));
const dummyDropped = hasDummy && !dummyInPmx;

let sourceModel = null;
if (hasDummy) sourceModel = 'ミリシタ (Million Live)';

report.checks.sourceDetect = {
  detected: sourceModel,
  markers: hasDummy ? DUMMY_BONES.filter(n => vmdBoneNames.has(n)) : [],
  droppedMarkers: dummyDropped,
};
if (dummyDropped) report.score -= 5;

// 4. Twist bone coverage
const TWIST_BONES = ['左腕捩', '右腕捩', '左手捩', '右手捩'];
const twistInVmd = TWIST_BONES.filter(n => vmdBoneNames.has(n));
const twistInPmx = TWIST_BONES.filter(n => pmxBoneNames.has(n));

report.checks.twistCoverage = {
  vmd: twistInVmd,
  pmx: twistInPmx,
  animated: twistInVmd.length > 0,
  modelHas: twistInPmx.length > 0,
};

// 5. Dummy bone status
const dummyStatus = [];
for (const d of DUMMY_BONES) {
  if (vmdBoneNames.has(d)) {
    const kfCount = (vmdBoneKeyframes[d] || []).length;
    dummyStatus.push({ name: d, keyframes: kfCount, inPmx: pmxBoneNames.has(d) });
  }
}
report.checks.dummyStatus = dummyStatus;

// 6. Quaternion quality (arm bones)
function quatAngle(qw) {
  return 2 * Math.acos(Math.min(1, Math.abs(qw))) * (180 / Math.PI);
}
function quatDot(a, b) {
  return a.qx * b.qx + a.qy * b.qy + a.qz * b.qz + a.qw * b.qw;
}

const ARM_BONES = ['左腕', '右腕', '左ひじ', '右ひじ'];
const quatReport = {};

for (const bone of ARM_BONES) {
  const kfs = vmdBoneKeyframes[bone];
  if (!kfs || kfs.length === 0) continue;

  let flipCount = 0;
  let maxAngle = 0;
  let maxAngleFrame = 0;

  for (let i = 0; i < kfs.length; i++) {
    const angle = quatAngle(kfs[i].qw);
    if (angle > maxAngle) { maxAngle = angle; maxAngleFrame = kfs[i].frame; }
    if (i > 0 && quatDot(kfs[i - 1], kfs[i]) < 0) flipCount++;
  }

  quatReport[bone] = {
    keyframes: kfs.length,
    hemisphereFlips: flipCount,
    peakAngle: maxAngle.toFixed(1) + '°',
    peakFrame: maxAngleFrame,
  };
}
report.checks.quatQuality = quatReport;

// 7. Arm extremes
const armExtremes = {};
for (const bone of ['左腕', '右腕']) {
  const kfs = vmdBoneKeyframes[bone];
  if (!kfs) continue;
  for (const kf of kfs) {
    const angle = quatAngle(kf.qw);
    if (angle > 120) {
      if (!armExtremes[bone]) armExtremes[bone] = [];
      armExtremes[bone].push({ frame: kf.frame, angle: angle.toFixed(1) + '°' });
    }
  }
}
report.checks.armExtremes = armExtremes;
if (Object.keys(armExtremes).length > 0) report.score -= 10;

// Clamp score
report.score = Math.max(0, report.score);

// --- Output ---
console.log('='.repeat(70));
console.log('VMD ↔ PMX COMPATIBILITY REPORT');
console.log('='.repeat(70));
console.log(`VMD model: ${vmdModel}`);
console.log(`PMX model: ${pmxNameJP}`);
console.log(`VMD bones: ${vmdBoneNames.size}  |  PMX bones: ${boneCount}`);
console.log();

// Bone match
const bm = report.checks.boneMatch;
console.log(`[Bone Match] ${bm.matched}/${bm.total} (${bm.rate})`);
if (bm.missing.length) {
  console.log(`  Missing in PMX: ${bm.missing.join(', ')}`);
}

// IK compat
const ik = report.checks.ikCompat;
console.log(`\n[IK Compat] PMX IK: ${ik.pmxHasIK ? 'yes' : 'no'} | VMD IK tracks: ${ik.vmdHasIKTracks ? 'yes' : 'no'} | VMD FK: ${ik.vmdHasFK ? 'yes' : 'no'}`);
if (ik.conflict) console.log('  ⚠ FK VMD + IK PMX conflict — IK should be disabled for FK bones');

// Source detect
const src = report.checks.sourceDetect;
console.log(`\n[Source Model] ${src.detected || 'Unknown'}`);
if (src.markers.length) console.log(`  Markers: ${src.markers.join(', ')}${src.droppedMarkers ? ' (dropped — not in PMX)' : ''}`);

// Twist
const tw = report.checks.twistCoverage;
console.log(`\n[Twist Bones] VMD: ${tw.vmd.length ? tw.vmd.join(', ') : 'none'} | PMX: ${tw.pmx.length ? tw.pmx.join(', ') : 'none'}`);

// Dummy
if (dummyStatus.length) {
  console.log('\n[Dummy Bones]');
  for (const d of dummyStatus) {
    console.log(`  ${d.name}: ${d.keyframes} keyframes, ${d.inPmx ? 'in PMX' : 'NOT in PMX (dropped)'}`);
  }
}

// Quat quality
if (Object.keys(quatReport).length) {
  console.log('\n[Quat Quality]');
  for (const [bone, q] of Object.entries(quatReport)) {
    console.log(`  ${bone}: peak ${q.peakAngle} at f${q.peakFrame}, ${q.hemisphereFlips} flips`);
  }
}

// Arm extremes
if (Object.keys(armExtremes).length) {
  console.log('\n[Arm Extremes] ⚠');
  for (const [bone, frames] of Object.entries(armExtremes)) {
    const sample = frames.slice(0, 5).map(f => `f${f.frame}(${f.angle})`).join(', ');
    console.log(`  ${bone}: ${frames.length} frames >120° — ${sample}${frames.length > 5 ? '...' : ''}`);
  }
}

// Score
console.log('\n' + '='.repeat(70));
console.log(`COMPATIBILITY SCORE: ${report.score}/100`);
if (report.score >= 90) console.log('Status: GOOD');
else if (report.score >= 70) console.log('Status: FAIR — retarget recommended');
else console.log('Status: POOR — significant compatibility issues');
console.log('='.repeat(70));
