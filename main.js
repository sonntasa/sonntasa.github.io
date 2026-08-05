// ── Generic entry renderer ───────────────────────────────────────────────────
function displayEntries(entries, containerId, venueFields, emptyMessage) {
  const container = document.getElementById(containerId);
  if (entries.length === 0) {
    container.innerHTML = `<p style="color: var(--text-sec); font-style: italic;">${emptyMessage}</p>`;
    return;
  }
  container.innerHTML = entries
    .map((entry) => {
      const fields = entry.fields;
      const title = fields.title || fields.shorttitle || "Untitled";

      let authors = fields.author || fields.editor || fields.editora || "Unknown authors";
      authors = BibUtils.formatAuthorsAPA(authors, "Sonntag, Samuel");

      let year = fields.year;
      if (!year && fields.date) year = fields.date.split("-")[0];

      const venue = venueFields.map((f) => fields[f]).find((v) => v) || "";
      const note = fields.note || "";

      let links = "";
      if (fields.doi) {
        links += ` <a href="https://doi.org/${fields.doi}" target="_blank"
    style="color:var(--accent-sec);text-decoration:none;border-bottom:1px solid var(--accent-sec);">[DOI]</a>`;
      }
      if (fields.url) {
        links += ` <a href="${fields.url}" target="_blank"
    style="color:var(--accent-sec);text-decoration:none;border-bottom:1px solid var(--accent-sec);">[Link]</a>`;
      }
      if (fields.pdf) {
        links += ` <a href="${fields.pdf}" target="_blank"
          style="color:var(--accent-sec);text-decoration:none;border-bottom:1px solid var(--accent-sec);">[PDF]</a>`;
      }

      const venueParts = [venue, note, year].filter(Boolean).join(", ");
      return `
  <div class="pub-item">
    <div class="pub-title">${title}</div>
    <div class="pub-authors">${authors}</div>
    <div class="pub-venue">${venueParts}${links}</div>
  </div>`;
    })
    .join("");
}

// ── Generic BibTeX loader (now delegates parsing to BibUtils) ──────────────
async function loadBib(path, containerId, venueFields, emptyMessage, errorMessage) {
  try {
    const entries = await BibUtils.fetchAndParseBib(path);
    displayEntries(entries, containerId, venueFields, emptyMessage);
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    document.getElementById(containerId).innerHTML =
      `<p style="color: var(--text-sec); font-style: italic;">${errorMessage}</p>`;
  }
}

// ── Scroll fade-in (opacity only, no scale) ──────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    } else {
      entry.target.classList.remove("visible");
    }
  });
}, { threshold: 0.1 });

// ── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {

  // ── Theme toggle ───────────────────────────────────────────────────────────
  const toggle = document.getElementById("checkbox");
  const saved = "dark";

  document.documentElement.setAttribute("data-theme", saved);
  toggle.checked = saved === "light";

  toggle.addEventListener("change", () => {
    const next = toggle.checked ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });

  // ── Fold-outs ──────────────────────────────────────────────────────────────
  document.querySelectorAll(".section-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      toggle.closest("section").classList.toggle("open");
    });
  });

  document.querySelector("#about").classList.add("open");
  document.querySelector("#publications").classList.add("open");
  document.querySelector("#presentations").classList.add("open");
  document.querySelector("#playground").classList.add("open");

  // ── BibTeX ─────────────────────────────────────────────────────────────────
  loadBib(
    "./lib/publications.bib",
    "publications-list",
    ["journaltitle", "booktitle", "venue", "publisher", "howpublished"],
    "No publications found in the BibTeX file.",
    "Publications file not found. Please add a publications.bib file to your repository.",
  );
  loadBib(
    "./lib/presentations.bib",
    "presentations-list",
    ["howpublished", "booktitle", "venue", "publisher"],
    "No presentations found in the BibTeX file.",
    "Presentations file not found. Please add a presentations.bib file to your repository.",
  );
  loadBib(
    "./lib/data.bib",
    "data-list",
    ["howpublished", "url", "publisher", "booktitle", "venue"],
    "No datasets or software found in the BibTeX file.",
    "Data file not found. Please add a data.bib file to your repository.",
  );

  // ── Scroll observer ────────────────────────────────────────────────────────
  document.querySelectorAll("section").forEach((el) => {
    el.classList.add("fade-in-section");
    observer.observe(el);
  });
});
