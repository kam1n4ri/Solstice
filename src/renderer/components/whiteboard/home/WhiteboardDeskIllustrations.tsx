import React from 'react';

export const ArchitectureIllustration: React.FC = () => (
  <svg viewBox="0 0 240 130" className="w-full h-full select-none" fill="none">
    {/* API Gate Node */}
    <rect x="20" y="45" width="62" height="34" rx="6" fill="#ffffff" stroke="#1e293b" strokeWidth="1.8" />
    <text x="51" y="66" fill="#1e293b" fontSize="9" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
      API Gate
    </text>

    {/* Connector: API Gate -> Sync Bus */}
    <path d="M 82 62 C 100 62, 95 48, 114 48" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" />

    {/* Sync Bus Node */}
    <rect x="114" y="32" width="60" height="34" rx="6" fill="#fef3c7" stroke="#d97706" strokeWidth="1.8" />
    <text x="144" y="53" fill="#92400e" fontSize="9" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
      Sync Bus
    </text>

    {/* Connector: Sync Bus -> SQLite */}
    <path d="M 174 50 C 190 50, 185 70, 196 70" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" />

    {/* SQLite Cylinder Database */}
    <g transform="translate(196, 56)">
      <path d="M 0 6 L 0 20 C 0 25, 28 25, 28 20 L 28 6 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="1.8" />
      <ellipse cx="14" cy="6" rx="14" ry="5.5" fill="#ffffff" stroke="#1e293b" strokeWidth="1.8" />
      <text x="14" y="17" fill="#1e293b" fontSize="7.5" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
        SQLite
      </text>
    </g>
  </svg>
);

export const WireframeIllustration: React.FC = () => (
  <svg viewBox="0 0 240 130" className="w-full h-full select-none" fill="none">
    {/* Left Phone */}
    <g transform="translate(48, 14)">
      <rect width="44" height="88" rx="8" fill="#ffffff" stroke="#1e293b" strokeWidth="1.8" />
      <circle cx="22" cy="38" r="11" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
      <rect x="8" y="70" width="28" height="9" rx="4.5" fill="#f59e0b" />
    </g>

    {/* Dashed Flow Connector with Arrowhead */}
    <path
      d="M 98 58 C 114 58, 120 44, 134 44"
      stroke="#94a3b8"
      strokeWidth="1.8"
      strokeDasharray="4 4"
      strokeLinecap="round"
    />
    <polygon points="132,40 138,44 132,48" fill="#94a3b8" />

    {/* Right Phone */}
    <g transform="translate(142, 14)">
      <rect width="44" height="88" rx="8" fill="#ffffff" stroke="#1e293b" strokeWidth="1.8" />
      <rect x="7" y="10" width="30" height="9" rx="3" fill="#a7f3d0" />
      <rect x="7" y="26" width="30" height="34" rx="4" fill="#f1f5f9" />
      <circle cx="22" cy="74" r="5" stroke="#cbd5e1" strokeWidth="1.5" />
    </g>
  </svg>
);

export const RetroIllustration: React.FC = () => (
  <svg viewBox="0 0 240 130" className="w-full h-full select-none" fill="none">
    {/* Note 1 (Mint) */}
    <g transform="translate(34, 26) rotate(-4)">
      <rect width="42" height="44" rx="4" fill="#a7f3d0" stroke="#059669" strokeWidth="1.6" />
      <line x1="7" y1="12" x2="35" y2="12" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7" y1="20" x2="35" y2="20" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7" y1="28" x2="24" y2="28" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" />
    </g>

    {/* Note 2 (Pink) */}
    <g transform="translate(94, 26)">
      <rect width="42" height="44" rx="4" fill="#fecdd3" stroke="#e11d48" strokeWidth="1.6" />
      <line x1="7" y1="12" x2="35" y2="12" stroke="#e11d48" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7" y1="20" x2="35" y2="20" stroke="#e11d48" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7" y1="28" x2="26" y2="28" stroke="#e11d48" strokeWidth="1.4" strokeLinecap="round" />
    </g>

    {/* Note 3 (Yellow) */}
    <g transform="translate(154, 24) rotate(4)">
      <rect width="42" height="44" rx="4" fill="#fef08a" stroke="#d97706" strokeWidth="1.6" />
      <line x1="7" y1="12" x2="35" y2="12" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7" y1="20" x2="28" y2="20" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round" />
      {/* Voting dot */}
      <circle cx="32" cy="30" r="4" fill="#f59e0b" />
    </g>

    {/* Swoosh Underline */}
    <path d="M 82 86 C 114 96, 138 96, 160 88" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" />

    {/* Caveat Voting Dots Annotation */}
    <text
      x="122"
      y="99"
      fill="#b45309"
      fontSize="13"
      fontWeight="700"
      textAnchor="middle"
      className="font-caveat"
    >
      voting dots!
    </text>
  </svg>
);

export const NapkinMathIllustration: React.FC = () => (
  <svg viewBox="0 0 240 130" className="w-full h-full select-none" fill="none">
    {/* Formulas */}
    <text
      x="115"
      y="38"
      fill="#1e293b"
      fontSize="12.5"
      fontWeight="700"
      textAnchor="middle"
      className="font-caveat"
    >
      APY = (1 + r/n)ⁿ - 1
    </text>
    <text
      x="115"
      y="53"
      fill="#b45309"
      fontSize="11.5"
      fontWeight="700"
      textAnchor="middle"
      className="font-caveat"
    >
      exponential growth curve
    </text>

    {/* Coordinate Axes */}
    <path d="M 32 60 L 32 104 L 208 104" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />

    {/* Exponential Rising Curve */}
    <path
      d="M 32 102 C 90 102, 142 96, 206 58"
      stroke="#ea580c"
      strokeWidth="2.8"
      strokeLinecap="round"
    />

    {/* Plotted Dot on Curve */}
    <circle cx="156" cy="80" r="4.5" fill="#78350f" />
  </svg>
);

export const FreeformIllustration: React.FC = () => (
  <svg viewBox="0 0 240 130" className="w-full h-full select-none" fill="none">
    <g transform="translate(36, 32)">
      <circle cx="28" cy="28" r="22" stroke="#0284c7" strokeWidth="2" fill="#f0f9ff" />
      <path d="M 52 28 C 76 28, 76 44, 98 44" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3" />
      <rect x="100" y="24" width="40" height="40" rx="6" stroke="#9333ea" strokeWidth="2" fill="#faf5ff" />
      <path d="M 120 74 C 95 90, 60 85, 45 60" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);
