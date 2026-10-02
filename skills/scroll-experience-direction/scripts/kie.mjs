#!/usr/bin/env node
// Design Ops Kie AI client — stills, image-to-video shots and background removal
// through Kie's market API (createTask → poll recordInfo → download). Zero deps, Node 18+.
//
// Usage:
//   node kie.mjs probe
//   node kie.mjs still "<scene>" [--preamble file] [--ref img]... [--aspect 16:9] [--quality high]
//   node kie.mjs shot  "<camera move>" --image img [--tail img] [--duration 5] [--aspect 16:9] [--resolution 1080p]
//   node kie.mjs cutout <img>
//   node kie.mjs status <taskId>
// Common: [--model id] [--out .design-ops/scroll/assets] [--name slug] [--dry-run]
//
// <img> is a local path (uploaded, Kie keeps it 3 days) or an http(s) URL.
// The key comes from $KIE_AI_API_KEY, else the nearest .env up from the cwd.
// --dry-run prints the request body and makes no network call (no key needed).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";

const API = "https://api.kie.ai";
const MODELS = {
  still: "seedream/5-pro-text-to-image",
  stillRef: "seedream/5-pro-image-to-image",
  shot: "kling-3.0-omni/image-to-video",
  cutout: "recraft/remove-background",
};

const argv = process.argv.slice(2);
const cmd = argv[0];
const VALUED = new Set(["preamble", "ref", "aspect", "quality", "image", "tail", "duration", "resolution", "model", "out", "name"]);
const opts = { ref: [] };
const positional = [];
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) positional.push(a);
  else if (VALUED.has(a.slice(2))) {
    const k = a.slice(2), v = argv[++i];
    if (v === undefined) fail(`--${k} needs a value`);
    k === "ref" ? opts.ref.push(v) : (opts[k] = v);
  } else opts[a.slice(2)] = true;
}
const dry = !!opts["dry-run"];
const outDir = resolve(opts.out || ".design-ops/scroll/assets");

function fail(msg) {
  console.error(`kie: ${msg}`);
  process.exit(1);
}

function apiKey() {
  if (process.env.KIE_AI_API_KEY) return process.env.KIE_AI_API_KEY;
  for (let dir = process.cwd(); ; dir = dirname(dir)) {
    const env = join(dir, ".env");
    if (existsSync(env)) {
      const m = readFileSync(env, "utf8").match(/^\s*KIE_AI_API_KEY\s*=\s*["']?([^"'\s#]+)/m);
      if (m) return m[1];
    }
    if (dirname(dir) === dir) break;
  }
  fail("KIE_AI_API_KEY not set (env or .env). Without it, run the printed specs by hand — see kie-ai.md.");
}

async function call(path, body) {
  const res = await fetch(API + path, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ code: res.status, msg: res.statusText }));
  if (json.code !== 200) fail(`${path} → ${json.code} ${json.msg || ""}`.trim());
  return json.data;
}

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

// Local files are uploaded so the market API can fetch them; URLs pass through.
async function asUrl(src) {
  if (/^https?:\/\//.test(src)) return src;
  const path = resolve(src);
  if (!existsSync(path)) fail(`no such file: ${src}`);
  if (dry) return `<upload:${path}>`;
  const mime = MIME[extname(path).toLowerCase()] || "application/octet-stream";
  const data = await call("/api/file-base64-upload", {
    base64Data: `data:${mime};base64,${readFileSync(path).toString("base64")}`,
    uploadPath: "design-ops",
    fileName: basename(path),
  });
  return data.downloadUrl;
}

function resultUrls(data) {
  const r = typeof data.resultJson === "string" ? JSON.parse(data.resultJson || "{}") : data.resultJson || {};
  return r.resultUrls || r.result_urls || r.urls || [];
}

async function poll(taskId, timeoutMs) {
  const start = Date.now();
  for (let wait = 4000; Date.now() - start < timeoutMs; wait = Math.min(wait * 1.25, 15000)) {
    await new Promise((r) => setTimeout(r, wait));
    const data = await call(`/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`);
    if (data.state === "success") return data;
    if (data.state === "fail") fail(`task ${taskId} failed: ${data.failMsg || data.failCode || "unknown"}`);
    console.error(`… ${taskId} ${data.state}`);
  }
  fail(`task ${taskId} timed out after ${timeoutMs / 60000} min; check later with: kie.mjs status ${taskId}`);
}

async function run(kind, model, input, meta, timeoutMs) {
  const body = { model, input };
  if (dry) return console.log(JSON.stringify(body, null, 2));
  const { taskId } = await call("/api/v1/jobs/createTask", body);
  console.error(`task ${taskId} (${model})`);
  const data = await poll(taskId, timeoutMs);
  const urls = resultUrls(data);
  if (!urls.length) fail(`task ${taskId} succeeded with no result URLs`);
  mkdirSync(outDir, { recursive: true });
  const name = opts.name || `${kind}-${Date.now()}`;
  const files = [];
  for (const [i, url] of urls.entries()) {
    const ext = extname(new URL(url).pathname) || (kind === "shot" ? ".mp4" : ".png");
    const file = join(outDir, `${name}${urls.length > 1 ? `-${i}` : ""}${ext}`);
    const res = await fetch(url);
    if (!res.ok) fail(`download ${url} → ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    files.push(file);
  }
  const sidecar = {
    provenance: "generated",
    kind, model, taskId, input, ...meta,
    resultUrls: urls, files,
    creditsConsumed: data.creditsConsumed ?? null,
    createdAt: new Date().toISOString(),
  };
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(sidecar, null, 2));
  console.log(JSON.stringify({ taskId, files, sidecar: join(outDir, `${name}.json`) }, null, 2));
}

const prompt = () => {
  const scene = positional[0] || fail(`${cmd} needs a prompt`);
  const pre = opts.preamble ? readFileSync(opts.preamble, "utf8").trim() + "\n\n" : "";
  return pre + scene;
};

const MIN = 60000;
switch (cmd) {
  case "probe": {
    if (dry) { console.log(JSON.stringify({ request: "GET /api/v1/chat/credit" })); break; }
    console.log(JSON.stringify({ credits: await call("/api/v1/chat/credit") }));
    break;
  }
  case "status": {
    const id = positional[0] || fail("status needs a taskId");
    const data = await call(`/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(id)}`);
    console.log(JSON.stringify({ state: data.state, urls: data.state === "success" ? resultUrls(data) : [], failMsg: data.failMsg || null }, null, 2));
    break;
  }
  case "still": {
    const p = prompt();
    const refs = await Promise.all(opts.ref.map(asUrl));
    const input = { prompt: p, aspect_ratio: opts.aspect || "16:9", quality: opts.quality || "high", output_format: "png" };
    if (refs.length) input.image_urls = refs;
    await run("still", opts.model || (refs.length ? MODELS.stillRef : MODELS.still), input, { refs: opts.ref, preamble: opts.preamble || null }, 15 * MIN);
    break;
  }
  case "shot": {
    const p = prompt();
    if (!opts.image) fail("shot needs --image (the first frame)");
    // First-and-last-frame mode pins the tail so chained clips meet at a locked seam.
    const frames = [await asUrl(opts.image), ...(opts.tail ? [await asUrl(opts.tail)] : [])];
    const input = {
      prompt: p,
      image_urls: frames,
      duration: Number(opts.duration || 5),
      resolution: opts.resolution || "1080p",
      aspect_ratio: opts.aspect || "16:9",
      audio: false,
    };
    await run("shot", opts.model || MODELS.shot, input, { image: opts.image, tail: opts.tail || null, preamble: opts.preamble || null }, 20 * MIN);
    break;
  }
  case "cutout": {
    const src = positional[0] || fail("cutout needs an image");
    await run("cutout", opts.model || MODELS.cutout, { image: await asUrl(src) }, { source: src }, 15 * MIN);
    break;
  }
  default:
    fail("usage: kie.mjs probe | still <prompt> | shot <prompt> --image f | cutout <img> | status <taskId>  [--dry-run]");
}
