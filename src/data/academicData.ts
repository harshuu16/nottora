import { AcademicContext, CategoryInfo, Material, Subject } from '../types';

/**
 * Centralized Academic Session Configuration
 * Update this single constant whenever the academic session changes.
 */
export const ACADEMIC_SESSION = '26–27';
export const ACADEMIC_SESSION_DISPLAY = 'Session 26–27';

export const CURRENT_CONTEXT: AcademicContext = {
  college: 'Poornima College of Engineering',
  collegeShort: 'PCE',
  branch: 'Computer Science & Engineering',
  branchCode: 'B.Tech CSE',
  year: 1,
  semester: 1,
  session: ACADEMIC_SESSION_DISPLAY,
};

export interface CollegeOption {
  id: string;
  name: string;
  short: string;
  subtitle: string;
  city?: string;
  state?: string;
  status?: string;
}

export const AVAILABLE_COLLEGES: CollegeOption[] = [
  {
    id: 'pce',
    name: 'Poornima College of Engineering',
    short: 'PCE',
    subtitle: 'Autonomous • Jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    status: 'Autonomous',
  },
];

export const AVAILABLE_BRANCHES = [
  { id: 'cse', name: 'Computer Science & Engineering', code: 'B.Tech CSE' },
  { id: 'cse-ai', name: 'CSE (Artificial Intelligence)', code: 'B.Tech CSE-AI' },
  { id: 'ece', name: 'Electronics & Communication', code: 'B.Tech ECE' },
  { id: 'it', name: 'Information Technology', code: 'B.Tech IT' },
];

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'notes',
    label: 'Notes',
    pluralLabel: 'Lecture Notes',
    iconName: 'BookOpen',
    tagline: 'Faculty handouts & curated study notes',
    description: 'Unit-wise comprehensive lecture notes, handwritten summaries, and faculty handouts.',
  },
  {
    id: 'important-questions',
    label: 'Important Questions',
    pluralLabel: 'Important Questions',
    iconName: 'Sparkles',
    tagline: 'High-yield exam questions & solutions',
    description: 'Frequently repeated unit questions, 10-mark guarantee topics, and mid-term question banks.',
  },
  {
    id: 'pyqs',
    label: 'Previous Year Questions',
    pluralLabel: 'Previous Year Papers',
    iconName: 'FileText',
    tagline: 'Official semester exam question papers',
    description: 'Past 5 years university end-term question papers with marked weightage and answer keys.',
  },
  {
    id: 'lab-manuals',
    label: 'Lab Manuals',
    pluralLabel: 'Lab Manuals & Viva',
    iconName: 'FlaskConical',
    tagline: 'Experiment procedures, code & viva guides',
    description: 'Prescribed laboratory experiments, circuit schematics, source codes, and viva voce question lists.',
  },
  {
    id: 'other',
    label: 'Other Material',
    pluralLabel: 'Reference & Cheatsheets',
    iconName: 'Paperclip',
    tagline: 'Syllabus copies, formula sheets & references',
    description: 'Official university curriculum syllabus, formula handbooks, and reference charts.',
  },
];

export interface MasterSubject {
  id: string;
  name: string;
  shortName?: string;
  slug: string;
  defaultCode: string;
  shortDescription: string;
  iconName: string;
  credits: number;
  knownUuids: string[];
  aliases: string[];
  units: {
    unitNumber: number;
    title: string;
    keyTopics: string[];
  }[];
}

/**
 * MASTER SUBJECTS REPOSITORY
 * Core academic course definitions decoupled from any fixed semester or branch.
 * A single master subject (e.g. Chemistry, Engineering Physics, Mathematics) can be mapped
 * dynamically to different semesters across different branches.
 */
export const MASTER_SUBJECTS: MasterSubject[] = [
  {
    id: 'communication-skills',
    slug: 'communication-skills',
    defaultCode: '261FY507',
    name: 'Communication Skills',
    shortName: 'Comm Skills',
    shortDescription: 'Technical Writing, Business Correspondence, Phonetics & Presentation',
    iconName: 'MessagesSquare',
    credits: 2,
    knownUuids: ['83daf8a2-62a3-42a3-8149-2e9a5e10cd50'],
    aliases: ['1fy1-05', '1fy1-04', '261fy507', 'communication-skills', 'communication skills'],
    units: [
      {
        unitNumber: 1,
        title: 'Communication Process & Barriers',
        keyTopics: ['Sender-Receiver Model', 'Types of Communication', 'Intrapersonal vs Interpersonal', 'Overcoming Noise Barriers'],
      },
      {
        unitNumber: 2,
        title: 'Technical Vocabulary & Grammar',
        keyTopics: ['Roots, Prefixes & Suffixes', 'Common Grammatical Pitfalls', 'Active vs Passive Voice in Engineering', 'Concord Rules'],
      },
      {
        unitNumber: 3,
        title: 'Formal Business Writing',
        keyTopics: ['Official Letters & Quotations', 'Professional Email Etiquette', 'Memo Writing & Notice Drafting'],
      },
      {
        unitNumber: 4,
        title: 'Technical Report & Proposal Drafting',
        keyTopics: ['Structure of Technical Reports', 'Project Feasibility Reports', 'Executive Summaries', 'Citation Formats'],
      },
      {
        unitNumber: 5,
        title: 'Oral Presentation & Interview Skills',
        keyTopics: ['Body Language & Kinesics', 'Audio-Visual Presentation Aids', 'Group Discussion Techniques', 'Personal Interview Preparation'],
      },
    ],
  },
  {
    id: 'chemistry',
    slug: 'chemistry',
    defaultCode: '261FY101',
    name: 'Chemistry',
    shortName: 'Chemistry',
    shortDescription: 'Water Technology, Fuels, Polymers, Corrosion & Nanomaterials',
    iconName: 'Beaker',
    credits: 4,
    knownUuids: ['f9e3096c-fb5c-428a-bf63-be6561d204ab'],
    aliases: ['1fy2-03', '261fy101', 'chemistry', 'engineering chemistry'],
    units: [
      {
        unitNumber: 1,
        title: 'Water Treatment & Hardness Analysis',
        keyTopics: ['Hardness by EDTA Method', 'Boiler Troubles (Sludge, Scale, Priming)', 'Zeolite & Ion-Exchange Process', 'Reverse Osmosis'],
      },
      {
        unitNumber: 2,
        title: 'Fuels & Combustion Calorimetry',
        keyTopics: ['Proximate & Ultimate Analysis of Coal', 'Calorific Value & Bomb Calorimeter', 'Carbonization of Coal', 'Knocking & Octane Number'],
      },
      {
        unitNumber: 3,
        title: 'Polymers, Plastics & Elastomers',
        keyTopics: ['Thermoplastic vs Thermosetting', 'Bakelite, Nylon-6,6, Teflon Synthesis', 'Vulcanization of Rubber', 'Conducting Polymers'],
      },
      {
        unitNumber: 4,
        title: 'Corrosion & its Protective Coatings',
        keyTopics: ['Dry vs Wet Electrochemical Corrosion', 'Pilling-Bedworth Rule', 'Sacrificial Anode & Impressed Current', 'Galvanizing & Tinning'],
      },
      {
        unitNumber: 5,
        title: 'Engineering Materials & Nanochemistry',
        keyTopics: ['Portland Cement Manufacture & Setting', 'Lubricants & Flash/Fire Point', 'Carbon Nanotubes (CNTs) Synthesis & Uses'],
      },
    ],
  },
  {
    id: 'engineering-physics',
    slug: 'engineering-physics',
    defaultCode: '1FY2-02',
    name: 'Engineering Physics',
    shortName: 'Physics',
    shortDescription: 'Wave Optics, Quantum Mechanics, Coherence & Lasers, Optical Fibers & Electromagnetics',
    iconName: 'Atom',
    credits: 4,
    knownUuids: ['98ce7c13-b3ad-4112-9c93-96df0c42e91c'],
    aliases: ['1fy2-02', 'engineering-physics', 'physics', 'engineering physics'],
    units: [
      {
        unitNumber: 1,
        title: 'Wave Optics & Interference',
        keyTopics: [
          'Interference by Division of Wavefront & Amplitude',
          'Young Double Slit Experiment & Wedge Shaped Film',
          'Newton Rings & Applications',
          'Fraunhofer Diffraction (Single Slit & N-Slits)',
          'Diffraction Grating & Resolving Power',
        ],
      },
      {
        unitNumber: 2,
        title: 'Quantum Mechanics',
        keyTopics: [
          'Wave-Particle Duality & de-Broglie Hypothesis',
          'Heisenberg Uncertainty Principle',
          'Time-Independent Schrödinger Wave Equation',
          'Physical Significance of Wave Function Ψ',
          'Particle in a 1D Infinite Potential Box',
        ],
      },
      {
        unitNumber: 3,
        title: 'Coherence & Lasers',
        keyTopics: [
          'Spatial & Temporal Coherence',
          'Einstein Coefficients & Population Inversion',
          'Ruby Laser & Helium-Neon (He-Ne) Laser',
          'Semiconductor Diode Lasers',
          'Holography Principles & Engineering Applications',
        ],
      },
      {
        unitNumber: 4,
        title: 'Optical Fibers & Fiber Optics',
        keyTopics: [
          'Total Internal Reflection & Acceptance Angle',
          'Numerical Aperture (NA) Formulation',
          'Step-Index & Graded-Index (GRIN) Optical Fibers',
          'Attenuation & Dispersion in Optical Fibers',
          'Fiber Optic Sensors & Telecommunication Link',
        ],
      },
      {
        unitNumber: 5,
        title: 'Electromagnetism & Dielectrics',
        keyTopics: [
          'Continuity Equation & Maxwell Equations (Integral & Differential)',
          'Electromagnetic Waves in Free Space & Dielectric Media',
          'Poynting Vector & Energy Transport',
          'Polarization Mechanisms in Dielectrics (Electronic, Ionic, Dipolar)',
          'Clausius-Mossotti Equation & Ferroelectric Materials',
        ],
      },
    ],
  },
  {
    id: 'beee',
    slug: 'beee',
    defaultCode: '261CR104',
    name: 'BEEE',
    shortName: 'BEEE',
    shortDescription: 'Basic Electrical & Electronics Engineering — DC/AC Circuits, Transformers & Diodes',
    iconName: 'Zap',
    credits: 3,
    knownUuids: ['ea50315f-f2a7-4964-85c8-8eb8e526e51f'],
    aliases: ['1fy3-07', '261cr104', 'beee', 'basic electrical & electronics engineering', 'basic electrical engineering'],
    units: [
      {
        unitNumber: 1,
        title: 'DC Circuit Analysis & Network Theorems',
        keyTopics: ["Kirchhoff's Laws (KVL & KCL)", 'Mesh & Nodal Analysis', "Thevenin's & Norton's Theorems", 'Maximum Power Transfer Theorem'],
      },
      {
        unitNumber: 2,
        title: 'Single-Phase & Polyphase AC Circuits',
        keyTopics: ['Sinusoidal Waveforms, RMS & Average Values', 'RL, RC & RLC Series Resonant Circuits', 'Three-Phase Star & Delta Connections', 'Power Factor'],
      },
      {
        unitNumber: 3,
        title: 'Magnetic Circuits & Single-Phase Transformers',
        keyTopics: ['BH Curve & Magnetic Losses', 'Transformer Construction & EMF Equation', 'Equivalent Circuit & Losses', 'Efficiency & Regulation'],
      },
      {
        unitNumber: 4,
        title: 'Electrical Machines (DC & Induction Motors)',
        keyTopics: ['DC Machine Working Principle & EMF Equation', 'Types of DC Motors & Characteristics', 'Three-Phase Induction Motor Principles', 'Applications'],
      },
      {
        unitNumber: 5,
        title: 'Semiconductor Diodes & Transistor Basics',
        keyTopics: ['PN Junction Diode V-I Characteristics', 'Half-Wave & Full-Wave Bridge Rectifiers', 'Zener Diode as Voltage Regulator', 'BJT Configurations (CE, CB)'],
      },
    ],
  },
  {
    id: 'engineering-mathematics',
    slug: 'engineering-mathematics',
    defaultCode: '261FY103',
    name: 'Engineering Mathematics',
    shortName: 'Mathematics',
    shortDescription: 'Calculus, Matrices, Vector Calculus & Differential Equations',
    iconName: 'Calculator',
    credits: 4,
    knownUuids: ['7112bf1f-43a4-4ee0-8a90-303de1fb05bc'],
    aliases: ['1fy2-01', '261fy103', 'engineering-mathematics', 'mathematics', 'engineering mathematics', 'engineering mathematics-i', 'maths'],
    units: [
      {
        unitNumber: 1,
        title: 'Calculus & Curve Tracing',
        keyTopics: ["Rolle's Theorem", "Mean Value Theorems", "Taylor's & Maclaurin's Series", 'Asymptotes', 'Curvature'],
      },
      {
        unitNumber: 2,
        title: 'Multivariable Calculus & Partial Differentiation',
        keyTopics: ["Euler's Theorem on Homogeneous Functions", 'Jacobians', 'Maxima & Minima of Two Variables', "Lagrange's Multipliers"],
      },
      {
        unitNumber: 3,
        title: 'Matrices & Linear Algebra',
        keyTopics: ['Rank of Matrix', 'Consistency of Linear Systems', 'Eigenvalues & Eigenvectors', 'Cayley-Hamilton Theorem'],
      },
      {
        unitNumber: 4,
        title: 'Ordinary Differential Equations',
        keyTopics: ['First Order First Degree ODEs', 'Exact Equations', 'Linear ODEs with Constant Coefficients', 'Cauchy-Euler Equations'],
      },
      {
        unitNumber: 5,
        title: 'Vector Calculus & Integral Theorems',
        keyTopics: ['Gradient, Divergence & Curl', 'Line, Surface & Volume Integrals', "Green's Theorem", "Gauss Divergence Theorem", "Stokes' Theorem"],
      },
    ],
  },
  {
    id: 'mpws',
    slug: 'mpws',
    defaultCode: '261FY629',
    name: 'MPWS',
    shortName: 'MPWS',
    shortDescription: 'Manufacturing Practices Workshop — Fitting, Carpentry, Foundry & Welding',
    iconName: 'Wrench',
    credits: 2,
    knownUuids: ['2d6358b4-e5c5-47f3-bb7e-e6cf5097ed9f'],
    aliases: ['1fy4-21', '1fy3-20', '261fy629', 'mpws', 'manufacturing practices workshop'],
    units: [
      {
        unitNumber: 1,
        title: 'Fitting Shop Practices & Safety',
        keyTopics: ['Measuring Tools (Vernier, Micrometer)', 'Types of Files & Hacksaws', 'Drilling, Tapping & Reaming', 'Step-Cutting Exercise'],
      },
      {
        unitNumber: 2,
        title: 'Carpentry & Woodworking Joints',
        keyTopics: ['Timber Classification & Seasoning', 'Carpentry Tools (Chisels, Saws, Planes)', 'Mortise & Tenon Joint', 'Dovetail Joint'],
      },
      {
        unitNumber: 3,
        title: 'Welding Shop: Arc & Gas Joining',
        keyTopics: ['Shielded Metal Arc Welding (SMAW)', 'Oxy-Acetylene Gas Welding Setup', 'Welding Defects & Inspection', 'Safety Equipment'],
      },
      {
        unitNumber: 4,
        title: 'Foundry & Casting Workshop',
        keyTopics: ['Moulding Sand Types & Properties', 'Pattern Making & Shrinkage Allowance', 'Gating System Components', 'Casting Defects'],
      },
      {
        unitNumber: 5,
        title: 'Sheet Metal & Blacksmithing Basics',
        keyTopics: ['Sheet Metal Gauges & Hand Shears', 'Hemming, Seaming & Riveting', 'Forging Operations (Drawing out, Upsetting)', 'Anvil Usage'],
      },
    ],
  },
  {
    id: 'c-programming',
    slug: 'c-programming',
    defaultCode: '261FY106',
    name: 'C Programming',
    shortName: 'C Programming',
    shortDescription: 'Syntax, Control Flow, Functions, Pointers, Arrays & File Handling',
    iconName: 'Code2',
    credits: 3,
    knownUuids: ['4d45360f-ab27-4a7b-a63f-89ce15aab471'],
    aliases: ['1fy3-06', '261fy106', 'c-programming', 'programming-in-c', 'programming in c', 'programming for problem solving'],
    units: [
      {
        unitNumber: 1,
        title: 'Introduction to Problem Solving & C Basics',
        keyTopics: ['Flowcharts & Algorithms', 'Data Types & Operators', 'Type Casting', 'Formatted I/O (printf/scanf)'],
      },
      {
        unitNumber: 2,
        title: 'Control Structures & Branching',
        keyTopics: ['if-else & nested if', 'switch-case', 'while, do-while, for loops', 'break and continue statements'],
      },
      {
        unitNumber: 3,
        title: 'Arrays, Strings & Functions',
        keyTopics: ['1D and 2D Arrays', 'String Handling Functions', 'Call by Value vs Reference', 'Recursion'],
      },
      {
        unitNumber: 4,
        title: 'Pointers & Dynamic Memory Allocation',
        keyTopics: ['Pointer Arithmetic', 'Pointers to Arrays & Functions', 'malloc, calloc, realloc, free', 'Memory Leaks'],
      },
      {
        unitNumber: 5,
        title: 'Structures, Unions & File Operations',
        keyTopics: ['struct definition & nested structures', 'Unions vs Structures', 'File I/O (fopen, fread, fwrite)', 'Command Line Arguments'],
      },
    ],
  },
  {
    id: 'language-lab',
    slug: 'language-lab',
    defaultCode: '261FY526',
    name: 'Language Lab',
    shortName: 'Language Lab',
    shortDescription: 'Phonetics, Listening Comprehension, Accent Training & Conversational Practice',
    iconName: 'Languages',
    credits: 2,
    knownUuids: ['26100526-0000-4000-8000-000000000526'],
    aliases: ['261fy526', 'language-lab', 'language lab'],
    units: [
      {
        unitNumber: 1,
        title: 'Phonetics & Speech Sounds',
        keyTopics: ['International Phonetic Alphabet (IPA)', 'English Vowels & Diphthongs', 'Consonants & Articulation', 'Phonetic Transcription'],
      },
      {
        unitNumber: 2,
        title: 'Stress, Rhythm & Intonation Patterns',
        keyTopics: ['Word & Syllable Stress Rules', 'Sentence Rhythm & Cadence', 'Rising & Falling Intonation', 'Punctuation Pauses'],
      },
      {
        unitNumber: 3,
        title: 'Listening Comprehension & Note Taking',
        keyTopics: ['Active Audio Listening Strategies', 'Dialogue Analysis', 'Accent Neutralization', 'Summary Drafting from Audio'],
      },
      {
        unitNumber: 4,
        title: 'Conversational Fluency & Role Play Scenarios',
        keyTopics: ['Situational Dialogues & Greetings', 'Professional Telephone Etiquette', 'Debate & Persuasion', 'Impromptu Speaking'],
      },
      {
        unitNumber: 5,
        title: 'Professional Group Discussions & Oral Presentation',
        keyTopics: ['Extempore Speaking', 'Non-verbal Cues & Poise', 'Mock Group Discussions', 'Audio-Visual Presentation Practice'],
      },
    ],
  },
  {
    id: 'wpl',
    slug: 'wpl',
    defaultCode: '261CR124',
    name: 'WPL',
    shortName: 'WPL',
    shortDescription: 'Web Programming Lab — HTML5, CSS3, JavaScript Basics, Responsive Design & DOM',
    iconName: 'Globe',
    credits: 2,
    knownUuids: ['26100124-0000-4000-8000-000000000124'],
    aliases: ['261cr124', 'wpl', 'web-programming-lab', 'web programming lab'],
    units: [
      {
        unitNumber: 1,
        title: 'HTML5 Semantic Elements & Document Structure',
        keyTopics: ['HTML5 Semantic Layout Tags', 'Form Elements & Client-side Inputs', 'Tables & Media Elements', 'Accessibility Best Practices'],
      },
      {
        unitNumber: 2,
        title: 'CSS3 Styling, Flexbox & Responsive Layouts',
        keyTopics: ['Box Model & Selectors', 'CSS Flexbox & CSS Grid', 'Media Queries for Mobile-first Design', 'CSS Custom Properties (Variables)'],
      },
      {
        unitNumber: 3,
        title: 'Client-Side JavaScript Fundamentals',
        keyTopics: ['Data Types, let/const & Operators', 'Conditional Logic & Iterations', 'Functions & Arrow Syntax', 'Arrays and Object Literals'],
      },
      {
        unitNumber: 4,
        title: 'DOM Manipulation & Event Handling',
        keyTopics: ['Selecting & Updating Elements', 'Event Listeners & Bubbling', 'Interactive Form Validation', 'Dynamic Class & Style Toggles'],
      },
      {
        unitNumber: 5,
        title: 'Mini Web Project Development & Deployment',
        keyTopics: ['JSON Data Parsing', 'Fetch API & Asynchronous Operations', 'LocalStorage Persistence', 'Static Site Hosting & Deployment'],
      },
    ],
  },
  {
    id: 'design-thinking',
    slug: 'design-thinking',
    defaultCode: '',
    name: 'Design Thinking',
    shortName: 'DT',
    shortDescription: 'Human-Centered Design, Empathy Mapping, Problem Definition, Ideation & Iterative Prototyping',
    iconName: 'Lightbulb',
    credits: 2,
    knownUuids: ['158da6bb-cce0-4553-84d6-7d96bb54fe47'],
    aliases: ['design-thinking', 'design thinking', 'dt'],
    units: [
      {
        unitNumber: 1,
        title: 'Introduction to Design Thinking & Human-Centered Design',
        keyTopics: [
          'Design Thinking Mindset & Principles',
          'Human-Centered vs Traditional Engineering',
          '5-Stage Stanford d.school Framework',
          'Problem Space vs Solution Space',
        ],
      },
      {
        unitNumber: 2,
        title: 'Empathize — Understanding User Needs & Context',
        keyTopics: [
          'User Observation & Field Immersion',
          'Conducting User Interviews & Active Listening',
          'Developing Empathy Maps',
          'Persona Creation & Extreme Users',
        ],
      },
      {
        unitNumber: 3,
        title: 'Define — Re-framing Problems & Point of View (POV)',
        keyTopics: [
          'Affinity Clustering & Insight Synthesis',
          'Crafting Actionable POV Statements',
          'Developing "How Might We" (HMW) Questions',
          'Root Cause Analysis & User Journey Mapping',
        ],
      },
      {
        unitNumber: 4,
        title: 'Ideate — Creative Divergence & Solution Synthesis',
        keyTopics: [
          'Brainstorming & Brainwriting Rules',
          'SCAMPER & Lateral Thinking Techniques',
          'Mind Mapping & Visual Storyboarding',
          'Feasibility vs Viability Matrix & Idea Prioritization',
        ],
      },
      {
        unitNumber: 5,
        title: 'Prototype & Test — Iterative Validation & Real-world Feedback',
        keyTopics: [
          'Low-Fidelity Prototyping & Paper Mockups',
          'Rapid Physical & Digital Model Building',
          'Planning & Executing Usability Tests',
          'Feedback Capture Grid & Iteration Cycles',
        ],
      },
    ],
  },
  {
    id: 'non-syllabus-project',
    slug: 'non-syllabus-project',
    defaultCode: '1FY3-08',
    name: 'Non-Syllabus Project',
    shortName: 'NSP',
    shortDescription: 'Hands-on Project Work, Technical Implementation & Practical Innovation',
    iconName: 'FolderKanban',
    credits: 1,
    knownUuids: ['30d211c6-3e3a-47c5-a9ab-cdc4bb89d989'],
    aliases: ['1fy3-08', 'non-syllabus-project', 'non syllabus project', 'nsp'],
    units: [],
  },
];

/**
 * CURRICULUM MAPPINGS
 * Explicit academic mapping rules determining which master subjects are taught
 * in which semester for each branch.
 *
 * Rules:
 * - Group A branches (CSE, IT, CSE-AI):
 *   - Year 1, Sem 1 -> Chemistry Group (Chemistry, BEEE, Mathematics, etc.)
 *   - Year 1, Sem 2 -> Physics Group (Physics, Mathematics, etc.)
 * - Group B branches (ECE, EE, Mechanical):
 *   - Year 1, Sem 1 -> Physics Group (Physics, Mathematics, etc.)
 *   - Year 1, Sem 2 -> Chemistry Group (Chemistry, BEEE, Mathematics, etc.)
 * - Year 2+ or unmapped combinations:
 *   - Strictly return empty array (triggers "Coming Soon / No subjects available yet")
 */
export interface CurriculumEntry {
  branchCode: string; // e.g. 'B.Tech CSE', 'B.Tech ECE'
  branchSlug?: string;
  year: number;
  semester: number;
  subjectIds: string[]; // master subject IDs in display order
  subjectOverrides?: Record<string, { code?: string; credits?: number; name?: string }>;
}

export const CURRICULUM_MAPPINGS: CurriculumEntry[] = [
  // -------------------------------------------------------------
  // 1. Computer Science & Engineering (B.Tech CSE)
  // -------------------------------------------------------------
  {
    branchCode: 'B.Tech CSE',
    branchSlug: 'cse',
    year: 1,
    semester: 1,
    subjectIds: [
      'communication-skills',
      'chemistry',
      'beee',
      'engineering-mathematics',
      'mpws',
      'c-programming',
      'language-lab',
      'wpl',
      'design-thinking',
      'non-syllabus-project',
    ],
  },
  {
    branchCode: 'B.Tech CSE',
    branchSlug: 'cse',
    year: 1,
    semester: 2,
    subjectIds: [
      'engineering-physics',
      'engineering-mathematics',
      'communication-skills',
    ],
    subjectOverrides: {
      'engineering-mathematics': { code: '1FY2-01', name: 'Engineering Mathematics-II' },
      'engineering-physics': { code: '1FY2-02' },
    },
  },

  // -------------------------------------------------------------
  // 2. Electronics & Communication (B.Tech ECE)
  // -------------------------------------------------------------
  {
    branchCode: 'B.Tech ECE',
    branchSlug: 'ece',
    year: 1,
    semester: 1,
    subjectIds: [
      'engineering-physics',
      'engineering-mathematics',
      'c-programming',
      'communication-skills',
    ],
    subjectOverrides: {
      'engineering-physics': { code: '1FY2-02' },
      'engineering-mathematics': { code: '1FY2-01' },
      'c-programming': { code: '1FY3-06' },
      'communication-skills': { code: '1FY1-05' },
    },
  },
  {
    branchCode: 'B.Tech ECE',
    branchSlug: 'ece',
    year: 1,
    semester: 2,
    subjectIds: [
      'chemistry',
      'engineering-mathematics',
      'beee',
      'mpws',
    ],
    subjectOverrides: {
      'chemistry': { code: '1FY2-03' },
      'engineering-mathematics': { code: '1FY2-01', name: 'Engineering Mathematics-II' },
      'beee': { code: '1FY3-07' },
      'mpws': { code: '1FY4-21' },
    },
  },

  // -------------------------------------------------------------
  // 3. CSE (Artificial Intelligence) (B.Tech CSE-AI)
  // -------------------------------------------------------------
  {
    branchCode: 'B.Tech CSE-AI',
    branchSlug: 'cse-ai',
    year: 1,
    semester: 1,
    subjectIds: [
      'communication-skills',
      'chemistry',
      'beee',
      'engineering-mathematics',
      'mpws',
      'c-programming',
      'language-lab',
      'wpl',
      'design-thinking',
      'non-syllabus-project',
    ],
  },
  {
    branchCode: 'B.Tech CSE-AI',
    branchSlug: 'cse-ai',
    year: 1,
    semester: 2,
    subjectIds: [
      'engineering-physics',
      'engineering-mathematics',
      'communication-skills',
    ],
  },

  // -------------------------------------------------------------
  // 4. Information Technology (B.Tech IT)
  // -------------------------------------------------------------
  {
    branchCode: 'B.Tech IT',
    branchSlug: 'it',
    year: 1,
    semester: 1,
    subjectIds: [
      'communication-skills',
      'chemistry',
      'beee',
      'engineering-mathematics',
      'mpws',
      'c-programming',
      'language-lab',
      'wpl',
      'design-thinking',
      'non-syllabus-project',
    ],
  },
  {
    branchCode: 'B.Tech IT',
    branchSlug: 'it',
    year: 1,
    semester: 2,
    subjectIds: [
      'engineering-physics',
      'engineering-mathematics',
      'communication-skills',
    ],
  },
];

/**
 * Returns the exact subjects mapped to the specified Academic Hierarchy.
 * Returns an empty array if no curriculum mapping exists (e.g. Year 2+),
 * strictly preventing fallback to other branches or semesters.
 */
export function getCurriculumSubjects(hierarchy?: {
  college?: string;
  collegeName?: string;
  collegeShort?: string;
  collegeCode?: string;
  branch?: string;
  branchName?: string;
  branchCode?: string;
  year?: number;
  semester?: number;
}): Subject[] {
  if (!hierarchy) return [];

  const collegeName = hierarchy.college || hierarchy.collegeName || 'Poornima College of Engineering';
  const branchCode = hierarchy.branchCode || (
    hierarchy.branch === 'Electronics & Communication' ? 'B.Tech ECE' :
    hierarchy.branch === 'Computer Science & Engineering' ? 'B.Tech CSE' :
    hierarchy.branch === 'CSE (Artificial Intelligence)' ? 'B.Tech CSE-AI' :
    hierarchy.branch === 'Information Technology' ? 'B.Tech IT' :
    hierarchy.branch || ''
  );
  const branchName = hierarchy.branch || hierarchy.branchName || '';
  const year = hierarchy.year || 1;
  const semester = hierarchy.semester || 1;

  const entry = CURRICULUM_MAPPINGS.find((m) => {
    const codeMatch =
      m.branchCode.toLowerCase() === branchCode.toLowerCase() ||
      m.branchCode.toLowerCase() === branchName.toLowerCase();
    const slugMatch = m.branchSlug && (
      branchCode.toLowerCase().includes(m.branchSlug.toLowerCase()) ||
      branchName.toLowerCase().includes(m.branchSlug.toLowerCase())
    );
    const branchMatches = Boolean(codeMatch || slugMatch);
    const yearMatches = m.year === year;
    const semMatches = m.semester === semester;
    return branchMatches && yearMatches && semMatches;
  });

  if (!entry) {
    return [];
  }

  return entry.subjectIds
    .map((subId) => {
      const master = MASTER_SUBJECTS.find((ms) => ms.id === subId);
      if (!master) return null;

      const override = entry.subjectOverrides?.[subId];
      const finalCode = override?.code || master.defaultCode || '';
      const finalId = override?.code || master.defaultCode || master.id;

      const instantiated: Subject = {
        id: finalId,
        code: finalCode,
        shortName: master.shortName,
        uuid: master.knownUuids[0],
        slug: master.slug,
        name: override?.name || master.name,
        semester: semester,
        year: year,
        branch: branchCode || 'B.Tech CSE',
        college: collegeName,
        shortDescription: master.shortDescription,
        iconName: master.iconName,
        credits: override?.credits !== undefined ? override.credits : master.credits,
        totalMaterials: 0,
        units: master.units,
      };
      return instantiated;
    })
    .filter(Boolean) as Subject[];
}

/**
 * Default SUBJECTS export instantiated from CURRENT_CONTEXT for backward compatibility.
 */
export const SUBJECTS: Subject[] = getCurriculumSubjects(CURRENT_CONTEXT);

export interface CanonicalSubjectInfo {
  code: string;
  id: string;
  slug: string;
  name: string;
  legacyCodes: string[];
  legacySlugs: string[];
  legacyNames: string[];
  knownUuids: string[];
}

export const CANONICAL_SEMESTER_1_MAP: CanonicalSubjectInfo[] = [
  {
    code: '261FY507',
    id: '261FY507',
    slug: 'communication-skills',
    name: 'Communication Skills',
    legacyCodes: ['1FY1-05', '1FY1-04'],
    legacySlugs: ['communication-skills'],
    legacyNames: ['Communication Skills'],
    knownUuids: ['83daf8a2-62a3-42a3-8149-2e9a5e10cd50'],
  },
  {
    code: '261FY101',
    id: '261FY101',
    slug: 'chemistry',
    name: 'Chemistry',
    legacyCodes: ['1FY2-03'],
    legacySlugs: ['chemistry'],
    legacyNames: ['Chemistry', 'Engineering Chemistry'],
    knownUuids: ['f9e3096c-fb5c-428a-bf63-be6561d204ab'],
  },
  {
    code: '261CR104',
    id: '261CR104',
    slug: 'beee',
    name: 'BEEE',
    legacyCodes: ['1FY3-07'],
    legacySlugs: ['beee'],
    legacyNames: ['BEEE', 'Basic Electrical & Electronics Engineering'],
    knownUuids: ['ea50315f-f2a7-4964-85c8-8eb8e526e51f'],
  },
  {
    code: '261FY103',
    id: '261FY103',
    slug: 'mathematics',
    name: 'Mathematics',
    legacyCodes: ['1FY2-01'],
    legacySlugs: ['mathematics', 'engineering-mathematics'],
    legacyNames: ['Mathematics', 'Engineering Mathematics', 'Engineering Mathematics-I'],
    knownUuids: ['7112bf1f-43a4-4ee0-8a90-303de1fb05bc'],
  },
  {
    code: '261FY629',
    id: '261FY629',
    slug: 'mpws',
    name: 'MPWS',
    legacyCodes: ['1FY4-21', '1FY3-20'],
    legacySlugs: ['mpws'],
    legacyNames: ['MPWS', 'Manufacturing Practices Workshop'],
    knownUuids: ['2d6358b4-e5c5-47f3-bb7e-e6cf5097ed9f'],
  },
  {
    code: '261FY106',
    id: '261FY106',
    slug: 'c-programming',
    name: 'C Programming',
    legacyCodes: ['1FY3-06'],
    legacySlugs: ['c-programming', 'programming-in-c'],
    legacyNames: ['C Programming', 'Programming in C', 'Programming for Problem Solving'],
    knownUuids: ['4d45360f-ab27-4a7b-a63f-89ce15aab471'],
  },
  {
    code: '261FY526',
    id: '261FY526',
    slug: 'language-lab',
    name: 'Language Lab',
    legacyCodes: [],
    legacySlugs: ['language-lab'],
    legacyNames: ['Language Lab'],
    knownUuids: [],
  },
  {
    code: '261CR124',
    id: '261CR124',
    slug: 'wpl',
    name: 'WPL',
    legacyCodes: [],
    legacySlugs: ['wpl'],
    legacyNames: ['WPL', 'Web Programming Lab'],
    knownUuids: [],
  },
  {
    code: '', // Subject code not available yet; leave empty
    id: 'design-thinking',
    slug: 'design-thinking',
    name: 'Design Thinking',
    legacyCodes: [],
    legacySlugs: ['design-thinking', 'dt'],
    legacyNames: ['Design Thinking', 'DT'],
    knownUuids: [],
  },
  {
    code: '1FY2-02',
    id: 'engineering-physics',
    slug: 'engineering-physics',
    name: 'Engineering Physics',
    legacyCodes: ['1FY2-02'],
    legacySlugs: ['engineering-physics', 'physics'],
    legacyNames: ['Engineering Physics', 'Physics'],
    knownUuids: ['98ce7c13-b3ad-4112-9c93-96df0c42e91c'],
  },
  {
    code: '', // Subject code not available yet; leave empty
    id: 'non-syllabus-project',
    slug: 'non-syllabus-project',
    name: 'Non-Syllabus Project',
    legacyCodes: ['1fy3-08'],
    legacySlugs: ['non-syllabus-project', 'nsp'],
    legacyNames: ['Non-Syllabus Project', 'NSP', 'Non Syllabus Project'],
    knownUuids: ['30d211c6-3e3a-47c5-a9ab-cdc4bb89d989'],
  },
];

/**
 * Resolves any identifier (code, legacy code, slug, name, or database UUID)
 * to the canonical MasterSubject.
 */
export function getCanonicalMasterSubject(val: unknown): MasterSubject | null {
  if (!val || typeof val !== 'string') return null;
  const clean = val.trim().toLowerCase();
  if (!clean) return null;

  for (const master of MASTER_SUBJECTS) {
    if (master.id.toLowerCase() === clean) return master;
    if (master.slug.toLowerCase() === clean) return master;
    if (master.defaultCode && master.defaultCode.toLowerCase() === clean) return master;
    if (master.name.toLowerCase() === clean) return master;
    if (master.shortName && master.shortName.toLowerCase() === clean) return master;
    if (master.knownUuids.some((u) => u.toLowerCase() === clean)) return master;
    if (master.aliases.some((a) => a.toLowerCase() === clean)) return master;
  }

  for (const item of CANONICAL_SEMESTER_1_MAP) {
    if (
      (item.code && item.code.toLowerCase() === clean) ||
      (item.id && item.id.toLowerCase() === clean) ||
      (item.slug && item.slug.toLowerCase() === clean) ||
      (item.name && item.name.toLowerCase() === clean) ||
      (item.knownUuids && item.knownUuids.some((u) => u.toLowerCase() === clean)) ||
      (item.legacyCodes && item.legacyCodes.some((lc) => lc.toLowerCase() === clean)) ||
      (item.legacySlugs && item.legacySlugs.some((ls) => ls.toLowerCase() === clean)) ||
      (item.legacyNames && item.legacyNames.some((ln) => ln.toLowerCase() === clean))
    ) {
      return (
        MASTER_SUBJECTS.find(
          (m) =>
            m.id === item.id ||
            m.slug === item.slug ||
            m.defaultCode === item.code ||
            m.name.toLowerCase() === item.name.toLowerCase()
        ) || null
      );
    }
  }

  return null;
}

/**
 * Resolves any identifier (code, legacy code, slug, name, or database UUID)
 * to the canonical subject code / subject ID (e.g. "261CR104" or "beee").
 */
export function resolveSubjectIdentifier(val: unknown): string | null {
  const master = getCanonicalMasterSubject(val);
  if (master) return master.id;
  return null;
}

/**
 * Resolves any identifier to a canonical subject object with units & syllabus.
 */
export function getCanonicalSubject(val: unknown): Subject | null {
  const master = getCanonicalMasterSubject(val);
  if (!master) return null;
  return (
    SUBJECTS.find((s) => s.id === master.id || s.slug === master.slug || s.code === master.defaultCode) || {
      id: master.defaultCode || master.id,
      code: master.defaultCode || '',
      shortName: master.shortName,
      uuid: master.knownUuids[0],
      slug: master.slug,
      name: master.name,
      semester: 1,
      year: 1,
      branch: 'B.Tech CSE',
      college: 'Poornima College of Engineering',
      shortDescription: master.shortDescription,
      iconName: master.iconName,
      credits: master.credits,
      totalMaterials: 0,
      units: master.units,
    }
  );
}

/**
 * Unified relationship / filter logic to determine whether a material belongs to a subject.
 * Used identically for:
 * 1. Subject card material count
 * 2. Subject page "Available Materials" count
 * 3. Subject page category counts (Notes, PYQs, etc.)
 * 4. Subject page filtered list of materials
 * 5. Category page per-subject filtering
 */
export function materialBelongsToSubject(
  material: Material,
  subject: Subject | { id: string; code?: string; slug?: string; uuid?: string; name?: string }
): boolean {
  if (!material || !subject) return false;

  // 1. Direct match on subjectId or code (e.g. '261CR104')
  if (material.subjectId && (material.subjectId === subject.id || (subject.code && material.subjectId === subject.code))) {
    return true;
  }
  if (material.subjectCode && ((subject.code && material.subjectCode === subject.code) || material.subjectCode === subject.id)) {
    return true;
  }

  // 2. Direct database UUID match
  if (material.subjectUuid && (subject as any).uuid && material.subjectUuid === (subject as any).uuid) {
    return true;
  }
  if (material.subjectId && (subject as any).uuid && material.subjectId === (subject as any).uuid) {
    return true;
  }

  // 3. Direct slug match
  if (subject.slug && (material.subjectSlug === subject.slug || material.subjectId === subject.slug)) {
    return true;
  }

  // 4. Canonical master subject resolution
  const matMaster = getCanonicalMasterSubject(
    material.subjectCode || material.subjectId || material.subjectUuid || material.subjectSlug || material.subjectName
  );
  const subMaster = getCanonicalMasterSubject(
    subject.code || subject.id || (subject as any).uuid || subject.slug || (subject as any).name
  );

  if (matMaster && subMaster && matMaster.id === subMaster.id) {
    return true;
  }

  return false;
}

export const ALL_MATERIALS: Material[] = [];
