// One-Liner Laugh Lab — make.fun bounty
// u-suroso-69-one-liner-laugh-lab-6ccf3aae
//
// The task: write one short funny line answering a prompt — here, the excuse
// a robot vacuum gives after eating a sock. The funniest, most original line
// wins, judged pairwise against other entries on humour, originality, fit to
// the prompt, and tightness of wording.
//
// What this program does:
//   1. Holds the entry line as a constant (the joke itself).
//   2. Validates it against the sealed scorer's gate before writing anything:
//      the output must be UTF-8 text of 1..200 characters, not only
//      whitespace. On top of that we enforce our own stricter shape so the
//      line always reaches the judge clean: exactly one line, no leading or
//      trailing whitespace, no control characters, and it must actually
//      answer the prompt (it names the sock, and it speaks as the vacuum).
//   3. Writes the line, byte for byte and with no trailing newline, to
//      `entry.txt` inside MAKEFUN_OUTPUT_DIR (default `/output`).
//   4. Reads the file back and re-validates it, so a local run proves the
//      exact bytes the judge will see.
//
// Run it:
//   MAKEFUN_OUTPUT_DIR=/output node main.ts
//
// Exit code is 0 only when the written file passes every check; any gate
// failure throws before the file is written, so a bad line can never ship.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// The entry line
// ---------------------------------------------------------------------------
//
// The joke, in the vacuum's own voice: it does not deny the sock is gone, it
// reframes the whole incident as self-defence. The sock is the aggressor, the
// vacuum merely reacted, and the punchline — "now it is lint" — is the
// deadpan verdict on the sock's fate. Short, first-person, and built from the
// situation itself rather than a stock robot joke.
const LINE =
  "The sock came at me first, I acted in self-defense, and now it is lint.";

// ---------------------------------------------------------------------------
// The gate (from the competition rules)
// ---------------------------------------------------------------------------

// The sealed scorer accepts 1..200 characters of UTF-8 text that is not only
// whitespace. Anything outside that is listed with Valid 0 and never reaches
// the judge, so the program refuses to write it at all.
const MIN_CHARS = 1;
const MAX_CHARS = 200;

// The file the judge reads.
const OUTPUT_FILENAME = "entry.txt";

// Words the line must carry to count as answering this prompt: the sock it
// excuses, plus at least one word that places the joke in the vacuum's world.
const PROMPT_SUBJECT = /sock/i;
const VACUUM_WORLD = /lint|dustbin|suction|vacuum|floor|brush/i;

// Characters that would break the "one line of text" shape.
const LINE_BREAK = /[\n\r]/;
const CONTROL_CHAR = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Count characters the way a reader does: one count per Unicode code point,
// so an astral character (an emoji, say) counts once, not twice. Our line is
// plain ASCII, so this agrees with .length here — but the check stays honest
// for any future line that is not.
function charCount(text: string): number {
  return [...text].length;
}

// Abort the run with a clear reason. Throwing (rather than logging and
// continuing) guarantees a failed gate never produces an output file.
function fail(reason: string): never {
  throw new Error(`entry rejected: ${reason}`);
}

// --- Individual gate checks. Each returns the name of the check it passed,
// so the run report can list exactly what was verified. ---

function checkLength(text: string): string {
  const n = charCount(text);
  if (n < MIN_CHARS || n > MAX_CHARS) {
    fail(`length ${n} characters is outside ${MIN_CHARS}..${MAX_CHARS}`);
  }
  return `length ${n}/${MAX_CHARS}`;
}

function checkNotBlank(text: string): string {
  if (text.trim().length === 0) {
    fail("entry is only whitespace");
  }
  return "not blank";
}

function checkSingleLine(text: string): string {
  if (LINE_BREAK.test(text)) {
    fail("entry must be a single line (no line breaks)");
  }
  return "single line";
}

function checkNoEdgeWhitespace(text: string): string {
  if (text !== text.trim()) {
    fail("entry must not start or end with whitespace");
  }
  return "no edge whitespace";
}

function checkNoControlChars(text: string): string {
  if (CONTROL_CHAR.test(text)) {
    fail("entry contains a control character");
  }
  return "no control characters";
}

// The line has to answer the prompt, not just be a funny sentence: it must
// name the sock and sit in the vacuum's world, and it must read as the
// vacuum's own excuse (first person), not a narrator describing it.
function checkPromptFit(text: string): string {
  if (!PROMPT_SUBJECT.test(text)) {
    fail('entry must answer the sock prompt (must mention "sock")');
  }
  if (!VACUUM_WORLD.test(text)) {
    fail("entry must sit in the vacuum's world (lint, dustbin, suction...)");
  }
  if (!/\bI\b/.test(text)) {
    fail("entry must be the vacuum's own excuse (first person)");
  }
  return "answers the sock prompt";
}

// Run every check in order and return the list of checks that passed.
function validateEntry(text: string): string[] {
  if (typeof text !== "string") {
    fail("entry must be a string");
  }
  return [
    checkLength(text),
    checkNotBlank(text),
    checkSingleLine(text),
    checkNoEdgeWhitespace(text),
    checkNoControlChars(text),
    checkPromptFit(text),
  ];
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

// Resolve the output directory: the harness sets MAKEFUN_OUTPUT_DIR, and
// /output is the documented default for a local run.
function resolveOutputDir(): string {
  const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  if (dir.trim().length === 0) {
    fail("MAKEFUN_OUTPUT_DIR is empty");
  }
  return dir;
}

// Write the line exactly as validated: UTF-8, no trailing newline, so the
// file's contents are the line and nothing else.
function writeEntry(outDir: string, text: string): string {
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, OUTPUT_FILENAME);
  writeFileSync(path, text, "utf8");
  return path;
}

// Read the file back, decode it strictly as UTF-8, and confirm it is byte
// for byte the validated line — then validate the decoded text once more, so
// the run proves the exact bytes the judge will read.
function verifyWrittenFile(path: string, expected: string): void {
  const raw = readFileSync(path);
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(raw);
  if (decoded !== expected) {
    fail(`written file differs from the validated line (${path})`);
  }
  validateEntry(decoded);
}

// Print a short human-readable summary of what was written and verified.
function report(text: string, checks: string[], outPath: string): void {
  console.log(`entry (${charCount(text)} chars): ${text}`);
  console.log(`gate checks passed: ${checks.join("; ")}`);
  console.log(`wrote ${outPath}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const checks = validateEntry(LINE);
const outDir = resolveOutputDir();
const outPath = writeEntry(outDir, LINE);
verifyWrittenFile(outPath, LINE);
report(LINE, checks, outPath);
