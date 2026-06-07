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

MDX components globally available in pages and content entries:

- `Figure`
- `MarginNote`
- `MediaGrid`
- `Sidenote`
- `Wikipedia`

```mdx
<Wikipedia>Monte Carlo</Wikipedia>
<Wikipedia search="Markov chain Monte Carlo" />
<Wikipedia search="bifurcation theory">Wikipedia article on bifurcation theory</Wikipedia>
```

`Wikipedia` links to Wikipedia search URLs, matching the forgiving behavior of browser Wikipedia search shortcuts: exact page titles resolve directly when Wikipedia recognizes them, while other terms show search results.

The layout uses X11 `cornsilk`, `#333333`, STIX Two Text, KaTeX math rendering, an 85ch text measure, and an 18rem right-hand marginal rail that collapses on smaller screens.
