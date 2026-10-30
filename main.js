// ── Entry renderer ──────────────────────────────────────────────────────────
function displayEntries(entries, containerId, venueFields, emptyMessage) {
  const container = document.getElementById(containerId);
  if (entries.length === 0) {
    container.innerHTML = `<p class="empty">${emptyMessage}</p>`;
    return;
  }

  const rows = entries.map((entry) => {
    const f = entry.fields;
    let year = f.year || (f.date ? f.date.split("-")[0] : "");
    let authors = f.author || f.editor || f.editora || "Unknown authors";
    authors = BibUtils.formatAuthorsAPA(authors, "Sonntag, Samuel");
    return { f, year, authors };
  });

  // newest first; entries without a year go last
  rows.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

  container.innerHTML = rows
    .map(({ f, year, authors }) => {
      const title = f.title || f.shorttitle || "Untitled";
      const venue = venueFields.map((k) => f[k]).find(Boolean) || "";
      const venueText = [venue, f.note].filter(Boolean).join(", ");
      const link = (href, label) =>
        `<a class="pub-link" href="${href}" target="_blank" rel="noopener">${label}</a>`;
      const links =
        (f.doi ? link(`https://doi.org/${f.doi}`, "DOI") : "") +
        (f.url ? link(f.url, "Link") : "") +
        (f.pdf ? link(f.pdf, "PDF") : "");
      return `
  <div class="pub-item">
    <div class="pub-year">${year}</div>
    <div>
      <div class="pub-title">${title}</div>
      <div class="pub-authors">${authors}</div>
      <div class="pub-venue">${venueText}${links}</div>
    </div>
  </div>`;
    })
    .join("");
}

async function loadBib(path, containerId, venueFields, emptyMessage, errorMessage) {
  try {
    const entries = await BibUtils.fetchAndParseBib(path);
    displayEntries(entries, containerId, venueFields, emptyMessage);
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    document.getElementById(containerId).innerHTML = `<p class="empty">${errorMessage}</p>`;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // ── Theme toggle (theme itself is set in <head> before paint) ──
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  // ── BibTeX ──
  loadBib("./lib/publications.bib", "publications-list",
    ["journaltitle", "booktitle", "venue", "publisher", "howpublished"],
    "No publications found.", "Publications file not found.");
  loadBib("./lib/presentations.bib", "presentations-list",
    ["howpublished", "booktitle", "venue", "publisher"],
    "No presentations found.", "Presentations file not found.");
  loadBib("./lib/data.bib", "data-list",
    ["howpublished", "url", "publisher", "booktitle", "venue"],
    "No datasets or software found.", "Data file not found.");
});
