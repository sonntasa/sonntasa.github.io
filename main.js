// ── BibTeX → entries ────────────────────────────────────────────────────────
const LINKS = [["pdf", "pdf"], ["preprint", "preprint"], ["code", "code"], ["cran", "cran"], ["docs", "docs"], ["manual", "manual"], ["esm", "esm"], ["doi", "doi"], ["url", "link"]];
const hrefOf = (k, v) => (k === "doi" && !/^http/.test(v) ? "https://doi.org/" + v : v);
const yearOf = (f) => f.year || (f.date ? f.date.split("-")[0] : "");

const clean = (s) => String(s || "").replace(/[{}]/g, "").replace(/\s+/g, " ").trim(); // drop BibTeX braces / stray newlines

function item(e, n, venueFields) {
  const f = e.fields;
  const authors = BibUtils.formatAuthorsAPA(f.author || f.editor || f.editora || "Unknown authors", "Sonntag, Samuel");
  const note = /\b(ISSN|Pages|Section):/.test(f.note || "") ? "" : f.note; // ignore Zotero metadata notes
  const first = venueFields.map((k) => f[k]).find(Boolean) || "";
  const firstIsUrl = /^https?:\/\/\S+$/.test(first);
  const venue = [firstIsUrl ? "" : first, note, yearOf(f)].filter(Boolean).join(", ");
  // hide `url` only when it is just the doi.org address of the same doi
  const urlIsDoi = f.url && f.doi && /^https?:\/\/(dx\.)?doi\.org\//i.test(f.url) &&
    f.url.toLowerCase().includes(f.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").toLowerCase());
  const links = LINKS.filter(([k]) => f[k] && !(k === "url" && urlIsDoi))
    .map(([k, label]) => `<a href="${hrefOf(k, f[k])}" target="_blank" rel="noopener">&rarr; ${label}</a>`).join("") +
    (firstIsUrl && !f.url ? `<a href="${first}" target="_blank" rel="noopener">&rarr; link</a>` : "");
  return `<article class="pub"><div class="num">${n ? `[${n}]` : ""}</div><div>
    <h3>${clean(f.title || f.shorttitle) || "Untitled"}</h3><p class="au">${clean(authors)}</p>
    <p class="ve">${clean(venue)}</p>${links ? `<p class="lk">${links}</p>` : ""}</div></article>`;
}

const byYear = (a, b) => (parseInt(yearOf(b.fields)) || 0) - (parseInt(yearOf(a.fields)) || 0);
const isWorking = (e) => e.type === "unpublished" || /under review|in preparation|preprint/i.test(e.fields.note || "");

function list(entries, id, venueFields, { numbered = false, groups = false, empty }) {
  const el = document.getElementById(id);
  if (!entries.length) { el.innerHTML = `<p class="loading">${empty}</p>`; return; }
  const sorted = [...entries].sort(byYear);
  const block = (arr) => arr.map((e, i) => item(e, numbered ? arr.length - i : 0, venueFields)).join("");
  if (!groups) { el.innerHTML = block(sorted); return; }
  if (groups === "kind") {            // software vs. datasets; headings appear only if both exist
    const sw = sorted.filter((e) => e.type.toLowerCase() === "software");
    const ds = sorted.filter((e) => e.type.toLowerCase() !== "software");
    const both = sw.length && ds.length;
    el.innerHTML = (sw.length ? (both ? `<p class="group">Software</p>` : "") + block(sw) : "") +
                   (ds.length ? (both ? `<p class="group">Datasets</p>` : "") + block(ds) : "");
    const label = both ? "Software & datasets" : sw.length ? "Software" : "Datasets";
    const h2 = el.closest("section").querySelector("h2");
    if (h2) h2.textContent = label;
    const nav = document.querySelector('.index a[href="#data"]');
    if (nav) nav.lastChild.textContent = label;
    return;
  }
  const work = sorted.filter(isWorking), done = sorted.filter((e) => !isWorking(e));
  el.innerHTML = (done.length ? `<p class="group">Peer-reviewed articles</p>${block(done)}` : "") +
                 (work.length ? `<p class="group">Working papers</p>${block(work)}` : "");
}

async function loadBib(path, id, venueFields, opts) {
  try {
    const entries = await BibUtils.fetchAndParseBib(path);
    list(entries, id, venueFields, opts);
    return entries;
  } catch (err) {
    console.error(`Error loading ${path}:`, err);
    document.getElementById(id).innerHTML = `<p class="loading">${opts.error}</p>`;
    return [];
  }
}

// Selected papers: entries with `selected = {true}` and a local `pdf = {files/<name>.pdf}`.
// Page 1 is drawn from the PDF in the browser (pdf.js). Optional per entry:
//   previewpage = {2}            use another page (e.g. if page 1 is a cover sheet)
//   preview = {images/x.png}     use a ready-made image instead
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}
const THUMB_W = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--card-w")) || 150; // set in style.css

async function renderThumb(c) {
  try {
    const doc = await pdfjsLib.getDocument(c.dataset.pdf).promise;
    const page = await doc.getPage(+c.dataset.page);
    const base = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: (THUMB_W * Math.max(window.devicePixelRatio || 1, 2)) / base.width });
    c.width = vp.width; c.height = vp.height;
    await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
    doc.destroy();
  } catch (err) {
    console.warn("No thumbnail for", c.dataset.pdf, err);
    c.closest(".card").remove();
    if (!document.querySelector("#strip .card")) document.getElementById("selected").hidden = true;
  }
}

function selected(entries) {
  const sel = entries.filter((e) => e.fields.preview || (e.fields.selected && e.fields.pdf)).sort(byYear);
  if (!sel.length) return;
  const strip = document.getElementById("strip");
  strip.innerHTML = sel.map((e) => {
    const f = e.fields, k = LINKS.find(([key]) => f[key]);
    const href = k ? hrefOf(k[0], f[k[0]]) : "#publications";
    const title = (f.title || "").replace(/"/g, "&quot;");
    const media = f.preview
      ? `<img src="${f.preview}" alt="${title}" loading="lazy" />`
      : `<canvas data-pdf="${f.pdf}" data-page="${f.previewpage || 1}" role="img" aria-label="${title}"></canvas>`;
    return `<a class="card" href="${href}" target="_blank" rel="noopener">${media}</a>`;
  }).join("");
  document.getElementById("selected").hidden = false;

  document.querySelectorAll(".arrow").forEach((b) => b.addEventListener("click", () => {
    strip.scrollBy({ left: +b.dataset.dir * strip.clientWidth * 0.8, behavior: "smooth" });
  }));

  // render only when a card is about to scroll into view
  const canvases = strip.querySelectorAll("canvas[data-pdf]");
  if (!window.pdfjsLib) { canvases.forEach((c) => c.closest(".card").remove()); return; }
  const io = new IntersectionObserver((es, o) => es.forEach((en) => {
    if (en.isIntersecting) { o.unobserve(en.target); renderThumb(en.target); }
  }), { root: strip, rootMargin: "0px 300px" });
  canvases.forEach((c) => io.observe(c));
}

// ── CV viewer (pdf.js) ──────────────────────────────────────────────────────
function initCV() {
  const box = document.getElementById("cv-viewer");
  if (!box) return; // CV section is optional
  const stage = box.querySelector(".vstage");
  const canvas = document.getElementById("cv-canvas");
  const label = document.getElementById("cv-page");
  const prev = document.getElementById("cv-prev"), next = document.getElementById("cv-next");
  if (!window.pdfjsLib) { stage.innerHTML = `<p class="loading">Preview unavailable. Use the download link.</p>`; return; }
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  let doc, n = 1, timer;

  async function show() {
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const css = Math.min((stage.clientWidth - 56) / base.width, 1.5);
    const dpr = window.devicePixelRatio || 1;
    const vp = page.getViewport({ scale: css * dpr });
    canvas.width = vp.width; canvas.height = vp.height;
    canvas.style.width = base.width * css + "px";
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    label.textContent = `${n} / ${doc.numPages}`;
    prev.disabled = n === 1; next.disabled = n === doc.numPages;
  }

  pdfjsLib.getDocument(box.dataset.src).promise.then((d) => { doc = d; return show(); })
    .catch(() => { stage.innerHTML = `<p class="loading">Preview unavailable. Use the download link.</p>`; });
  prev.addEventListener("click", () => { if (n > 1) { n--; show(); } });
  next.addEventListener("click", () => { if (doc && n < doc.numPages) { n++; show(); } });
  window.addEventListener("resize", () => { clearTimeout(timer); timer = setTimeout(() => doc && show(), 200); });
}

// ── "last updated": date of the newest commit in the site's GitHub repo ─────
// Falls back to the date written in index.html if the request fails.
const SITE_REPO = "sonntasa/sonntasa.github.io"; // <- change if your site lives in another repo

async function lastUpdated() {
  const el = document.querySelector(".upd time");
  if (!el) return;
  const show = (iso) => { el.textContent = iso; el.setAttribute("datetime", iso); };
  try {
    const cached = sessionStorage.getItem("lastUpdated");
    if (cached) return show(cached);
    const r = await fetch(`https://api.github.com/repos/${SITE_REPO}/commits?per_page=1`);
    if (!r.ok) throw new Error(r.status);
    const [latest] = await r.json();
    const iso = new Date(latest.commit.committer.date).toLocaleDateString("sv-SE"); // YYYY-MM-DD, local time
    sessionStorage.setItem("lastUpdated", iso);
    show(iso);
  } catch (err) {
    console.warn("last-updated lookup failed, keeping the date in index.html", err);
  }
}

// ── Init ────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  // highlight current section in the index
  const links = [...document.querySelectorAll(".index a")];
  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-30% 0px -60% 0px" });
  document.querySelectorAll("main section").forEach((s) => io.observe(s));
  // the last section is short, so mark it active once the page is scrolled to the bottom
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4)
      links.forEach((a, i) => a.classList.toggle("on", i === links.length - 1));
  }, { passive: true });

  initCV();
  lastUpdated();

  loadBib("./lib/presentations.bib", "presentations-list", ["howpublished", "booktitle", "venue", "publisher"],
    { empty: "No presentations found.", error: "Presentations file not found." });
  loadBib("./lib/data.bib", "data-list", ["howpublished", "publisher", "booktitle", "venue"],
    { groups: "kind", empty: "No software or datasets found.", error: "Data file not found." });
  const pubs = await loadBib("./lib/publications.bib", "publications-list",
    ["journaltitle", "booktitle", "venue", "publisher", "howpublished"],
    { numbered: true, groups: true, empty: "No publications found.", error: "Publications file not found." });
  selected(pubs);
});
