// bib-utils.js — shared BibTeX parsing logic.
// Single source of truth for the main site AND any subdomain (e.g. playground).
// Edit this file only in the main sonntasa.github.io repo; other sites load it
// directly from here, so changes here propagate everywhere automatically.

window.BibUtils = (function () {
  // ── Sort key ──────────────────────────────────────────────────────────
  function getSortKey(entry) {
    const fields = entry.fields;
    const inPressFields = [fields.pubstate, fields.note, fields.status, fields.keywords];
    const inPressKeywords = /in\s*press|forthcoming|accepted|in\s*preparation|under\s*review/i;
    if (inPressFields.some((f) => f && inPressKeywords.test(f))) return Infinity;

    let year = parseInt(fields.year) || 0;
    if (!year && fields.date) year = parseInt(fields.date.split("-")[0]) || 0;

    const monthNames = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    let month = 0;
    if (fields.date && fields.date.includes("-")) {
      month = parseInt(fields.date.split("-")[1]) || 0;
    } else if (fields.month) {
      const m = fields.month.trim().toLowerCase().slice(0, 3);
      month = monthNames[m] || parseInt(fields.month) || 0;
    }
    return year * 100 + month;
  }

  // ── BibTeX parser ─────────────────────────────────────────────────────
  function parseBibTeX(bibtext) {
    const entries = [];
    const entryRegex = /@(\w+)\{([^,]+),\s*([\s\S]+?)\n\}/g;
    let match;
    while ((match = entryRegex.exec(bibtext)) !== null) {
      const type = match[1];
      const key = match[2];
      const fieldsText = match[3];
      const fields = {};
      const fieldRegex = /(\w+)\s*=\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}|(\w+)\s*=\s*"([^"]*)"/g;
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(fieldsText)) !== null) {
        fields[(fieldMatch[1] || fieldMatch[3]).toLowerCase()] = fieldMatch[2] || fieldMatch[4];
      }
      entries.push({ type, key, fields });
    }
    return entries;
  }

  // ── Author formatting ─────────────────────────────────────────────────
  function formatAuthorsAPA(authorString, highlightName) {
    let authors = authorString.split(" and ").map((a) => a.trim());
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
    if (authors.length === 1) formatted = authors[0];
    else if (authors.length === 2) formatted = authors.join(" & ");
    else formatted = authors.slice(0, -1).join(", ") + ", & " + authors[authors.length - 1];

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
      .filter((surname) => surname && surname !== excludeSurname);
  }

  return { getSortKey, parseBibTeX, formatAuthorsAPA, fetchAndParseBib, coauthorSurnames };
})();
