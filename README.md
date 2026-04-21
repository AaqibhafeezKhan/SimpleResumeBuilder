# Simple Resume Builder

A feature-rich, browser-based resume builder with drag-and-drop layout construction, live inline editing, multiple design templates, and instant PDF export. No backend, no build step, no dependencies — it runs entirely in the browser.

Live at: https://aaqibhafeezkhan.github.io/SimpleResumeBuilder/

---

## Suggested Repository Description

> A drag-and-drop resume builder with multiple templates, live inline editing, skill tag management, photo upload, color themes, font controls, and PDF export — built with pure HTML, CSS, and JavaScript.

## Suggested Topics

`resume-builder` `drag-and-drop` `vanilla-javascript` `pdf-export` `frontend` `github-pages` `html5` `css3` `no-framework` `open-source`

---

## Features

**Layout and Templates**
- Four distinct resume templates: Modern, Classic, Minimal, and Bold
- Drag sections from the panel onto the resume canvas in any order
- Drag sections within the document to reorder them
- Move sections up and down using the per-section toolbar

**Customization**
- Six accent color themes applied across the entire document
- Four font families: Inter, Outfit, Lora, and Playfair Display
- Three font size options: Small, Medium, Large
- Adjustable line spacing via a range slider

**Section Types**
All eight section types support inline editing by clicking directly on any text field:

- Header — name, professional title, contact information, and optional profile photo upload
- Professional Summary — freeform paragraph
- Work Experience — multiple entries, each with organization, role, date range, location, and bullet points
- Education — multiple entries with the same structure
- Skills — categorized skill tags; type a skill and press Enter to add, click to remove
- Projects — same entry structure as experience
- Certifications — each with name, issuing organization, and year
- Languages — displayed in a grid with proficiency levels

**Editing**
- Every text field is inline-editable by clicking on it
- Press Enter inside a bullet point to create a new one; Backspace on an empty bullet removes it
- Add additional work positions, degrees, projects, certifications, or languages within any section
- Remove individual entries without deleting the whole section
- Add and remove skill categories dynamically

**Data Persistence**
- Auto-saves to browser localStorage approximately one second after any change
- Restores the full document, settings, and uploaded photo on next visit
- Profile photo is stored as a base64 data URL inline

**Export**
- Export to PDF using the browser print dialog, which produces clean, styled output
- Print styles hide all editor UI and controls
- Keyboard shortcut: Ctrl+P (or Cmd+P)

**Resume Strength Indicator**
- Progress bar in the header estimates resume completeness based on which sections are present
- Maximum score is reached by including Header, Summary, Experience, Education, and Skills

---

## Getting Started

Clone the repository and open `index.html` in any modern browser. No installation or build step is required.

```
git clone https://github.com/AaqibhafeezKhan/SimpleResumeBuilder.git
cd SimpleResumeBuilder
open index.html
```

---

## Project Structure

```
SimpleResumeBuilder/
├── index.html     Application markup and layout
├── style.css      All styles — UI shell, templates, color themes, print
└── script.js      All logic — drag-and-drop, section builders, storage, controls
```

---

## Browser Support

Works in all modern browsers. PDF export quality may vary across browser print engines; Chrome and Edge produce the most accurate output.

---

## License

MIT
