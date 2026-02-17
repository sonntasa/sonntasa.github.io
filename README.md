# Personal CV Website

A clean, minimal single-page CV with warm earth tones and BibTeX support.

## Setup

1. **Fork or clone this repository**

2. **Add your profile picture**

   - Add an image file named `profile.jpg` to the repository
   - Recommended size: at least 400x400 pixels (square)
   - Supported formats: `.jpg`, `.jpeg`, `.png` (just update `src="profile.jpg"` in index.html if using a different name)

3. **Edit `index.html`**

   - Replace "Your Name" with your actual name
   - Update the tagline and about section
   - Add your contact information (email, GitHub, Google Scholar links)
   - Update the education section with your degrees

4. **Update `publications.bib`**
   - Replace the example entries with your own publications
   - The BibTeX format supports:
     - `@article` for journal papers
     - `@inproceedings` for conference papers
     - `@book` for books
     - `@phdthesis` or `@mastersthesis` for theses
5. **Enable GitHub Pages**
   - Go to your repository Settings
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select the branch (usually `main` or `master`)
   - Click "Save"
   - Your site will be available at `https://yourusername.github.io/repository-name/`

## Customization

### Colors

The color scheme uses CSS variables defined at the top of `index.html`. You can easily customize:

Original colorscheme:

```css
:root {
  --background: #ead2ac; /* sand; Background light tone */
  --back-alt: #e6b89c; /* warm-stone; Background variation */
  --accent-prime: #c17b5c; /* terracotta; * Primary accent */
  --text-sec: #8b6f47; /* deep-earth; Secondary text */
  --text-main: #3d3834; /* charcoal; * Main text */
  --accent-sec: #a85c3a; /* accent-rust Links and highlights */
}
```

Playful:

```css
:root {
  --background: #f5f1e8;
  --back-alt: #e8dfd0;
  --accent-prime: #fe938c;
  --text-sec: #5c3650;
  --text-main: #2e2a24;
  --accent-sec: #d4878a;
}
```

### Fonts

The CV uses:

- ~Crimson Pro~ for headings (serif)
- ~IBM Plex Sans~ for body text (sans-serif)
- Alan Sans (nice rounded font) at different weights for headings & body

You can change these in the Google Fonts link and CSS `font-family` declarations.

### Sections

To add or remove sections:

1. Copy an existing `<section>` block
2. Update the `id` and content
3. Adjust the animation delay if needed

## BibTeX Support

The CV automatically parses your `publications.bib` file and displays publications sorted by year (newest first).

Supported BibTeX fields:

- `title` - Publication title
- `author` - Authors (comma-separated)
- `year` - Publication year
- `journal` - Journal name (for articles)
- `booktitle` - Conference/book title (for proceedings)
- `venue` - Alternative venue field

## License

Feel free to use this template for your own CV!
