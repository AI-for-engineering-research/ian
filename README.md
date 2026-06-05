# AI Tools in Research website

Static Astro + MDX site for an academic pilot project on AI tools in research.

## Commands

```sh
npm install
npm run dev
npm run build
```

## Content

- `src/pages/index.mdx` — landing page
- `src/pages/bio.mdx` — bio page
- `src/content/log/*.mdx` — research log entries
- `src/content/project/*.mdx` — project pages

MDX components available for notes and figures:

```mdx
import Sidenote from '../components/Sidenote.astro';
import MarginNote from '../components/MarginNote.astro';
import Figure from '../components/Figure.astro';
```

The layout uses X11 `cornsilk`, `#333333`, STIX Two Text, KaTeX math rendering, an 85ch text measure, and an 18rem right-hand marginal rail that collapses on smaller screens.
