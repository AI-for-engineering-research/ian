export type BioFossil = {
  id: string;
  label: string;
  kind: string;
  note: string;
  href?: string;
  linkLabel?: string;
};

export type BioLayer = {
  id: string;
  title: string;
  dates: string;
  places: string[];
  weight: number;
  color: string;
  texture?: 'plain' | 'fine' | 'dense' | 'weathered';
  boundary?: 'straight' | 'soft' | 'faulted';
  vignette: string;
  remains: string[];
  fossils?: BioFossil[];
};

export const bioLayers: BioLayer[] = [
  {
    id: 'childhood',
    title: 'Childhood',
    dates: '1972–1987',
    places: ['Bristol'],
    weight: 1.15,
    color: '#f0c36d',
    texture: 'fine',
    boundary: 'soft',
    vignette: 'I think of this phase as "proto-Ian". Only starting to get a vague idea of the things that would fill my life.',
    remains: [
        'Books: not eating? not sleeping? probably reading...',
        'Maths & science: in my head every day since an age where I could barely read.',
    ],
    fossils: [
      { id: 'libraries', label: 'Libraries', kind: 'study', note: 'My home from home.' },
      { id: 'zx-spectrum', label: 'ZX Spectrum', kind: 'tool', note: 'My first computer!' },
    ],
  },
  {
    id: 'sixth-form-oxford-physics',
    title: 'Sixth form and Oxford physics',
    dates: '1987–1992',
    places: ['Bristol', 'Oxford'],
    weight: 1.05,
    color: '#d9b14f',
    texture: 'fine',
      vignette: 'Maths, physics, chemistry, computer science. Then more physics...',
    remains: [
      'You can learn it! You can learn it all.',
      'Caring about understanding.',
    ],
    fossils: [
      { id: 'physics-degree', label: 'Oxford physics', kind: 'study', note: 'Undergrad degree, with lots of theory.' },
      { id: 'quantum-mechanics', label: 'Quantum mechanics', kind: 'study', note: 'Your brain is never the same again.' },
    ],
  },
  {
    id: 'early-software-work',
    title: 'Early software work',
    dates: '1992–1997',
    places: ['Oxford', 'London', 'Paris', 'Tokyo', 'New York'],
    weight: 1.0,
    color: '#c77f45',
    texture: 'plain',
      vignette: 'Professional software development, mostly in finance.',
    remains: [
        'Software as practice: real users and real failures.',
        'Fixing bugs under pressure.',
        'Hating the hack: do it right or not at all.',
    ],
    fossils: [
        { id: 'tokyo', label: 'Tokyo', kind: 'work', note: 'My first experience of a really different culture.' },
        { id: 'apl', label: 'APL', kind: 'work', note: 'A whole day to fix a bug by changing one character in one line!' },
    ],
  },
  {
    id: 'cambridge-mathematics',
    title: 'Cambridge mathematics',
    dates: '1997–1998',
    places: ['Cambridge'],
    weight: 0.55,
    color: '#8e91c9',
    texture: 'dense',
    vignette: 'Back to school in the most extreme way possible. Part III Maths!',
    remains: [
        'Sink or swim: swim your own way.',
        'But could it be real? (No more theoretical physics for me...)',
    ],
    fossils: [
        { id: 'part-iii', label: 'Part III', kind: 'study', note: 'Certificate of Advanced Study in Mathematics: short in time, but a big pivot.' },
    ],
  },
  {
    id: 'planetary-physics-oxford',
    title: 'Planetary physics at Oxford',
    dates: '1998–2001',
    places: ['Oxford'],
    weight: 0.95,
    color: '#d46f55',
    texture: 'weathered',
    boundary: 'faulted',
      vignette: "Mars Climate Orbiter data analysis, then we had a little accident and that project was no more. Tried to do something else, but it didn't work out.",
    remains: [
        'Better get your units right or you might have a bad day.',
        'It can be hard to regroup after a big loss.',
        'Space instruments are complicated: hardware and software working together.',
        'Teaching builds understanding (never knew QM better, before or since).',
    ],
    fossils: [
        { id: 'mco', label: 'Mars Climate Orbiter', kind: 'fault', note: 'Someone lost my spacecraft. Annoying...' },
        { id: 'optical-delay-lines', label: 'Ambitious but doomed', kind: 'instrument', note: 'Hardware and software for laser interferometry.' },
        { id: 'white-water-kayaking', label: 'White-water kayaking', kind: 'outdoors', note: 'Fun but deadly...' },
    ],
  },
  {
    id: 'industry-teaching-bristol',
    title: 'Industry, teaching, and Bristol',
    dates: '2001–2005',
    places: ['Oxford', 'Somerset', 'Aberystwyth', 'Bristol'],
    weight: 0.9,
    color: '#c9a13b',
    texture: 'plain',
    vignette: 'A mixed period of software, marine and aerospace systems engineering, part-time maths teaching, freelance work, and the move into climate modelling in Bristol.',
    remains: [
      'Sometimes you need to flail around a little to find the way.',
    ],
    fossils: [
      { id: 'foam-lpj', label: 'FOAM / LPJ', kind: 'model', note: 'Climate and vegetation modelling before the PhD.' },
        { id: 'caving', label: 'Caving', kind: 'outdoors', note: 'Mud, darkness, crawling, cold. Best sport in the world.' },
    ],
  },
  {
    id: 'climate-modelling-phd',
    title: 'Climate modelling and PhD',
    dates: '2005–2008',
    places: ['Bristol'],
    weight: 1.55,
    color: '#5fa66e',
    texture: 'weathered',
      vignette: 'Nonlinear dimensionality reduction methods in climate data analysis.',
    remains: [
        'Dynamical systems theory as a way of looking at the world.',
        'Public outreach: worth doing, but hard.',
        'Ethical principles for climate scientists.',
    ],
    fossils: [
        { id: 'phd', label: 'PhD', kind: 'study', note: 'Learnt a lot, wrote my thesis on my third-choice project!' },
      { id: 'climate-outreach', label: 'Climate outreach', kind: 'talks', note: 'Public talks and science outreach around climate change.' },
        { id: 'more-caving', label: 'More caving', kind: 'outdoors', note: 'How I met my wife!' },
    ],
  },
  {
    id: 'victoria-montpellier',
    title: 'Victoria and Montpellier',
    dates: '2009–2012',
    places: ['Victoria', 'Montpellier'],
    weight: 1.05,
    color: '#4fa7b7',
    texture: 'fine',
    vignette: 'Postdoctoral work on stochastic models of tropical convection, oceanographic data products, and Mediterranean ecosystem modelling.',
    remains: [
      'Starting to feel like a "deep generalist".',
        'Paddling in the Gulf Islands. Memories I go back to often.',
      'Dogs. How did I go so long without them?',
    ],
    fossils: [
        { id: 'winnie', label: 'Winnie', kind: 'dog', note: 'She was a good dog.', href: 'https://winnie.skybluetrades.net', linkLabel: "Winnie's web site" },
        { id: 'stochastic-models', label: 'Stochastic models', kind: 'model', note: 'Simplified models of convective processes for climate models.' },
        { id: 'outdoors', label: 'Outdoors', kind: 'outdoors', note: 'Mountain biking, sea kayaking, skiing (main subject of my Canada post-doc!).' },
    ],
  },
  {
    id: 'austria-independent-scientific-software',
    title: 'Austria and independent scientific software',
    dates: '2012–2017',
    places: ['Igls', 'Austria', 'remote teams'],
    weight: 1.15,
    color: '#88a642',
    texture: 'fine',
    vignette: 'Independent contracting and scientific software: GIS, physiological modelling, Haskell libraries, Bayesian tools, climate data preparation, and land rights platform work.',
    remains: [
      'The "free" in freelance is a real thing.',
      "Haskell is great. Why can't I use it for everything?",
      'Life outside of cities is better for me.',
    ],
    fossils: [
        { id: 'arb-fft', label: 'arb-fft', kind: 'project', note: 'Pure Haskell arbitrary length FFT library.', href: 'https://github.com/ian-ross/arb-fft', linkLabel: 'GitHub' },
        { id: 'more-winnie', label: 'Winnie', kind: 'dog', note: 'So many memories of Winnie in the mountains.' },
        { id: 'outdoors', label: 'Mountains', kind: 'outdoors', note: 'Austria has some of these. We walked all over them!' },
    ],
  },
  {
    id: 'product-software-engineering',
    title: 'Product/software engineering',
    dates: '2017–2023',
    places: ['Austria', 'remote teams'],
    weight: 1.1,
    color: '#b9824c',
    texture: 'plain',
    vignette: 'Distributed systems, cloud infrastructure, web and mobile applications, embedded networking, product engineering, energy efficiency, CFD visualisation, and short independent contracts.',
    remains: [
      "It's good to learn new things. It's good to jump into the deep end of the pool.",
        "Living with imposter syndrome. It's the default state for sane people.",
      'Dogs ground you. There are no excuses. You have to be there for them.',
    ],
    fossils: [
      { id: 'memcachier', label: 'MemCachier', kind: 'work', note: 'Caching service, distributed team, distributed systems.' },
      { id: 'embedded-sabbatical', label: 'Embedded sabbatical', kind: 'study', note: 'Electronics and embedded systems development learning.' },
        { id: 'older-winnie', label: 'Winnie', kind: 'dog', note: 'Slowing down gradually, but we loved her more and more.' },
    ],
  },
  {
    id: 'contrails-aviation',
    title: 'Contrails and aviation',
    dates: '2023–present',
    places: ['Villach', 'MIT LAE'],
    weight: 0.9,
    color: '#47a9d6',
    texture: 'fine',
    boundary: 'soft',
    vignette: 'Scientific programming for contrail avoidance research at MIT Laboratory for Aviation and the Environment.',
    remains: [
        'Remote work is great (we went to Spain for 9 months...).',
        "Finally found a scientific software contract: they're as rare as hen's teeth.",
    ],
    fossils: [
        { id: 'contrails', label: 'Contrails', kind: 'research', note: 'Good problems, proper software, proper science.' },
        { id: 'podencos', label: 'Maggie & Ruby', kind: 'dog', note: 'Las Podencas Austriacas!', href: 'https://www.instagram.com/las.podencas.austriacas', linkLabel: 'Instagram' },
    ],
  },
];
