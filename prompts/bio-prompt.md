# Life as stratigraphy

I want to make a slightly unusual bio page. Let's call this the the
"sedimentary layers" bio.

This would be a vertical scroll page. Think geological core sample of a life.

Each horizontal layer represents a period. The width/color/texture of each
layer could indicate dominant themes: study, work, place, project, language,
family, animals, travel, research, etc.

As you scroll, annotations appear:

Layer 1972–1984: childhood landscape
Layer 1984–1990: first serious abstractions
Layer 1990–1998: university / mathematics / software
Layer 1998–...

The advantage is that it makes biography feel cumulative. Earlier layers
remain visually present underneath later ones, which is a good metaphor for a
life.


In more detail:

The sedimentary-layers bio could work as a **scrollable "core sample" of a
life**: each layer is a time period, and the visual form says "later things
are built on earlier things" rather than "here is a sequence of jobs."

The key is that the layers should not just mean "years." They should encode
**places, projects, preoccupations, skills, landscapes, and transitions**.

## Basic structure

Imagine the page as a tall vertical column, like a geological cross-section:

```text
┌─────────────────────────────────────┐
│ Present layer                       │
│ Austria / contrails / software / dogs│
├─────────────────────────────────────┤
│ MIT LAE / aviation / remote sensing │
├─────────────────────────────────────┤
│ Earlier software / consulting       │
├─────────────────────────────────────┤
│ Mathematics / university / first code│
├─────────────────────────────────────┤
│ Childhood landscape                 │
└─────────────────────────────────────┘
```

Each layer spans a date range. Its **height** could correspond loosely to
duration, but I would not make it mathematically exact. Long quiet periods
should not dominate the page just because they were long; important short
periods may deserve visual space.

A layer might contain:

```ts
type BioLayer = {
  start: string;
  end?: string;
  title: string;
  places: string[];
  themes: string[];
  shortText: string;
  longText?: string;
  artifacts?: Artifact[];
  texture?: string;
  colorToken?: string;
};
```

Where an artifact might be:

```ts
type Artifact = {
  kind: "photo" | "map" | "book" | "project" | "tool" | "paper" | "quote";
  label: string;
  href?: string;
  caption?: string;
};
```

## The main page interaction

I would make it primarily **scroll-driven**, not slider-driven.

As the user scrolls down through the core sample, a side panel updates with
the active layer:

```text
Left / center:
  sedimentary column

Right:
  title
  dates
  places
  short vignette
  artifacts
  "what remains from this layer"
```

This side panel should be connected to the relevant layer in the core by thin
black lines, in the way that zoomed regions are often shown in real
straigraphic plots.

For example:

```text
1990–1998
Mathematics, programming, abstraction

Places: ...
Themes: proof, formal systems, first serious software

What remains:
- comfort with abstraction
- suspicion of hand-wavy reasoning
- love of tools that expose their model
```

That last section — **"what remains"** — is the part that makes the metaphor
work. In sedimentary geology, layers remain present even when buried. In a
bio, earlier phases remain as habits, instincts, biases, skills, friendships,
fears, or tastes.

## Make the layers visually meaningful

Each layer can have a distinct visual grammar, but I would keep it restrained.

Possible encodings:

| Visual feature   | Meaning                                                 |
| ---------------- | ------------------------------------------------------- |
| Thickness        | duration or subjective importance                       |
| Grain/texture    | kind of period: study, work, travel, research, settling |
| Embedded symbols | artifacts: books, code, dogs, aircraft, mountains, etc. |
| Fault lines      | disruptions, moves, abrupt transitions                  |
| Intrusions       | projects or obsessions that cut across several periods  |
| Fossils          | things from that period that still matter               |
| Color family     | place, mood, or domain                                  |

The "intrusions" idea is especially good. In geology, an intrusion cuts
through existing layers. In a bio, some things do not belong neatly to one
time period. For example:

```text
software
mathematics
weather
contrails
dogs
Austria
writing
```

These could be vertical veins running through multiple layers, showing
continuity.

So the page is not just:

```text
period → period → period
```

but:

```text
periods + long-running threads
```

That is much more biographically interesting.

## A concrete layout

One strong layout would be:

```text
┌──────────────────────────────────────────────────────────┐
│ Header: "Life as stratigraphy"                           │
├──────────────────────┬───────────────────────────────────┤
│                      │                                   │
│  sediment column     │  active layer text                │
│  with bands, veins,  │                                   │
│  fossils, dates      │  title                            │
│                      │  dates                            │
│                      │  places                           │
│                      │  vignette                         │
│                      │  what remains                     │
│                      │  artifacts                        │
│                      │                                   │
└──────────────────────┴───────────────────────────────────┘
```

On mobile, the column could become a horizontal strip or compact vertical bar,
with the text below each layer as you scroll.

## Example content model

A layer does not need to be encyclopedic. In fact, it should be compressed.

For each layer, I would write four things:

```text
1. Where
2. What I was doing
3. What changed
4. What stayed
```

For example:

```text
Layer title:
  Learning to think in systems

Dates:
  1990–1998

Places:
  ...

What I was doing:
  Mathematics, early programming, learning that elegant abstractions can be both clarifying and dangerous.

What changed:
  I started to care less about answers and more about models.

What stayed:
  A permanent attraction to tools that make hidden structure visible.
```

That is more memorable than a standard chronology.

## The "fossils" device

Each layer could contain a few small embedded artifacts: not full
descriptions, just evocative objects.

For example:

```text
fossils:
- a book
- a programming language
- a city
- a project
- a habit
- a recurring question
```

Displayed as small clickable chips:

```text
[Scheme] [weather maps] [walking] [Fourier transforms] [old notebooks]
```

Clicking one could open a small note:

```text
Scheme
A language that made me think differently about programs: less as machinery, more as notation for thought.
```

This would let the page have depth without forcing every visitor to read
everything.

## Transitions as fault lines

The moves between layers are important. You could make abrupt changes visible
as "faults" or breaks.

A normal transition might be a smooth boundary:

```text
────────────
```

A disruptive one might be jagged:

```text
────╱╲────╱╲────
```

The transition card could say something short:

```text
A move, but not quite a clean break.
```

or:

```text
This was the period where software stopped being just a tool and became part of the way I thought.
```

This is a good way to avoid over-explaining inside the layers themselves.

## Long-running threads as veins

This may be the best part of the design.

Imagine vertical colored veins labelled:

```text
software
science
mathematics
landscape
languages
dogs
weather
writing
```

They pass through layers where relevant, thicken when dominant, fade when
dormant, and reappear later.

Conceptually:

```ts
type Thread = {
  id: string;
  label: string;
  activeIn: {
    layerId: string;
    intensity: 0 | 1 | 2 | 3;
    note?: string;
  }[];
};
```

This gives visitors two ways to read the bio:

1. **chronologically**, layer by layer;
2. **thematically**, by following a vein through time.

A "follow this thread" interaction could dim everything else and highlight,
say, the path of "software" or "weather" across the life.

That would be genuinely original.

## Visual style

Since this is for a personal site, I would keep it somewhere between
scientific diagram and handmade notebook.

Not too cartoonish. Not too slick.

Possible aesthetic:

```text
muted earth tones
thin annotation lines
small caps dates
hand-drawn-ish boundary curves
minimal icons
occasional map insets
grain/noise texture
```

The scientific-diagram style would fit well:

```text
1972–1984  ─ Childhood layer
1984–1990  ─ First abstractions
1990–1998  ─ Mathematics / programming
...
```

But with little "specimen labels" rather than corporate timeline cards.

## Implementation sketch

You could build it with ordinary HTML/SVG/CSS.

The sediment column itself is best as SVG. Each layer is a path or polygon.
You can hand-author approximate shapes or generate them from data.

A rough structure:

```html
<section class="bio-strata">
  <svg class="strata-diagram">
    <path class="layer" data-layer="childhood" />
    <path class="layer" data-layer="university" />
    <path class="vein" data-thread="software" />
    <path class="vein" data-thread="science" />
  </svg>

  <aside class="layer-panel">
    ...
  </aside>
</section>
```

Use `IntersectionObserver` for scroll activation:

```js
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      setActiveLayer(entry.target.dataset.layer);
    }
  }
}, { threshold: 0.5 });
```

Or use a scroll progress value to activate layers based on vertical position.

If you want the diagram itself to remain fixed while the text scrolls, use
`position: sticky`.

```css
.strata-diagram {
  position: sticky;
  top: 2rem;
  height: calc(100vh - 4rem);
}
```

## A good first version

For a first pass, I would not build all the fancy interactions. I would do
this:

1. Create 6–10 layers.
2. Give each layer a title, dates, places, themes, and a 100-word vignette.
3. Draw a single vertical SVG core sample.
4. Add 4–6 long-running thread veins.
5. On scroll, highlight the active layer and update the side panel.

That is already enough to feel original.

Then later add:

```text
clickable fossils
thread-following mode
map inset per layer
transition/fault cards
small photos or scans
```

## The main editorial decision

The page should answer this question:

```text
What are the layers that explain the person I am now?
```

Not:

```text
What happened to me in chronological order?
```

That distinction is the whole design. A conventional timeline says "then,
then, then." A sedimentary bio says "this is what accumulated, and this is
what still shows through."
