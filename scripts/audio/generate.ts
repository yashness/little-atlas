import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { COUNTRIES } from "../../src/platform/catalog";
import { narrationEntries } from "../../src/library/atlas/narration";
import { version } from "../../package.json";

const root = process.cwd(),
  directory = path.join(root, "assets/audio");
const voice = "en-US-Olivia:MAI-Voice-2",
  rate = "-8%",
  format = "mp3-hq";
const entries = Object.entries(narrationEntries(COUNTRIES));
const cachePath = path.join(root, ".cache/audio-progress.json");
type Proof = { inputHash: string; audioHash: string };
type Manifest = {
  voice: string;
  rate: string;
  format?: string;
  clips: { id: string; textHash: string; audioHash: string }[];
};
let cache: Record<string, Proof> = {};
let previous: Manifest | null = null;
try {
  cache = JSON.parse(fs.readFileSync(cachePath, "utf8")) as Record<
    string,
    Proof
  >;
} catch {
  /* first generation */
}
try {
  previous = JSON.parse(
    fs.readFileSync(path.join(root, "assets/narration.json"), "utf8"),
  ) as Manifest;
} catch {
  /* first release */
}
const published = new Map(
  (previous?.clips ?? []).map((clip) => [clip.id, clip]),
);
const sha = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const verifyOnly =
  process.argv.includes("--manifest-only") ||
  process.argv.includes("--verify-only");
fs.mkdirSync(directory, { recursive: true });
fs.mkdirSync(path.dirname(cachePath), { recursive: true });
let cursor = 0,
  complete = 0;
async function record(id: string, text: string): Promise<void> {
  const hash = createHash("sha256")
    .update(`${text}|${voice}|${rate}|${format}`)
    .digest("hex");
  const output = path.join(directory, id + ".mp3");
  const audioHash = fs.existsSync(output) ? sha(fs.readFileSync(output)) : null;
  const old = published.get(id);
  const proof = cache[id];
  const verifiedCache =
    proof?.inputHash === hash && proof.audioHash === audioHash;
  const verifiedRelease =
    previous?.voice === voice &&
    previous.rate === rate &&
    (previous.format ?? "mp3-hq") === format &&
    old?.textHash === sha(text) &&
    old.audioHash === audioHash;
  if (audioHash && (verifiedCache || verifiedRelease)) {
    complete++;
    return;
  }
  if (verifyOnly)
    throw new Error(
      `${id}: changed text or audio requires a real recording; refusing to bless stale narration.`,
    );
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          path.join(process.env["HOME"] ?? "", "bin/tts.py"),
          [
            text,
            "--voice",
            voice,
            `--rate=${rate}`,
            "--format",
            format,
            "-o",
            output,
          ],
          { stdio: ["ignore", "ignore", "pipe"], timeout: 90000 },
        );
        let error = "";
        child.stderr.on("data", (chunk: Buffer) => {
          error += chunk.toString();
        });
        child.on("error", reject);
        child.on("exit", (code) =>
          code === 0
            ? resolve()
            : reject(new Error(`${id}: synthesis failed (${code}): ${error}`)),
        );
      });
      cache[id] = { inputHash: hash, audioHash: sha(fs.readFileSync(output)) };
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2) + "\n");
      console.log(`${++complete}/${entries.length} recorded: ${id}`);
      return;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
}
async function main(): Promise<void> {
  {
    const workers = Array.from({ length: 6 }, async () => {
      while (cursor < entries.length) {
        const [id, text] = entries[cursor++]!;
        await record(id, text);
      }
    });
    const results = await Promise.allSettled(workers);
    for (const result of results)
      if (result.status === "rejected") throw result.reason;
  }
  fs.writeFileSync(
    path.join(root, "assets/narration.json"),
    JSON.stringify(
      {
        version,
        voice,
        rate,
        format,
        clips: entries.map(([id, text]) => ({
          id,
          file: `assets/audio/${id}.mp3`,
          textHash: createHash("sha256").update(text).digest("hex"),
          audioHash: createHash("sha256")
            .update(fs.readFileSync(path.join(directory, id + ".mp3")))
            .digest("hex"),
        })),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Ready: ${entries.length} clips in the shared narration contract.`,
  );
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
