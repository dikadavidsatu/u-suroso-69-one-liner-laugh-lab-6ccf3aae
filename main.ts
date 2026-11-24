import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The excuse a robot vacuum gives after eating a sock, in one line.
const LINE =
  "I did not eat your sock; I promoted it to lint, effective immediately, no severance.";

function validate(text: string): void {
  if (typeof text !== "string") throw new Error("entry must be a string");
  if (text.length < 1 || text.length > 200)
    throw new Error(`entry length ${text.length} outside 1..200`);
  if (text.trim().length === 0) throw new Error("entry is only whitespace");
  if (text.includes("\n") || text.includes("\r"))
    throw new Error("entry must be a single line");
  if (text !== text.trim())
    throw new Error("entry must not have leading or trailing whitespace");
  if (!/sock/i.test(text))
    throw new Error("entry must answer the sock prompt");
}

validate(LINE);

const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "entry.txt"), LINE, "utf8");
