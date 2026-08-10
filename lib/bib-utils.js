// bib-utils.js — shared BibTeX / biblatex parsing logic.
// Single source of truth for the main site AND any subdomain (e.g. playground).
// Edit this file only in the main sonntasa.github.io repo; other sites load it
// directly from here, so changes here propagate everywhere automatically.
//
// biblatex notes:
// - biblatex .bib files use the same @type{key, field = {value}} syntax as
//   classic BibTeX, so the entry/field grammar below still applies unchanged.
// - The main semantic differences handled here are: the unified `date` field
//   (ISO-ish "YYYY", "YYYY-MM", "YYYY-MM-DD", ranges "start/end", and
//   uncertainty markers like "2024?"), a handful of renamed fields
//   (journaltitle/location vs. journal/address), and "and others" author
//   lists. Both the old and new field names are kept in sync on each entry
//   so existing rendering code that reads e.g. `fields.journal` keeps working
//   even if the source .bib now uses `journaltitle`.

window.BibUtils = (function () {
  // ── biblatex field aliases ───────────────────────────────────────────
  // [biblatexName, classicBibtexName] — whichever is present gets mirrored
  // onto the other key so downstream code can read either one.
  const FIELD_ALIASES = [
    ["journaltitle", "journal"],
    ["location", "address"],
    ["urldate", "accessdate"],
    ["institution", "school"],
  ];

  // ── "Container title" group ──────────────────────────────────────────
  // journal / journaltitle / booktitle all name the thing an entry
  // appears in (journal, or conference proceedings). biblatex exporters
  // (e.g. Zotero/Better BibTeX) sometimes put a proceedings name in
  // `journaltitle` rather than `booktitle` for @inproceedings entries.
  // Whichever of these is present gets copied onto the others so
  // rendering code can read whichever name it expects.
  const CONTAINER_TITLE_FIELDS = ["journal", "journaltitle", "booktitle"];

  // ── Date parsing (biblatex EDTF-ish `date` field) ───────────────────
  // Supports "YYYY", "YYYY-MM", "YYYY-MM-DD", ranges "start/end" (the start
  // is used), and trailing uncertainty/approximation markers ("?", "~", "%").
  // Also normalizes biblatex's pseudo-month season codes (21–24) to 0, since
  // they don't map onto a calendar month.
  function parseBiblatexDate(dateStr) {
    if (!dateStr) return null;
    const start = dateStr.split("/")[0].trim();
    const clean = start.replace(/[?~%]/g, "").trim();
    const m = clean.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
    if (!m) return null;
    const year = parseInt(m[1], 10) || 0;
    let month = m[2] ? parseInt(m[2], 10) : 0;
    if (month >= 21 && month <= 24) month = 0; // spring/summer/autumn/winter
    return { year, month };
  }

  // ── Sort key ──────────────────────────────────────────────────────────
  function getSortKey(entry) {
    const fields = entry.fields;
    const inPressFields = [fields.pubstate, fields.note, fields.status, fields.keywords];
    const inPressKeywords = /in\s*press|forthcoming|accepted|in\s*preparation|under\s*review/i;
    if (inPressFields.some((f) => f && inPressKeywords.test(f))) return Infinity;

    // Prefer biblatex's unified `date` field; fall back to legacy year/month.
    let year = 0;
    let month = 0;
    const parsed = parseBiblatexDate(fields.date);
    if (parsed) {
      year = parsed.year;
      month = parsed.month;
    }
    if (!year) year = parseInt(fields.year) || 0;

    if (!month) {
      const monthNames = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
      if (fields.date && fields.date.includes("-")) {
        month = parseInt(fields.date.split("-")[1]) || 0;
      } else if (fields.month) {
        const m = fields.month.trim().toLowerCase().slice(0, 3);
        month = monthNames[m] || parseInt(fields.month) || 0;
      }
    }
    return year * 100 + month;
  }

  // ── BibTeX / biblatex parser ────────────────────────────────────────
  function parseBibTeX(bibtext) {
    const entries = [];
    const entryRegex = /@(\w+)\{([^,]+),\s*([\s\S]+?)\n\}/g;
    // Three field forms: {braced}, "quoted", and bare (e.g. `volume = 5`).
    const fieldRegex = /(\w+)\s*=\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}|(\w+)\s*=\s*"([^"]*)"|(\w+)\s*=\s*([^\s,{}][^,}]*)/g;
    let match;
    while ((match = entryRegex.exec(bibtext)) !== null) {
      const type = match[1];
      const key = match[2];
      const fieldsText = match[3];
      const fields = {};
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(fieldsText)) !== null) {
        const name = (fieldMatch[1] || fieldMatch[3] || fieldMatch[5]).toLowerCase();
        const value =
          fieldMatch[2] !== undefined ? fieldMatch[2] :
          fieldMatch[4] !== undefined ? fieldMatch[4] :
          fieldMatch[6].trim();
        fields[name] = value;
      }

      // Mirror biblatex field names onto their classic-BibTeX equivalents
      // (and vice versa) so either naming convention works downstream.
      FIELD_ALIASES.forEach(([biblatexName, bibtexName]) => {
        if (fields[biblatexName] && !fields[bibtexName]) fields[bibtexName] = fields[biblatexName];
        else if (fields[bibtexName] && !fields[biblatexName]) fields[biblatexName] = fields[bibtexName];
      });

      // Fill in the whole container-title group from whichever variant
      // is present (see CONTAINER_TITLE_FIELDS above).
      const containerValue = CONTAINER_TITLE_FIELDS.map((f) => fields[f]).find(Boolean);
      if (containerValue) {
        CONTAINER_TITLE_FIELDS.forEach((f) => {
          if (!fields[f]) fields[f] = containerValue;
        });
      }

      // If only the unified `date` field is present, derive a plain `year`
      // too, since existing rendering code may read fields.year directly.
      if (!fields.year && fields.date) {
        const d = parseBiblatexDate(fields.date);
        if (d && d.year) fields.year = String(d.year);
      }

      entries.push({ type, key, fields });
    }
    return entries;
  }

  // ── Author formatting ─────────────────────────────────────────────────
  function formatAuthorsAPA(authorString, highlightName) {
    let authors = authorString.split(" and ").map((a) => a.trim()).filter(Boolean);

    // "and others" (BibTeX/biblatex convention) marks a truncated list.
    let etAl = false;
    if (authors.length && /^others$/i.test(authors[authors.length - 1])) {
      etAl = true;
      authors = authors.slice(0, -1);
    }

    authors = authors.map((author) => {
      if (author.includes(",")) {
        const [lastName, firstName = ""] = author.split(",").map((p) => p.trim());
        const initials = firstName.split(/\s+/).map((n) => n.charAt(0).toUpperCase() + ".").join(" ");
        return `${lastName}, ${initials}`;
      } else {
        const parts = author.split(/\s+/);
        const lastName = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map((n) => n.charAt(0).toUpperCase() + ".").join(" ");
        return `${lastName}, ${initials}`;
      }
    });

    let formatted;
    if (authors.length === 0) formatted = "";
    else if (etAl) formatted = authors.join(", ");
    else if (authors.length === 1) formatted = authors[0];
    else if (authors.length === 2) formatted = authors.join(" & ");
    else formatted = authors.slice(0, -1).join(", ") + ", & " + authors[authors.length - 1];

    if (etAl) formatted += (formatted ? ", " : "") + "et al.";

    if (highlightName) {
      const lastName = highlightName.split(",")[0].trim();
      formatted = formatted.replace(new RegExp(`(${lastName},\\s*[A-Z]\\.?)`, "g"), "<strong>$1</strong>");
    }
    return formatted;
  }

  // ── Fetch + parse + sort in one call (what most consumers want) ───────
  async function fetchAndParseBib(path) {
    const response = await fetch(path);
    const bibtext = await response.text();
    const entries = parseBibTeX(bibtext);
    entries.sort((a, b) => getSortKey(b) - getSortKey(a));
    return entries;
  }

  // ── Convenience: raw "Lastname" list for an entry, excluding one name ──
  function coauthorSurnames(entry, excludeSurname) {
    const authorField = entry.fields.author || entry.fields.editor || "";
    return authorField
      .split(" and ")
      .map((a) => a.split(",")[0].trim())
      .filter((surname) => surname && surname !== excludeSurname && !/^others$/i.test(surname));
  }

  return { getSortKey, parseBibTeX, formatAuthorsAPA, fetchAndParseBib, coauthorSurnames };
})();
