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
    id: 'engineering-mathematics',
    code: '1FY2-01',
    name: 'Engineering Mathematics',
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
    id: 'programming-in-c',
    code: '1FY3-06',
    name: 'Programming in C',
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
    id: 'engineering-physics',
    code: '1FY2-02',
    name: 'Engineering Physics',
    shortDescription: 'Wave Optics, Quantum Mechanics, Lasers & Fiber Optics',
    semester: 1,
    year: 1,
    branch: 'B.Tech CSE',
    college: 'Poornima College of Engineering',
    iconName: 'Atom',
    credits: 4,
    totalMaterials: 0,
    units: [
      {
        unitNumber: 1,
        title: 'Wave Optics: Interference & Diffraction',
        keyTopics: ["Newton's Rings Experiment", 'Fraunhofer Diffraction through Single & Double Slit', 'Diffraction Grating', 'Resolving Power'],
      },
      {
        unitNumber: 2,
        title: 'Polarization & Optical Instruments',
        keyTopics: ["Brewster's Law", 'Double Refraction & Nicol Prism', 'Quarter & Half Wave Plates', 'Specific Rotation & Polarimeter'],
      },
      {
        unitNumber: 3,
        title: 'Quantum Mechanics Essentials',
        keyTopics: ['Compton Effect', 'de Broglie Hypothesis', 'Heisenberg Uncertainty Principle', "Schrodinger's Wave Equation"],
      },
      {
        unitNumber: 4,
        title: 'Lasers & Coherence Theory',
        keyTopics: ['Spontaneous vs Stimulated Emission', "Einstein's Coefficients", 'Ruby Laser & He-Ne Laser', 'Industrial Applications'],
      },
      {
        unitNumber: 5,
        title: 'Fiber Optics & Optical Communication',
        keyTopics: ['Acceptance Angle & Numerical Aperture', 'Step-Index vs Graded-Index Fibers', 'Attenuation & Dispersion in Fibers'],
      },
    ],
  },
  {
    id: 'communication-skills',
    code: '1FY1-04',
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
    code: '1FY2-03',
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
    id: 'nsp',
    code: '1FY3-08',
    name: 'NSP',
    shortDescription: 'Numerical Methods & Statistical Programming for Engineering Problems',
    semester: 1,
    year: 1,
    branch: 'B.Tech CSE',
    college: 'Poornima College of Engineering',
    iconName: 'Binary',
    credits: 3,
    totalMaterials: 0,
    units: [
      {
        unitNumber: 1,
        title: 'Numerical Solution of Algebraic & Transcendental Equations',
        keyTopics: ['Bisection Method', 'Regula-Falsi Method', 'Newton-Raphson Method & Convergence Analysis', 'Error Calculations'],
      },
      {
        unitNumber: 2,
        title: 'Interpolation & Finite Differences',
        keyTopics: ['Forward, Backward & Shift Operators', 'Newton Forward & Backward Difference Interpolation', "Lagrange's Interpolation for Unequal Intervals"],
      },
      {
        unitNumber: 3,
        title: 'Numerical Differentiation & Integration',
        keyTopics: ['Numerical Derivatives from Tables', "Trapezoidal Rule", "Simpson's 1/3 and 3/8 Rules", "Weddle's Rule"],
      },
      {
        unitNumber: 4,
        title: 'Numerical Solution of ODEs',
        keyTopics: ["Taylor's Series Method", "Euler's & Modified Euler's Methods", 'Runge-Kutta 4th Order (RK4) Method'],
      },
      {
        unitNumber: 5,
        title: 'Statistical Distributions & Curve Fitting',
        keyTopics: ['Binomial, Poisson & Normal Distribution', 'Method of Least Squares (Straight Line & Parabola)', 'Correlation & Regression'],
      },
    ],
  },
  {
    id: 'mpws',
    code: '1FY3-20',
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
    id: 'beee',
    code: '1FY3-07',
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
];

export const ALL_MATERIALS: Material[] = [];
