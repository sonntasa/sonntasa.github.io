// ── Sort key ────────────────────────────────────────────────────────────────
function getSortKey(entry) {
  const fields = entry.fields;
  const inPressFields = [
    fields.pubstate,
    fields.note,
    fields.status,
    fields.keywords,
  ];
  const inPressKeywords =
    /in\s*press|forthcoming|accepted|in\s*preparation|under\s*review/i;
  if (inPressFields.some((f) => f && inPressKeywords.test(f)))
    return Infinity;

  let year = parseInt(fields.year) || 0;
  if (!year && fields.date)
    year = parseInt(fields.date.split("-")[0]) || 0;

  const monthNames = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };
  let month = 0;
  if (fields.date && fields.date.includes("-")) {
    month = parseInt(fields.date.split("-")[1]) || 0;
  } else if (fields.month) {
    const m = fields.month.trim().toLowerCase().slice(0, 3);
    month = monthNames[m] || parseInt(fields.month) || 0;
  }
  return year * 100 + month;
}

// ── BibTeX parser ────────────────────────────────────────────────────────────
function parseBibTeX(bibtext) {
  const entries = [];
  const entryRegex = /@(\w+)\{([^,]+),\s*([\s\S]+?)\n\}/g;
  let match;
  while ((match = entryRegex.exec(bibtext)) !== null) {
    const type = match[1];
    const key = match[2];
    const fieldsText = match[3];
    const fields = {};
    const fieldRegex =
      /(\w+)\s*=\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}|(\w+)\s*=\s*"([^"]*)"/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(fieldsText)) !== null) {
      fields[(fieldMatch[1] || fieldMatch[3]).toLowerCase()] =
        fieldMatch[2] || fieldMatch[4];
    }
    entries.push({type, key, fields});
  }
  return entries;
}

// ── Author formatting ────────────────────────────────────────────────────────
function formatAuthorsAPA(authorString, highlightName) {
  let authors = authorString.split(" and ").map((a) => a.trim());
  authors = authors.map((author) => {
    if (author.includes(",")) {
      const [lastName, firstName = ""] = author
        .split(",")
        .map((p) => p.trim());
      const initials = firstName
        .split(/\s+/)
        .map((n) => n.charAt(0).toUpperCase() + ".")
        .join(" ");
      return `${lastName}, ${initials}`;
    } else {
      const parts = author.split(/\s+/);
      const lastName = parts[parts.length - 1];
      const initials = parts
        .slice(0, -1)
        .map((n) => n.charAt(0).toUpperCase() + ".")
        .join(" ");
      return `${lastName}, ${initials}`;
    }
  });

  let formatted;
  if (authors.length === 1) formatted = authors[0];
  else if (authors.length === 2) formatted = authors.join(" & ");
  else
    formatted =
      authors.slice(0, -1).join(", ") +
      ", & " +
      authors[authors.length - 1];

  if (highlightName) {
    const lastName = highlightName.split(",")[0].trim();
    formatted = formatted.replace(
      new RegExp(`(${lastName},\\s*[A-Z]\\.?)`, "g"),
      "<strong>$1</strong>",
    );
  }
  return formatted;
}

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

      let authors =
        fields.author ||
        fields.editor ||
        fields.editora ||
        "Unknown authors";
      authors = formatAuthorsAPA(authors, "Sonntag, Samuel");

      let year = fields.year;
      if (!year && fields.date) year = fields.date.split("-")[0];

      const venue =
        venueFields.map((f) => fields[f]).find((v) => v) || "";
      const note = fields.note || "";

      let links = "";
      if (fields.doi) {
        links += ` <a href="https://doi.org/${fields.doi}" target="_blank"
    style="color:var(--accent-sec);text-decoration:none;border-bottom:1px solid var(--accent-sec);">[DOI]</a>`;
      }
      if (fields.url && !fields.doi) {
        links += ` <a href="${fields.url}" target="_blank"
    style="color:var(--accent-sec);text-decoration:none;border-bottom:1px solid var(--accent-sec);">[Link]</a>`;
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

// ── Generic BibTeX loader ────────────────────────────────────────────────────
async function loadBib(
  path,
  containerId,
  venueFields,
  emptyMessage,
  errorMessage,
) {
  try {
    const response = await fetch(path);
    const bibtext = await response.text();
    const entries = parseBibTeX(bibtext);
    entries.sort((a, b) => getSortKey(b) - getSortKey(a));
    displayEntries(entries, containerId, venueFields, emptyMessage);
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    document.getElementById(containerId).innerHTML =
      `<p style="color: var(--text-sec); font-style: italic;">${errorMessage}</p>`;
  }
}

// ── Scroll animations ────────────────────────────────────────────────────────
const observerOptions = {
  threshold: [0, 0.5, 1],
  rootMargin: "0px",
};
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      const rect = entry.target.getBoundingClientRect();
      const sectionMiddle = rect.top + rect.height / 2;
      const viewportMiddle = window.innerHeight / 2;
      if (
        Math.abs(sectionMiddle - viewportMiddle) <
        window.innerHeight / 3
      ) {
        entry.target.classList.add("active-section");
      } else {
        entry.target.classList.remove("active-section");
      }
    } else {
      entry.target.classList.remove("visible", "active-section");
    }
  });
}, observerOptions);

window.addEventListener("scroll", () => {
  document.querySelectorAll("section, header").forEach((section) => {
    const rect = section.getBoundingClientRect();
    const sectionMiddle = rect.top + rect.height / 2;
    const viewportMiddle = window.innerHeight / 2;
    if (
      Math.abs(sectionMiddle - viewportMiddle) <
      window.innerHeight / 3
    ) {
      section.classList.add("active-section");
    } else {
      section.classList.remove("active-section");
    }
  });
});

// ── Theme toggle ─────────────────────────────────────────────────────────────
const toggle = document.getElementById("theme-toggle");
const icon = document.getElementById("theme-icon");
const saved =
  localStorage.getItem("theme") ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light");

document.documentElement.setAttribute("data-theme", saved);
icon.textContent = saved === "dark" ? "☀️" : "🌙";

toggle.addEventListener("click", () => {
  const next =
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "light"
      : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  icon.textContent = next === "dark" ? "☀️" : "🌙";
});

// ── Fold ─────────────────────────────────────────────────────────────────────
document.querySelectorAll(".section-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    toggle.closest("section").classList.toggle("open");
  });
});

// ── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  loadBib(
    "./lib/publications.bib",
    "publications-list",
    ["journal", "booktitle", "venue", "publisher", "howpublished"],
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

  document.querySelectorAll("section, header").forEach((section) => {
    section.classList.add("fade-in-section");
    observer.observe(section);
  });
});
