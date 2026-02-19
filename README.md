# Personal CV Website

~https://sonntasa.github.io~ -> www.samuel-sonntag.de

A clean, minimal single-page CV with warm earth tones and BibTeX support.

A blank version of this CV is available in the "template" branch of this repo.
Be aware that that version might not be up-to-date in every functionality the main branch holds.

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

UPDATE: The original colors have gone, Dark mode is here now.

#### Playful:

Light:

```css
--background: #f8f6f6;
--back-alt: #ede8e8;
--accent-prime: #d63a65;
--text-sec: #6b4f4f;
--text-main: #1a1515;
--accent-sec: #3b82f6;
```

Dark:

```css
--background: #1a1520;
--back-alt: #231d2c;
--accent-prime: #f06090;
--text-sec: #a89ab8;
--text-main: #ede8f5;
--accent-sec: #60a5fa;
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
This template was generated with the help of Claude.
