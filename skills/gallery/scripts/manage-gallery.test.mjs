#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { addEntry, loadEntries, normalizeMetadata } from "./manage-gallery.mjs";

const root = mkdtempSync(path.join(os.tmpdir(), "knitten-gallery-test-"));
const image = path.join(root, "source.png");
writeFileSync(image, Buffer.from("89504e470d0a1a0a", "hex"));

const metadata = {
  schemaVersion: 1,
  id: "2026-07-22-v0-test-seed",
  date: "2026-07-22",
  variant: 0,
  seedFingerprint: "test-seed",
  title: "테스트 작품",
  emotionArc: "기대가 안도로 누그러진다",
  scene: "빈 식탁",
  medium: "종이 콜라주",
  compositionRule: "대칭",
  directionChoice: "컵 하나만 축을 깬다",
  punchline: "과한 준비가 웃음을 만든다",
  joke: "테스트 농담",
  rationale: "따뜻함과 빈자리를 함께 보이기 위해서다.",
  prompt: "A prompt with <unsafe> & exact line breaks\nsecond line",
  sourceSkill: "shotloom-today",
  generatedAt: "2026-07-22T08:56:04+09:00",
};

try {
  assert.equal(normalizeMetadata(metadata).id, metadata.id);
  const first = addEntry({ root, imagePath: image, metadata });
  assert.equal(first.idempotent, false);
  assert.equal(first.count, 1);
  assert.equal(loadEntries(root).length, 1);
  const html = readFileSync(first.htmlPath, "utf8");
  assert.match(html, /Knitten Gallery/);
  assert.match(html, /왜 이렇게 만들었나/);
  assert.match(html, /실제 생성 프롬프트/);
  assert.match(html, /&lt;unsafe&gt; &amp; exact line breaks/);

  const second = addEntry({ root, imagePath: image, metadata });
  assert.equal(second.idempotent, true);

  assert.throws(
    () => addEntry({ root, imagePath: image, metadata: { ...metadata, prompt: "changed" } }),
    /already exists with different content/,
  );
  assert.throws(() => normalizeMetadata({ ...metadata, date: "2026-02-30" }), /real YYYY-MM-DD/);
  process.stdout.write("gallery tests: ok\n");
} finally {
  rmSync(root, { recursive: true, force: true });
}
