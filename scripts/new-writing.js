#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataFile = path.join(root, "writing-data.js");
const writingDir = path.join(root, "writing");

function usage() {
  console.log(
    [
      "Usage:",
      '  npm run new:post -- "Post Title" --date=YYYY-MM-DD --deck="Short summary" --excerpt="Archive preview" --read-time="4 min read" [--featured]',
      "",
      "Example:",
      '  npm run new:post -- "A Better Default" --date=2026-04-24 --deck="A short one-line summary." --excerpt="A slightly longer preview for the archive and homepage." --read-time="4 min read"'
    ].join("\n")
  );
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeJs(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

function formatLongDate(dateString) {
  const date = new Date(`${dateString}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(args.length ? 0 : 1);
  }

  const options = {
    featured: false
  };
  const positionals = [];

  args.forEach((arg) => {
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      return;
    }
    if (arg === "--featured") {
      options.featured = true;
      return;
    }
    const eq = arg.indexOf("=");
    const key = arg.slice(2, eq > -1 ? eq : undefined);
    const value = eq > -1 ? arg.slice(eq + 1) : "";
    options[key] = value;
  });

  options.title = positionals.join(" ").trim();
  return options;
}

function buildPostHtml({ title, deck, date, readTime }) {
  const safeTitle = escapeHtml(title);
  const safeDeck = escapeHtml(deck);
  const longDate = escapeHtml(formatLongDate(date));
  const safeReadTime = escapeHtml(readTime);
  const slug = slugify(title);
  const canonical = `https://maevinlabs.com/writing/${slug}.html`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} — Maevin Labs</title>
  <meta name="description" content="${safeDeck}" />
  <meta property="og:title" content="${safeTitle} — Maevin Labs" />
  <meta property="og:description" content="${safeDeck}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="https://maevinlabs.com/assets/Logo_blue.png" />
  <meta property="article:published_time" content="${escapeHtml(date)}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${safeTitle} — Maevin Labs" />
  <meta name="twitter:description" content="${safeDeck}" />
  <meta name="twitter:image" content="https://maevinlabs.com/assets/Logo_blue.png" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" type="image/png" href="/assets/Logo_blue.png" />
  <style>
    :root {
      --bg: #fcfcfb;
      --text: #0f172a;
      --muted: rgba(15,23,42,0.72);
      --soft: rgba(15,23,42,0.54);
      --accent: #60a5fa;
      --line: rgba(15,23,42,0.08);
    }
    html, body { height: 100%; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at 16% 8%, rgba(96,165,250,.08), transparent 24%),
        linear-gradient(180deg, #fcfcfb 0%, #f8f8f7 22%, var(--bg) 52%, var(--bg) 100%);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    a { color: inherit; text-decoration: none; }
    .wrap { max-width: 1120px; margin: 0 auto; padding: 0 20px 48px; }
    .article-shell { max-width: 760px; margin: 0 auto; padding-top: 18px; }
    .article-head { padding: clamp(42px, 7vw, 92px) 0 28px; border-bottom: 1px solid var(--line); display: grid; gap: 18px; }
    .crumb { font-size: 13px; letter-spacing: .16em; text-transform: uppercase; color: var(--accent); }
    .article-head h1 { margin: 0; font-size: clamp(42px, 7vw, 76px); line-height: .96; letter-spacing: -.05em; }
    .deck { margin: 0; color: var(--muted); font-size: 20px; line-height: 1.7; max-width: 40rem; }
    .meta { display: flex; flex-wrap: wrap; gap: 10px; color: var(--soft); font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
    article { padding: 36px 0 0; font-size: 19px; line-height: 1.9; color: rgba(15,23,42,0.92); }
    article p { margin: 0 0 24px; }
    article h2 { margin: 44px 0 14px; font-size: 26px; line-height: 1.15; letter-spacing: -.03em; }
    .back-link { display: inline-flex; align-items: center; gap: 10px; margin-top: 42px; color: var(--accent); font-weight: 600; font-size: 15px; }
    .post-nav { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 16px; align-items: start; margin-top: 46px; padding-top: 24px; border-top: 1px solid var(--line); }
    .post-nav-link, .post-nav-home { display: grid; gap: 6px; }
    .post-nav-home { align-self: center; color: var(--accent); font-weight: 600; font-size: 15px; text-align: center; }
    .post-nav-link.next { justify-items: end; text-align: right; }
    .post-nav-link.is-empty { visibility: hidden; }
    .post-nav-kicker { color: var(--soft); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; }
    .post-nav-title { color: var(--text); font-size: 15px; line-height: 1.5; }
    footer { margin: 90px 0 16px; text-align: center; color: var(--soft); font-size: 14px; }
    @media (max-width: 560px) {
      .wrap { padding: 0 16px 42px; }
      .article-head { padding: 34px 0 24px; }
      .deck { font-size: 18px; }
      article { font-size: 18px; }
      .post-nav { grid-template-columns: 1fr; }
      .post-nav-link.next { justify-items: start; text-align: left; }
      .post-nav-home { text-align: left; }
    }
  </style>
</head>
<body data-post-slug="${escapeHtml(slug)}">
  <div class="wrap">
    <div id="site-header"></div>
    <script>
      (async () => {
        try {
          const r = await fetch('/header.html', { cache: 'no-cache' });
          const html = await r.text();
          const mount = document.getElementById('site-header');
          if (mount) mount.outerHTML = html;
        } catch (_) {}
      })();
    </script>

    <main class="article-shell">
      <header class="article-head">
        <a class="crumb" href="/writings.html">Writing</a>
        <h1>${safeTitle}</h1>
        <p class="deck">${safeDeck}</p>
        <div class="meta">
          <span>${longDate}</span>
          <span>${safeReadTime}</span>
        </div>
      </header>

      <article>
        <p>Start here.</p>

        <p>Replace this section with the body of your post. Keep the copy direct, readable, and spaced enough to breathe.</p>

        <h2>A useful subhead</h2>

        <p>Use subheads when the writing benefits from a shift in thought, not just because the page looks empty.</p>

        <p>When the post is ready, keep the ending clean and link the reader back to the archive.</p>
      </article>

      <nav class="post-nav" id="post-nav" aria-label="Post navigation">
        <a class="post-nav-link is-empty prev" aria-hidden="true"></a>
        <a class="post-nav-home" href="/writings.html">Back to writing</a>
        <a class="post-nav-link is-empty next" aria-hidden="true"></a>
      </nav>
    </main>

    <div id="site-footer"></div>
    <script>
      (async () => {
        try {
          const r = await fetch('/footer.html', { cache: 'no-cache' });
          const html = await r.text();
          const mount = document.getElementById('site-footer');
          if (mount) mount.outerHTML = html;
        } catch (_) {}
      })();
    </script>
  </div>
  <script src="/writing-data.js"></script>
  <script src="/writing-post-nav.js"></script>
</body>
</html>
`;
}

function buildEntry({ slug, title, date, deck, excerpt, readTime, featured }) {
  return `  {
    slug: "${escapeJs(slug)}",
    title: "${escapeJs(title)}",
    date: "${escapeJs(date)}",
    deck: "${escapeJs(deck)}",
    excerpt: "${escapeJs(excerpt)}",
    tags: [],
    readTime: "${escapeJs(readTime)}",
    featured: ${featured ? "true" : "false"},
    href: "/writing/${escapeJs(slug)}.html"
  },\n`;
}

function main() {
  const options = parseArgs(process.argv);
  const title = options.title;
  const date = options.date || new Date().toISOString().slice(0, 10);
  const deck = options.deck || "Add a short one-line summary.";
  const excerpt = options.excerpt || deck;
  const readTime = options["read-time"] || options.readTime || "4 min read";
  const featured = Boolean(options.featured);

  if (!title) {
    console.error("Missing post title.\n");
    usage();
    process.exit(1);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('Date must be in YYYY-MM-DD format.');
    process.exit(1);
  }

  const slug = slugify(title);
  if (!slug) {
    console.error("Could not derive a valid slug from that title.");
    process.exit(1);
  }

  const postPath = path.join(writingDir, `${slug}.html`);
  if (fs.existsSync(postPath)) {
    console.error(`Post file already exists: ${postPath}`);
    process.exit(1);
  }

  const data = fs.readFileSync(dataFile, "utf8");
  if (data.includes(`slug: "${slug}"`)) {
    console.error(`Post slug already exists in writing-data.js: ${slug}`);
    process.exit(1);
  }

  let updatedData = data;
  if (featured) {
    updatedData = updatedData.replace(/featured:\s*true/g, "featured: false");
  }

  const marker = "window.MAEVIN_WRITING = [\n";
  if (!updatedData.includes(marker)) {
    console.error("Could not find writing array in writing-data.js");
    process.exit(1);
  }

  updatedData = updatedData.replace(
    marker,
    marker + buildEntry({ slug, title, date, deck, excerpt, readTime, featured })
  );

  fs.writeFileSync(postPath, buildPostHtml({ title, deck, date, readTime }), "utf8");
  fs.writeFileSync(dataFile, updatedData, "utf8");

  console.log(`Created ${path.relative(root, postPath)}`);
  console.log(`Updated ${path.relative(root, dataFile)}`);
  console.log("");
  console.log("Next:");
  console.log(`- open ${path.relative(root, postPath)}`);
  console.log("- replace the placeholder body copy");
  console.log("- refresh /writings.html and the homepage");
}

main();
