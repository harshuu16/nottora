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

export const SUBJECTS: Subject[] = [
  {
    id: 'communication-skills',
    slug: 'communication-skills',
    code: '261FY507',
    name: 'Communication Skills',
    shortDescription: 'Technical Writing, Business Correspondence, Phonetics & Presentation',
    semester: 1,
    year: 1,
    branch: 'B.Tech CSE',
    college: 'Poornima College of Engineering',
    iconName: 'MessagesSquare',
    credits: 2,
    totalMaterials: 0,
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
    code: '261FY101',
    name: 'Chemistry',
    shortDescription: 'Water Technology, Fuels, Polymers, Corrosion & Nanomaterials',
    semester: 1,
    year: 1,
    branch: 'B.Tech CSE',
    college: 'Poornima College of Engineering',
    iconName: 'Beaker',
    credits: 4,
    totalMaterials: 0,
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
    id: 'beee',
    slug: 'beee',
    code: '261CR104',
    name: 'BEEE',
    shortDescription: 'Basic Electrical & Electronics Engineering — DC/AC Circuits, Transformers & Diodes',
    semester: 1,
    year: 1,
    branch: 'B.Tech CSE',
    college: 'Poornima College of Engineering',
    iconName: 'Zap',
    credits: 3,
    totalMaterials: 0,
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
    id: 'mathematics',
    slug: 'mathematics',
    code: '261FY103',
    name: 'Mathematics',
    shortDescription: 'Calculus, Matrices, Vector Calculus & Differential Equations',
    semester: 1,
    year: 1,
    branch: 'B.Tech CSE',
    college: 'Poornima College of Engineering',
    iconName: 'Calculator',
    credits: 4,
    totalMaterials: 0,
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
    code: '261FY629',
    name: 'MPWS',
    shortDescription: 'Manufacturing Practices Workshop — Fitting, Carpentry, Foundry & Welding',
    semester: 1,
    year: 1,
    branch: 'B.Tech CSE',
    college: 'Poornima College of Engineering',
    iconName: 'Wrench',
    credits: 2,
    totalMaterials: 0,
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
    code: '261FY106',
    name: 'C Programming',
    shortDescription: 'Syntax, Control Flow, Functions, Pointers, Arrays & File Handling',
    semester: 1,
    year: 1,
    branch: 'B.Tech CSE',
    college: 'Poornima College of Engineering',
    iconName: 'Code2',
    credits: 3,
    totalMaterials: 0,
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
    code: '261FY526',
    name: 'Language Lab',
    shortDescription: 'Phonetics, Listening Comprehension, Accent Training & Conversational Practice',
    semester: 1,
    year: 1,
    branch: 'B.Tech CSE',
    college: 'Poornima College of Engineering',
    iconName: 'Languages',
    credits: 2,
    totalMaterials: 0,
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
    code: '261CR124',
    name: 'WPL',
    shortDescription: 'Web Programming Lab — HTML5, CSS3, JavaScript Basics, Responsive Design & DOM',
    semester: 1,
    year: 1,
    branch: 'B.Tech CSE',
    college: 'Poornima College of Engineering',
    iconName: 'Globe',
    credits: 2,
    totalMaterials: 0,
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
];

export const ALL_MATERIALS: Material[] = [];
