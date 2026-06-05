export type BioThreadId = 'books' | 'mathematics' | 'science' | 'software' | 'outdoors' | 'dogs';

export type BioFossil = {
  id: string;
  label: string;
  kind: string;
  note: string;
  href?: string;
  linkLabel?: string;
  threads?: BioThreadId[];
};

export type BioLayer = {
  id: string;
  title: string;
  dates: string;
  places: string[];
  threads: Partial<Record<BioThreadId, 0 | 1 | 2 | 3>>;
  weight: number;
  color: string;
  texture?: 'plain' | 'fine' | 'dense' | 'weathered';
  boundary?: 'straight' | 'soft' | 'faulted';
  vignette: string;
  remains: string[];
  fossils?: BioFossil[];
};

export type BioThread = {
  id: BioThreadId;
  label: string;
  color: string;
  kind?: 'vein' | 'wash';
};

export const bioThreads: BioThread[] = [
  { id: 'books', label: 'books', color: '#8a5a2b' },
  { id: 'mathematics', label: 'mathematics', color: '#4f6787' },
  { id: 'science', label: 'science', color: '#3f7b78' },
  { id: 'software', label: 'software', color: '#2f3b46' },
  { id: 'outdoors', label: 'outdoors', color: '#6d7f45', kind: 'wash' },
  { id: 'dogs', label: 'dogs', color: '#a85f32' },
];

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
    threads: { books: 3, mathematics: 2, science: 2, software: 1, outdoors: 1 },
    vignette: 'Early ground: books, numbers, science, and the first sense that the world was something that could be read closely. Programming appears faintly here, before it becomes work.',
    remains: [
      'Books as a constant substrate.',
      'Mathematics and science as default ways of approaching the world.',
      'The beginning of software as a way to think with machines.',
    ],
    fossils: [
      { id: 'early-programming', label: 'first programming', kind: 'tool', note: 'Programming starts around age 11: faint at first, but persistent.', threads: ['software'] },
      { id: 'first-computer', label: 'first computer', kind: 'tool', note: 'A computer of my own from about age 13.', threads: ['software'] },
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
    threads: { books: 2, mathematics: 3, science: 3, software: 2, outdoors: 2 },
    vignette: 'Sixth form mathematics, physics, computer science, then Oxford physics with a strong theoretical emphasis: mathematical physics, quantum mechanics, relativity, and differential geometry.',
    remains: [
      'Comfort with abstraction as a working environment.',
      'A lasting connection between physics, mathematics, and careful explanation.',
      'Outdoors as a serious, continuing part of life rather than a side interest.',
    ],
    fossils: [
      { id: 'physics-degree', label: 'Oxford physics', kind: 'study', note: 'First class honours degree in physics, with a strong theoretical emphasis.', threads: ['mathematics', 'science'] },
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
    threads: { books: 1, mathematics: 2, science: 1, software: 3, outdoors: 1 },
    vignette: 'Professional software begins: dictionary systems, market data, trading systems, distributed transaction processing, and fixed income analytics in a sequence of small and large technical settings.',
    remains: [
      'Software as a practical discipline with real users and real failures.',
      'Experience reading unfamiliar systems under pressure.',
      'An early sense that tools, interfaces, and operations are inseparable.',
    ],
    fossils: [
      { id: 'tokyo-systems', label: 'Tokyo dealing room systems', kind: 'work', note: 'Front office trading systems, developer support, and production pressure.', threads: ['software'] },
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
    threads: { books: 2, mathematics: 3, science: 2, software: 1, outdoors: 1 },
    vignette: 'A short, dense return to advanced mathematics: Part III of the Mathematical Tripos, with applied mathematics and theoretical physics at high concentration.',
    remains: [
      'Respect for difficult, compressed learning.',
      'A clearer sense of the power and limits of formal elegance.',
    ],
    fossils: [
      { id: 'part-iii', label: 'Part III', kind: 'study', note: 'Certificate of Advanced Study in Mathematics: a short but pivotal seam.', threads: ['mathematics'] },
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
    threads: { books: 1, mathematics: 3, science: 3, software: 2, outdoors: 1 },
    vignette: 'Planetary physics, Mars Climate Orbiter data analysis, then the loss of the spacecraft and a change of project to optical delay line hardware and control software for space interferometry.',
    remains: [
      'A visceral understanding that assumptions, units, interfaces, and institutional processes meet reality.',
      'A scar from a project disappearing for reasons that were not abstract.',
      'Hardware and software as parts of one instrumented system.',
    ],
    fossils: [
      { id: 'mco', label: 'Mars Climate Orbiter', kind: 'fault', note: 'The mission was lost before arrival. The disruption belongs visibly in the layer, not hidden in a footnote.', threads: ['science', 'software'] },
      { id: 'optical-delay-lines', label: 'optical delay lines', kind: 'instrument', note: 'Hardware and control software for proposed space interferometry.', threads: ['science', 'software'] },
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
    threads: { books: 1, mathematics: 2, science: 2, software: 3, outdoors: 2 },
    vignette: 'A mixed period of image-management software, marine and aerospace systems engineering, part-time maths teaching, freelance work, and the move into climate modelling in Bristol.',
    remains: [
      'Teaching as a test of whether an explanation is real.',
      'Experience moving between industry systems, mathematical instruction, and scientific code.',
    ],
    fossils: [
      { id: 'maths-teaching', label: 'maths teaching', kind: 'teaching', note: 'Part-time A-level and entrance-standard maths teaching in Aberystwyth.', threads: ['mathematics'] },
      { id: 'foam-lpj', label: 'FOAM / LPJ', kind: 'model', note: 'Climate and vegetation modelling before the PhD.', threads: ['science', 'software'] },
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
    threads: { books: 2, mathematics: 3, science: 3, software: 3, outdoors: 2 },
    vignette: 'PhD work on nonlinear dimensionality reduction methods in climate data analysis, alongside climate, vegetation, palaeoclimate, teaching, proposal, and outreach work.',
    remains: [
      'A durable connection between data, geometry, climate, and computation.',
      'Suspicion of models that do not expose their assumptions.',
      'Public explanation as part of scientific responsibility.',
      'The atmosphere as a recurring object of attention.',
    ],
    fossils: [
      { id: 'phd', label: 'PhD', kind: 'study', note: 'Nonlinear dimensionality reduction methods in climate data analysis.', threads: ['mathematics', 'science', 'software'] },
      { id: 'climate-outreach', label: 'climate outreach', kind: 'talks', note: 'Public talks and science outreach around climate change.', threads: ['science'] },
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
    threads: { books: 1, mathematics: 3, science: 3, software: 2, outdoors: 3, dogs: 1 },
    vignette: 'Postdoctoral work on stochastic models of tropical convection, oceanographic data products, and Mediterranean ecosystem modelling. Dogs enter the strata here and continue upward.',
    remains: [
      'Climate and ecosystem modelling as work across scales.',
      'Daily life increasingly tied to landscape, weather, and animals.',
      'The beginning of dogs as structure and companionship.',
    ],
    fossils: [
      { id: 'winnie', label: 'Winnie', kind: 'dog', note: 'The first dog; the beginning of a thread that continues to the present.', href: 'https://winnie.skybluetrades.net', linkLabel: 'Winnie site', threads: ['dogs'] },
      { id: 'tropical-convection', label: 'tropical convection', kind: 'model', note: 'Simplified stochastic models of convective processes for climate models.', threads: ['mathematics', 'science', 'software'] },
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
    threads: { books: 1, mathematics: 2, science: 2, software: 3, outdoors: 3, dogs: 3 },
    vignette: 'Independent contracting and scientific software: GIS, physiological modelling, Haskell libraries, Bayesian tools, climate data preparation, and land rights platform work.',
    remains: [
      'Independence as a working condition and responsibility.',
      'Preference for tools that make structure inspectable.',
      'Austria as landscape and base.',
    ],
    fossils: [
      { id: 'arb-fft', label: 'arb-fft', kind: 'project', note: 'Pure Haskell arbitrary length FFT library.', href: 'https://github.com/ian-ross/arb-fft', threads: ['mathematics', 'software'] },
      { id: 'django-tutelary', label: 'django-tutelary', kind: 'project', note: 'Policy-based permissions for Django, inspired by AWS IAM.', href: 'https://github.com/Cadasta/django-tutelary', threads: ['software'] },
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
    threads: { books: 1, mathematics: 1, science: 1, software: 3, outdoors: 3, dogs: 3 },
    vignette: 'Distributed systems, cloud infrastructure, web and mobile applications, embedded networking, product engineering, energy efficiency, CFD visualisation, and short independent contracts.',
    remains: [
      'Small-team engineering habits: directness, pragmatism, and attention to operations.',
      'A broader range of materials: cloud systems, embedded devices, visualisation, energy data.',
      'Austria and dogs as stable daily ground through varied work.',
    ],
    fossils: [
      { id: 'memcachier', label: 'MemCachier', kind: 'work', note: 'Caching service, distributed team, distributed systems.', threads: ['software'] },
      { id: 'embedded-sabbatical', label: 'embedded sabbatical', kind: 'study', note: 'A deliberate period for electronics and embedded systems development.', threads: ['software', 'science'] },
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
    threads: { books: 1, mathematics: 2, science: 3, software: 3, outdoors: 3, dogs: 3 },
    vignette: 'Scientific programming for contrail avoidance research at MIT Laboratory for Aviation and the Environment: aviation, atmosphere, software, and environmental consequence meet directly.',
    remains: [
      'A return to scientific software with immediate contact between models, decisions, and atmosphere.',
      'Software as support for research rather than as an end in itself.',
      'Continuity of landscape, dogs, and remote collaboration from Austria.',
    ],
    fossils: [
      { id: 'contrails', label: 'contrails', kind: 'research', note: 'Aviation, atmosphere, software, and environmental decision-making in one problem.', threads: ['science', 'software'] },
    ],
  },
];
