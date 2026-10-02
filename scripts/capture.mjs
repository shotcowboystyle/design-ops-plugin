#!/usr/bin/env node
// Design Ops reference capture — one puppeteer-core run over N live sites.
// For each URL: desktop + phone screenshots at scroll steps (real wheel events,
// so Lenis/Locomotive smooth-scroll sites actually move) and a measured design
// DNA (type, color, spacing, layout, radius, motion stack) written to dna.json.
//
// Usage:
//   node scripts/capture.mjs <url> [url…] [--out .design-ops/refs] [--steps 4]
//   node scripts/capture.mjs --from .design-ops/refs/awwwards.json [--pick slug1,slug2]
//   node scripts/capture.mjs <url> --frames [--passes desktop,phone,compact,reduced,nojs,nowebgl]
//
// --frames also samples every act (each [data-act], else each top-level section) at its
// entry, midpoint and exit, once per pass, and flags dead scroll, horizontal overflow,
// console errors and failed requests in <slug>/frames/report.json. With ffmpeg on PATH,
// each pass also gets a contact sheet.
//
// puppeteer-core is NOT a Design Ops dependency. It is resolved, in order, from
// $DESIGN_OPS_PUPPETEER_DIR, then the current project. Chrome is found in the
// puppeteer browser cache, then standard install paths (set $DESIGN_OPS_CHROME to override).

import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? dflt : args[i + 1];
};
const VALUED = ["out", "steps", "from", "pick", "passes"];
const outRoot = resolve(flag("out", ".design-ops/refs"));
const steps = Math.max(1, Math.min(Number(flag("steps", 4)) || 4, 8));
const frameMode = args.includes("--frames");
const PASS_NAMES = ["desktop", "phone", "compact", "reduced", "nojs", "nowebgl"];
const passes = flag("passes", PASS_NAMES.join(",")).split(",").map((s) => s.trim());
const badPass = passes.find((p) => !PASS_NAMES.includes(p));
if (badPass) {
  console.error(`unknown pass "${badPass}"; use: ${PASS_NAMES.join(",")}`);
  process.exit(1);
}

let targets = args
  .filter(
    (a, i) => !a.startsWith("--") && !VALUED.includes(args[i - 1]?.slice(2)),
  )
  .map((url) => ({ url }));
if (flag("from")) {
  const picked = flag("pick")
    ?.split(",")
    .map((s) => s.trim());
  const { sites } = JSON.parse(readFileSync(flag("from"), "utf8"));
  targets.push(
    ...sites.filter((s) => s.url && (!picked || picked.includes(s.slug))),
  );
}
if (!targets.length) {
  console.error(
    "usage: node scripts/capture.mjs <url> [url…] [--out .design-ops/refs] | --from awwwards.json [--pick a,b]",
  );
  process.exit(1);
}

async function loadPuppeteer() {
  const dirs = [
    process.env.DESIGN_OPS_PUPPETEER_DIR,
    process.cwd(),
  ].filter(Boolean);
  for (const dir of dirs) {
    try {
      const path = createRequire(join(dir, "package.json")).resolve(
        "puppeteer-core",
      );
      return (await import(pathToFileURL(path).href)).default;
    } catch {
      // Not installed in this candidate dir; try the next one.
    }
  }
  console.error(
    "puppeteer-core not found. `npm i -D puppeteer-core` in this project, or set DESIGN_OPS_PUPPETEER_DIR to a folder that has it.",
  );
  process.exit(2);
}

function findChrome() {
  if (
    process.env.DESIGN_OPS_CHROME &&
    existsSync(process.env.DESIGN_OPS_CHROME)
  )
    return process.env.DESIGN_OPS_CHROME;
  for (const base of [join(homedir(), ".cache/puppeteer")]) {
    const dir = join(base, "chrome");
    if (!existsSync(dir)) continue;
    for (const b of readdirSync(dir).sort().reverse()) {
      for (const arch of ["mac-arm64", "mac-x64"]) {
        const p = join(
          dir,
          b,
          `chrome-${arch}/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
        );
        if (existsSync(p)) return p;
      }
      const linux = join(dir, b, "chrome-linux64/chrome");
      if (existsSync(linux)) return linux;
    }
  }
  const known =
    process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
        ];
  const hit = known.find(existsSync);
  if (!hit) {
    console.error(
      "No Chrome found. Install Google Chrome or set DESIGN_OPS_CHROME.",
    );
    process.exit(2);
  }
  return hit;
}

// Host plus path, so two pages on one host (localhost/before, localhost/after) never collide.
const slugOf = (t) =>
  t.slug ||
  (() => {
    const u = new URL(t.url);
    return `${u.hostname.replace(/^www\./, "")}${u.port ? "-" + u.port : ""}${u.pathname}`
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
  })();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Consent banners and age gates (common on food & drink winners) hide the hero.
// Click the obvious accept / "yes, I'm of age" button once; never anything else.
async function dismissConsent(page) {
  await page
    .evaluate(() => {
      const re =
        /^(accept( all)?|allow( all)?|agree|i agree|got it|ok(ay)?|continue|enter( site)?|yes|i am (21|18)\+?|i'm (21|18)\+?|i am of (legal )?age)$/i;
      // Gates are often a clickable <div>, not a <button>: match any leaf element with a pointer cursor.
      const clickable = (e) =>
        e.matches('button, a, [role="button"]') ||
        getComputedStyle(e).cursor === "pointer";
      const gate = [
        ...document.querySelectorAll('button, a, [role="button"], div, span'),
      ].find(
        (e) =>
          e.children.length <= 1 &&
          re.test((e.textContent || "").trim()) &&
          clickable(e),
      );
      gate?.click();

      // Marketing popups ("15% off") and their scrims: fixed layers that cover the
      // viewport and either collect an email, embed an iframe, or are an empty dim.
      // A fixed <canvas> or a fixed layer holding real page content is left alone.
      const vw = innerWidth,
        vh = innerHeight;
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el);
        if (
          cs.position !== "fixed" ||
          cs.display === "none" ||
          el.tagName === "CANVAS" ||
          el.querySelector("canvas")
        )
          continue;
        const r = el.getBoundingClientRect();
        const cover =
          ((Math.min(r.right, vw) - Math.max(r.left, 0)) *
            (Math.min(r.bottom, vh) - Math.max(r.top, 0))) /
          (vw * vh);
        if (cover < 0.2) continue;
        const email = el.querySelector(
          'input[type="email"], input[name*="email" i]',
        );
        const frame =
          el.tagName === "IFRAME" ||
          (el.querySelector("iframe") &&
            !el.querySelector("main, section, article"));
        const scrim =
          !el.textContent.trim() &&
          /rgba\(.+,\s*0?\.\d+\)/.test(cs.backgroundColor);
        const dialog =
          el.matches('[role="dialog"], [aria-modal="true"]') ||
          /popup|modal|klaviyo|privy|newsletter/i.test(
            el.className + "" + el.id,
          );
        if (email || frame || scrim || dialog)
          el.style.setProperty("display", "none", "important");
      }
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    })
    // Best effort: a page with no consent banner, or one that blocks evaluate,
    // is still worth capturing as-is.
    .catch(() => {});
}

// Scroll with real wheel input: programmatic scrollTo is ignored by Lenis and
// Locomotive, which is how a capture ends up with N copies of the hero.
async function wheelTo(page, fraction) {
  const { height, vh } = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    vh: innerHeight,
  }));
  await wheelToY(page, Math.max(0, (height - vh) * fraction));
}

async function wheelToY(page, target) {
  await page.mouse.move(200, 300);
  // Wheel-to-pixel gain is 1 on desktop but not under touch emulation, so measure it on
  // the first round and correct on the next. Up to 3 rounds; a page end stops early.
  let gain = 1;
  for (let round = 0; round < 3; round++) {
    const y0 = await page.evaluate(() => scrollY);
    const want = target - y0;
    if (Math.abs(want) <= 40) break;
    const sent = want / gain;
    for (let left = sent; Math.abs(left) > 20; ) {
      const step = Math.sign(left) * Math.min(Math.abs(left), 400);
      await page.mouse.wheel({ deltaY: step });
      await sleep(90);
      left -= step;
    }
    await sleep(900);
    const moved = (await page.evaluate(() => scrollY)) - y0;
    if (Math.abs(moved) < 20) break;
    gain = Math.min(5, Math.max(0.2, moved / sent));
  }
}

// Everything measured here is computed style from the live DOM, so the DNA
// describes what the site actually renders, not what its CSS happens to declare.
function measureDNA() {
  const px = (v) => Math.round(parseFloat(v) || 0);
  const tally = (arr) =>
    Object.entries(
      arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {}),
    ).sort((a, b) => b[1] - a[1]);
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return (
      r.width > 0 &&
      r.height > 0 &&
      cs.visibility !== "hidden" &&
      cs.display !== "none" &&
      +cs.opacity > 0.01
    );
  };
  const family = (f) => f.split(",")[0].replace(/["']/g, "").trim();
  const textStyle = (sel) => {
    const els = [...document.querySelectorAll(sel)]
      .filter(visible)
      .slice(0, 40);
    if (!els.length) return null;
    // Representative = the style that carries the most text overall, preferring
    // readable running text: a long uppercase 12px footnote is not the body face.
    const groups = new Map();
    for (const e of els) {
      const c = getComputedStyle(e);
      const key = `${c.fontFamily}|${c.fontSize}|${c.fontWeight}|${c.textTransform}`;
      const readable =
        c.textTransform !== "uppercase" && parseFloat(c.fontSize) >= 14;
      const g = groups.get(key) || { el: e, chars: 0, readable };
      g.chars += (e.textContent || "").trim().length;
      groups.set(key, g);
    }
    const ranked = [...groups.values()].sort(
      (a, b) => b.readable - a.readable || b.chars - a.chars,
    );
    const cs = getComputedStyle(ranked[0].el);
    return {
      family: family(cs.fontFamily),
      sizes: [...new Set(els.map((e) => px(getComputedStyle(e).fontSize)))]
        .sort((a, b) => b - a)
        .slice(0, 6),
      weight: cs.fontWeight,
      lineHeight:
        cs.lineHeight === "normal"
          ? "normal"
          : +(parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)).toFixed(2),
      tracking:
        cs.letterSpacing === "normal"
          ? "0"
          : `${(parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize)).toFixed(3)}em`,
      transform: cs.textTransform,
      count: els.length,
    };
  };

  const all = [...document.querySelectorAll("body *")]
    .filter(visible)
    .slice(0, 4000);
  const area = (el) => {
    const r = el.getBoundingClientRect();
    return r.width * r.height;
  };

  // Colors weighted by painted area (backgrounds) and by count (text).
  const bg = {};
  for (const el of all) {
    const c = getComputedStyle(el).backgroundColor;
    if (!c || c === "rgba(0, 0, 0, 0)" || c === "transparent") continue;
    bg[c] = (bg[c] || 0) + area(el);
  }
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
  const pageBg =
    [bodyBg, htmlBg].find((c) => c && c !== "rgba(0, 0, 0, 0)") ||
    "rgb(255, 255, 255)";
  const text = tally(
    all
      .filter(
        (e) =>
          e.childNodes.length &&
          [...e.childNodes].some(
            (n) => n.nodeType === 3 && n.textContent.trim(),
          ),
      )
      .map((e) => getComputedStyle(e).color),
  );

  const sections = [
    ...document.querySelectorAll(
      "main > *, body > section, main section, body > div > section, footer",
    ),
  ]
    .filter(visible)
    .slice(0, 30);
  const radii = tally(
    all
      .map((e) => getComputedStyle(e).borderTopLeftRadius)
      .filter((r) => r !== "0px"),
  );
  // Multi-property transitions repeat the same value per property; keep the first.
  const first = (v) => v.split(/,(?![^(]*\))/)[0].trim();
  const animated = all.filter(
    (e) => getComputedStyle(e).transitionDuration !== "0s",
  );
  const easings = tally(
    animated.map((e) => first(getComputedStyle(e).transitionTimingFunction)),
  );
  const durations = tally(
    animated.map((e) => first(getComputedStyle(e).transitionDuration)),
  );
  const widths = all
    .map((e) => getComputedStyle(e).maxWidth)
    .filter((w) => w.endsWith("px"));

  const html = document.documentElement;
  const has = (cond) => {
    try {
      return !!cond();
    } catch {
      return false;
    }
  };
  const scriptSrc = [...document.scripts].map((s) => s.src).join(" ");

  return {
    title: document.title,
    description:
      document.querySelector('meta[name="description"]')?.content || null,
    pageHeight: html.scrollHeight,
    sectionCount: sections.length,
    theme: (() => {
      const [r, g, b] = pageBg.match(/\d+/g).map(Number);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45
        ? "dark"
        : "light";
    })(),
    type: {
      display: textStyle("h1"),
      heading: textStyle("h2, h3"),
      body: textStyle("p"),
      ui: textStyle('button, nav a, a[class*="btn"], a[class*="button"]'),
      loadedFaces: [
        ...new Set(
          [...document.fonts]
            .filter((f) => f.status === "loaded")
            .map((f) => `${f.family.replace(/["']/g, "")} ${f.weight}`),
        ),
      ].slice(0, 16),
    },
    color: {
      pageBackground: pageBg,
      backgrounds: Object.entries(bg)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([c, a]) => ({
          color: c,
          share: +(a / (innerWidth * html.scrollHeight)).toFixed(3),
        })),
      text: text.slice(0, 6).map(([c, n]) => ({ color: c, count: n })),
    },
    spacing: {
      sectionPaddingY: [
        ...new Set(
          sections
            .map((s) => px(getComputedStyle(s).paddingTop))
            .filter(Boolean),
        ),
      ].sort((a, b) => a - b),
      sectionHeights: sections.map((s) =>
        Math.round(s.getBoundingClientRect().height),
      ),
      gaps: tally(
        all
          .map((e) => getComputedStyle(e).rowGap)
          .filter((g) => g !== "normal" && g !== "0px"),
      ).slice(0, 6),
    },
    layout: {
      viewport: innerWidth,
      containerMaxWidths: tally(widths).slice(0, 4),
      gridCount: all.filter((e) => getComputedStyle(e).display.includes("grid"))
        .length,
      flexCount: all.filter((e) => getComputedStyle(e).display.includes("flex"))
        .length,
      gridTemplates: tally(
        all
          .filter((e) => getComputedStyle(e).display.includes("grid"))
          .map(
            (e) =>
              getComputedStyle(e).gridTemplateColumns.split(" ").length +
              " cols",
          ),
      ).slice(0, 4),
    },
    shape: { radii: radii.slice(0, 5) },
    motion: {
      // Best-effort: libraries bundled as ES modules leave no global, so a false
      // here means "not detected", not "not used". Read the shots too.
      stack: {
        gsap: has(() => window.gsap) || /gsap/.test(scriptSrc),
        scrollTrigger: has(
          () => window.ScrollTrigger || window.gsap?.plugins?.scrollTrigger,
        ),
        lenis:
          has(() => window.lenis || window.Lenis) ||
          html.classList.contains("lenis"),
        locomotive:
          html.classList.contains("has-scroll-smooth") ||
          !!document.querySelector("[data-scroll-container]"),
        three: has(() => window.THREE || window.__THREE__),
        webgl: [...document.querySelectorAll("canvas")].some((c) =>
          has(() => c.getContext("webgl2") || c.getContext("webgl")),
        ),
        framer: !!document.querySelector(
          "[data-framer-name], [data-framer-component-type]",
        ),
        webflow: !!html.dataset.wfPage,
        barba: !!document.querySelector("[data-barba]"),
        swiper: !!document.querySelector(".swiper"),
        lottie:
          !!document.querySelector("lottie-player, dotlottie-player") ||
          has(() => window.lottie),
      },
      canvases: document.querySelectorAll("canvas").length,
      videos: document.querySelectorAll("video").length,
      easings: easings.slice(0, 4),
      durations: durations.slice(0, 4),
    },
    counts: {
      images: document.images.length,
      links: document.links.length,
      buttons: document.querySelectorAll("button").length,
      forms: document.forms.length,
    },
  };
}

// Act geometry for --frames: [data-act] if the build marks its acts, else top-level
// sections. A GSAP pin-spacer is measured instead of the pinned element, because the
// spacer is what holds the act's scroll distance.
function findActs() {
  const marked = [...document.querySelectorAll("[data-act]")];
  const els = marked.length
    ? marked
    : [...document.querySelectorAll("main > *, body > section, main section, body > div > section, footer")];
  const vh = innerHeight;
  const seen = new Set();
  const acts = [];
  for (const [i, el] of els.entries()) {
    const box = el.closest(".pin-spacer") || el;
    if (seen.has(box)) continue;
    seen.add(box);
    const r = box.getBoundingClientRect();
    if (r.height < 40) continue;
    const top = r.top + scrollY;
    const label = (el.dataset.act || el.id || el.querySelector("h1, h2, h3")?.textContent || `s${i}`)
      .trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || `s${i}`;
    // Short acts get one centred frame; tall (pinned or scrubbed) acts get entry, midpoint, exit.
    const states = r.height < vh * 1.2
      ? { view: top - (vh - r.height) / 2 }
      : { entry: top, midpoint: top + (r.height - vh) / 2, exit: top + r.height - vh };
    const maxY = document.documentElement.scrollHeight - vh;
    for (const k in states) states[k] = Math.max(0, Math.min(maxY, states[k]));
    acts.push({ label, top: Math.round(top), height: Math.round(r.height), hold: el.dataset.verifyHold === "true", states });
  }
  return acts.slice(0, 16);
}

const PASS_SETUP = {
  desktop: { vp: "desktop" },
  phone: { vp: "phone" },
  compact: { vp: "compact" },
  reduced: { vp: "desktop", reduced: true },
  nojs: { vp: "desktop", noJs: true },
  nowebgl: { vp: "desktop", noWebgl: true },
};

async function captureFrames(url, dir) {
  const report = { url, capturedAt: new Date().toISOString(), passes: {} };
  for (const name of passes) {
    const setup = PASS_SETUP[name];
    const passDir = join(dir, "frames", name);
    mkdirSync(passDir, { recursive: true });
    const page = await browser.newPage();
    const pass = { acts: [], flags: [], consoleErrors: [], failedRequests: [] };
    page.on("console", (m) => m.type() === "error" && pass.consoleErrors.push(m.text().slice(0, 300)));
    page.on("pageerror", (e) => pass.consoleErrors.push(String(e.message || e).slice(0, 300)));
    page.on("requestfailed", (r) => pass.failedRequests.push(`${r.failure()?.errorText} ${r.url()}`.slice(0, 300)));
    const vp = { ...VIEWPORTS, ...FRAME_VIEWPORTS }[setup.vp];
    await page.setViewport(vp);
    if (vp.isMobile) await page.setUserAgent(PHONE_UA);
    if (setup.reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    if (setup.noJs) await page.setJavaScriptEnabled(false);
    if (setup.noWebgl)
      await page.evaluateOnNewDocument(() => {
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
          return /webgl/i.test(type) ? null : get.call(this, type, ...rest);
        };
      });
    await page
      .goto(url, { waitUntil: "networkidle2", timeout: 45000 })
      .catch((err) => pass.flags.push(`load: ${err.message}`));
    await sleep(2500);
    await dismissConsent(page);
    const acts = await page.evaluate(findActs);
    // Against the configured width: on a touch viewport, overflow widens innerWidth itself.
    const overflow = (await page.evaluate(() => document.documentElement.scrollWidth)) - vp.width;
    if (overflow > 1) pass.flags.push(`horizontal overflow: ${overflow}px`);
    // Motion is expected to stop without JS or with reduced motion, so stillness is no defect there.
    const expectMotion = !setup.noJs && !setup.reduced;
    const vh = vp.height;
    let n = 0;
    for (const act of acts) {
      const frames = [];
      for (const [state, y] of Object.entries(act.states)) {
        await wheelToY(page, Math.round(y));
        const reached = await page.evaluate(() => scrollY);
        const file = `${String(n++).padStart(2, "0")}-${act.label}-${state}.jpg`;
        const buf = await page.screenshot({ path: join(passDir, file), type: "jpeg", quality: 72 });
        frames.push({ state, y: Math.round(y), reached, file, hash: createHash("sha1").update(buf).digest("hex").slice(0, 12) });
        if (Math.abs(reached - y) > vh / 2)
          pass.flags.push(`${act.label}/${state}: asked for y=${Math.round(y)}, page is at ${reached} (scroll blocked or jacked?)`);
      }
      const still = frames.slice(1).filter((f, i) => f.hash === frames[i].hash).map((f) => f.state);
      if (expectMotion && !act.hold && still.length)
        pass.flags.push(`${act.label}: dead scroll, frame unchanged into ${still.join(", ")}`);
      pass.acts.push({ ...act, frames });
    }
    if (!pass.consoleErrors.length) delete pass.consoleErrors;
    if (!pass.failedRequests.length) delete pass.failedRequests;
    report.passes[name] = pass;
    await page.close();
    contactSheet(passDir, n);
  }
  writeFileSync(join(dir, "frames", "report.json"), JSON.stringify(report, null, 2));
  return Object.fromEntries(Object.entries(report.passes).map(([k, p]) => [k, p.flags.length]));
}

// Optional: one tiled sheet per pass, so a whole pass can be read in a single image.
function contactSheet(passDir, count) {
  if (!count || spawnSync("ffmpeg", ["-version"]).status !== 0) return;
  const cols = Math.min(count, 6);
  spawnSync("ffmpeg", [
    "-y", "-loglevel", "error", "-pattern_type", "glob", "-i", join(passDir, "*.jpg"),
    "-vf", `scale=480:-2,tile=${cols}x${Math.ceil(count / cols)}:padding=6`, "-frames:v", "1",
    join(passDir, "sheet.jpg"),
  ]);
}

const puppeteer = await loadPuppeteer();
const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: [
    "--no-sandbox",
    "--autoplay-policy=no-user-gesture-required",
    "--hide-scrollbars",
  ],
});

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  phone: {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};
// Frame passes only; the reference capture keeps its two viewports.
const FRAME_VIEWPORTS = {
  compact: { width: 360, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const PHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const summary = [];
for (const t of targets) {
  const slug = slugOf(t);
  const dir = join(outRoot, slug);
  mkdirSync(dir, { recursive: true });
  const record = {
    slug,
    url: t.url,
    source: t.source || "url",
    award: t.award || null,
    score: t.score ?? null,
    awwwards: t.awwwards || null,
    tags: t.tags || [],
    capturedAt: new Date().toISOString(),
    shots: [],
    dna: {},
  };
  try {
    for (const [name, vp] of Object.entries(VIEWPORTS)) {
      const page = await browser.newPage();
      await page.setViewport(vp);
      if (name === "phone") {
        await page.setUserAgent(PHONE_UA);
      }
      await page
        .goto(t.url, { waitUntil: "networkidle2", timeout: 45000 })
        .catch((err) =>
          console.error(`warn: ${t.url} [${name}] ${err.message}; capturing what loaded`),
        );
      await sleep(2500); // preloaders and intro animations on award sites run 1-3s
      await dismissConsent(page);
      await sleep(400);

      const n = name === "desktop" ? steps : Math.min(steps, 3);
      for (let i = 0; i < n; i++) {
        const frac = n === 1 ? 0 : i / (n - 1);
        if (i > 0) await wheelTo(page, frac);
        // Gates can appear late, after a preloader finishes: check before every shot.
        await dismissConsent(page);
        const file = `${name}-${i}.jpg`;
        await page.screenshot({
          path: join(dir, file),
          type: "jpeg",
          quality: 72,
        });
        record.shots.push(file);
      }
      // Measure at the end: by now every scroll-reveal has fired once.
      await wheelTo(page, 0);
      record.dna[name] = await page.evaluate(measureDNA);
      await page.close();
    }
    if (frameMode) record.frameFlags = await captureFrames(t.url, dir);
    record.ok = true;
  } catch (err) {
    record.ok = false;
    record.error = String(err.message || err);
  }
  writeFileSync(join(dir, "dna.json"), JSON.stringify(record, null, 2));
  summary.push({
    slug,
    url: t.url,
    ok: record.ok,
    shots: record.shots.length,
    frameFlags: record.frameFlags,
    error: record.error,
  });
  console.error(
    `${record.ok ? "✓" : "✗"} ${slug} (${record.shots.length} shots)${record.error ? " — " + record.error : ""}`,
  );
}

await browser.close();
console.log(JSON.stringify({ outRoot, summary }, null, 2));
