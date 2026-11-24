import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The excuse a robot vacuum gives after eating a sock, in one line.
const LINE =
  "I did not eat your sock; I promoted it to lint, effective immediately, no severance.";

const MAX_CHARS = 200;

// A valid entry is one line of UTF-8 text, 1..200 characters, not only
// whitespace, with no leading or trailing whitespace and no line breaks.
// It must also answer the prompt: the vacuum's excuse about the sock.
function checkLine(text: string): void {
  if (typeof text !== "string") {
    throw new Error("entry must be a string");
  }
  if (text.length < 1 || text.length > MAX_CHARS) {
    throw new Error(`entry length ${text.length} outside 1..${MAX_CHARS}`);
  }
  if (text.trim().length === 0) {
    throw new Error("entry is only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("entry must be a single line");
  }
  if (text !== text.trim()) {
    throw new Error("entry must not have leading or trailing whitespace");
  }
  if (!/sock/i.test(text)) {
    throw new Error("entry must answer the sock prompt");
  }
}

checkLine(LINE);

// Report what was written, so a local run shows the entry and its length.
function report(text: string): void {
  console.log(`entry (${text.length} chars): ${text}`);
}

report(LINE);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.txt"), LINE, "utf8");
