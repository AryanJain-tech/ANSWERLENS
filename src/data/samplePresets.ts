export interface SamplePreset {
  id: string;
  title: string;
  question: string;
  marks: 2 | 5 | 10;
  sampleTranscript: string;
  hasDiagram: boolean;
  diagramDescription: string;
  uncertainWords: string[];
  mockImageUrl: string;
}

// SVG handwritten paper simulation
function createHandwrittenMockSvg(textLines: string[], hasDiagram: boolean): string {
  const linesSvg = textLines
    .map(
      (line, i) =>
        `<text x="40" y="${60 + i * 28}" font-family="'Courier New', monospace" font-size="16" fill="#1e3a8a" font-weight="600" letter-spacing="0.5">${line}</text>`
    )
    .join('');

  const diagramSvg = hasDiagram
    ? `
    <g transform="translate(40, 290)">
      <rect x="0" y="0" width="120" height="40" rx="4" fill="#f8fafc" stroke="#1e3a8a" stroke-width="2" stroke-dasharray="2,2"/>
      <text x="60" y="24" text-anchor="middle" font-family="'Courier New', monospace" font-size="12" fill="#1e3a8a">Table: R(A,B,C)</text>
      
      <line x1="120" y1="20" x2="180" y2="20" stroke="#1e3a8a" stroke-width="2" marker-end="url(#arrow)"/>
      
      <rect x="180" y="0" width="100" height="40" rx="4" fill="#f8fafc" stroke="#1e3a8a" stroke-width="2"/>
      <text x="230" y="24" text-anchor="middle" font-family="'Courier New', monospace" font-size="12" fill="#1e3a8a">R1(A,B)</text>
      
      <rect x="180" y="55" width="100" height="40" rx="4" fill="#f8fafc" stroke="#1e3a8a" stroke-width="2"/>
      <text x="230" y="80" text-anchor="middle" font-family="'Courier New', monospace" font-size="12" fill="#1e3a8a">R2(B,C)</text>
      
      <path d="M 150 20 L 150 75 L 180 75" fill="none" stroke="#1e3a8a" stroke-width="2"/>
    </g>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
    <defs>
      <pattern id="ruled-lines" width="100" height="28" patternUnits="userSpaceOnUse">
        <line x1="0" y1="27" x2="600" y2="27" stroke="#e2e8f0" stroke-width="1"/>
      </pattern>
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e3a8a"/>
      </marker>
    </defs>
    <rect width="600" height="420" fill="#fffdfa"/>
    <line x1="30" y1="0" x2="30" y2="420" stroke="#fca5a5" stroke-width="1.5"/>
    <rect width="600" height="420" fill="url(#ruled-lines)"/>
    ${linesSvg}
    ${diagramSvg}
    <text x="450" y="405" font-family="'Courier New', monospace" font-size="11" fill="#94a3b8">Page 1/1 - Student Script</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'dbms-normalization',
    title: '5 Marks: DBMS Normalization',
    question: 'Explain normalization in DBMS with an example. Mention 1NF, 2NF and 3NF.',
    marks: 5,
    sampleTranscript: `Ans: Normalisation is a technique in DBMS used to reduce data redundency and avoid insertion, deletion and update anomalies.

1NF (First Normal Form):
- Each column must contain atomic (indivisible) values.
- No multi-valued attributes allowed.

2NF (Second Normal Form):
- Table must already be in 1NF.
- There should be no partial dependancy (non-key attribute must depend on whole candidate key).

3NF (Third Normal Form):
- Must be in 2NF.
- No transitive dependancy (A -> B and B -> C).

Example:
Consider Student_Course table:
(RollNo, Course, Teacher, Teacher_Phone)
Decomposed into:
1. Student(RollNo, Course)
2. Course_Teacher(Course, Teacher, Teacher_Phone)`,
    hasDiagram: true,
    diagramDescription: 'Table decomposition schema showing functional dependency arrows from RollNo to Course and Teacher',
    uncertainWords: ['redundency', 'dependancy', 'anomalies'],
    mockImageUrl: createHandwrittenMockSvg(
      [
        'Ans: Normalisation is a technique in DBMS used',
        'to reduce data redundency and avoid insertion,',
        'deletion and update anomalies.',
        '',
        '1NF (First Normal Form):',
        '- Each column must contain atomic values.',
        '- No multi-valued attributes allowed.',
        '',
        '2NF (Second Normal Form):',
        '- Must be in 1NF.',
        '- No partial dependancy.',
      ],
      true
    ),
  },
  {
    id: 'os-deadlock',
    title: '2 Marks: OS Deadlock & Coffman Conditions',
    question: 'Define deadlock in Operating Systems and state its four necessary conditions.',
    marks: 2,
    sampleTranscript: `A deadlock is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource held by some other process.

Four Coffman conditions:
1. Mutual Exclusion: At least one resource is held in non-shareable mode.
2. Hold and Wait: A process holding resources requests more.
3. No Preemption: Resources cannot be forcibly taken.
4. Circular Wait: P0 waits for P1, P1 waits for P2... Pn waits for P0.`,
    hasDiagram: false,
    diagramDescription: '',
    uncertainWords: ['preemption', 'shareable'],
    mockImageUrl: createHandwrittenMockSvg(
      [
        'Deadlock is a situation where processes are blocked',
        'holding resources and waiting for others.',
        '',
        'Four Coffman conditions:',
        '1. Mutual Exclusion',
        '2. Hold and Wait',
        '3. No Preemption',
        '4. Circular Wait',
      ],
      false
    ),
  },
  {
    id: 'cn-osi-layers',
    title: '10 Marks: OSI Model Layers & Architecture',
    question: 'Explain the 7 layers of the OSI reference model with their primary responsibilities and protocols. Draw a neat diagram.',
    marks: 10,
    sampleTranscript: `OSI (Open Systems Interconnection) reference model is a 7-layer theoretical architecture developed by ISO for network communication.

1. Physical Layer: Transmits raw bitstream over physical media (Cables, Hubs, RS-232).
2. Data Link Layer: Node-to-node framing, error detection (MAC address, Ethernet, Switches).
3. Network Layer: Host-to-host routing and logical addressing (IP, ICMP, Routers).
4. Transport Layer: End-to-end reliability, segmentation and flow control (TCP, UDP).
5. Session Layer: Establishes, manages, and terminates sessions between apps.
6. Presentation Layer: Syntax translation, data encryption/decryption, compression (SSL/TLS, JPEG, ASCII).
7. Application Layer: Network services directly to end users (HTTP, DNS, SMTP, FTP).

Diagram sketched shows horizontal stacks from Layer 7 (Application) down to Layer 1 (Physical) with data encapsulation headers.`,
    hasDiagram: true,
    diagramDescription: '7-layer stacked vertical diagram with arrows indicating encapsulation and peer-to-peer virtual communication',
    uncertainWords: ['encapsulation', 'interconnection', 'segmentation'],
    mockImageUrl: createHandwrittenMockSvg(
      [
        'OSI reference model has 7 layers:',
        '7. Application (HTTP, DNS)',
        '6. Presentation (SSL, ASCII)',
        '5. Session',
        '4. Transport (TCP, UDP)',
        '3. Network (IP, Routers)',
        '2. Data Link (Ethernet, MAC)',
        '1. Physical (Bits, Cables)',
      ],
      true
    ),
  },
];
