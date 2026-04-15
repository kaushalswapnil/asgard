export default function AutobotIcon({ size = 32, glow = false, spin = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: glow
          ? 'drop-shadow(0 0 6px #e53e3e) drop-shadow(0 0 12px #ff6b35)'
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
        animation: spin ? 'autobot-spin 8s linear infinite' : undefined,
        flexShrink: 0,
      }}
    >
      <defs>
        {/* Metallic red gradient */}
        <linearGradient id="redMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ff6b35" />
          <stop offset="35%"  stopColor="#e53e3e" />
          <stop offset="70%"  stopColor="#c0392b" />
          <stop offset="100%" stopColor="#7b1a1a" />
        </linearGradient>
        {/* Silver gradient for details */}
        <linearGradient id="silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#e8e8e8" />
          <stop offset="50%"  stopColor="#a0a0a0" />
          <stop offset="100%" stopColor="#606060" />
        </linearGradient>
        {/* Blue eye glow */}
        <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00d4ff" stopOpacity="1" />
          <stop offset="60%"  stopColor="#0099cc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#004466" stopOpacity="0.6" />
        </radialGradient>
        {/* Dark base */}
        <linearGradient id="darkBase" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#2d2d2d" />
          <stop offset="100%" stopColor="#111111" />
        </linearGradient>
        <filter id="eyeBlur">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ── Outer shield / base ── */}
      <polygon
        points="50,4 92,22 96,62 50,96 4,62 8,22"
        fill="url(#darkBase)"
        stroke="#333"
        strokeWidth="1.5"
      />

      {/* ── Main face plate ── */}
      {/* Forehead crest */}
      <polygon
        points="50,10 68,20 68,32 50,38 32,32 32,20"
        fill="url(#redMetal)"
        stroke="#ff8c5a"
        strokeWidth="0.8"
      />
      {/* Center crest spike */}
      <polygon
        points="50,6 55,16 50,20 45,16"
        fill="url(#silver)"
        stroke="#ccc"
        strokeWidth="0.5"
      />

      {/* ── Cheek plates ── */}
      <polygon points="20,30 32,26 32,52 20,56" fill="url(#redMetal)" stroke="#c0392b" strokeWidth="0.8" />
      <polygon points="80,30 68,26 68,52 80,56" fill="url(#redMetal)" stroke="#c0392b" strokeWidth="0.8" />

      {/* ── Face center ── */}
      <rect x="32" y="32" width="36" height="32" rx="4" fill="url(#darkBase)" stroke="#444" strokeWidth="1" />

      {/* ── Eyes ── */}
      {/* Left eye housing */}
      <rect x="35" y="36" width="12" height="8" rx="2" fill="#001a2e" stroke="#0077aa" strokeWidth="0.8" />
      {/* Left eye glow */}
      <ellipse cx="41" cy="40" rx="4.5" ry="3" fill="url(#eyeGlow)" filter="url(#eyeBlur)" />
      <ellipse cx="41" cy="40" rx="2.5" ry="1.8" fill="#00eeff" opacity="0.9" />
      <ellipse cx="40" cy="39.2" rx="1" ry="0.7" fill="#ffffff" opacity="0.7" />

      {/* Right eye housing */}
      <rect x="53" y="36" width="12" height="8" rx="2" fill="#001a2e" stroke="#0077aa" strokeWidth="0.8" />
      {/* Right eye glow */}
      <ellipse cx="59" cy="40" rx="4.5" ry="3" fill="url(#eyeGlow)" filter="url(#eyeBlur)" />
      <ellipse cx="59" cy="40" rx="2.5" ry="1.8" fill="#00eeff" opacity="0.9" />
      <ellipse cx="58" cy="39.2" rx="1" ry="0.7" fill="#ffffff" opacity="0.7" />

      {/* ── Nose bridge ── */}
      <rect x="47" y="38" width="6" height="4" rx="1" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />

      {/* ── Mouth / grille ── */}
      <rect x="36" y="48" width="28" height="10" rx="2" fill="#0a0a0a" stroke="#333" strokeWidth="0.8" />
      {/* Grille lines */}
      {[40, 44, 48, 52, 56, 60].map(x => (
        <line key={x} x1={x} y1="49" x2={x} y2="57" stroke="#e53e3e" strokeWidth="0.8" opacity="0.7" />
      ))}
      {/* Mouth highlight */}
      <rect x="36" y="48" width="28" height="2" rx="1" fill="#ff6b35" opacity="0.3" />

      {/* ── Chin plate ── */}
      <polygon points="36,58 64,58 60,68 40,68" fill="url(#redMetal)" stroke="#c0392b" strokeWidth="0.8" />

      {/* ── Neck / lower body ── */}
      <polygon points="40,68 60,68 65,82 35,82" fill="url(#darkBase)" stroke="#333" strokeWidth="1" />

      {/* ── Chest Autobot symbol (simplified A) ── */}
      <polygon points="50,70 56,80 44,80" fill="url(#redMetal)" stroke="#ff8c5a" strokeWidth="0.6" />
      <line x1="46" y1="76" x2="54" y2="76" stroke="#ff8c5a" strokeWidth="1.2" />

      {/* ── Shoulder bolts ── */}
      <circle cx="22" cy="42" r="4" fill="url(#silver)" stroke="#888" strokeWidth="0.8" />
      <circle cx="22" cy="42" r="2" fill="#444" />
      <circle cx="78" cy="42" r="4" fill="url(#silver)" stroke="#888" strokeWidth="0.8" />
      <circle cx="78" cy="42" r="2" fill="#444" />

      {/* ── Outer edge highlights ── */}
      <polygon
        points="50,4 92,22 96,62 50,96 4,62 8,22"
        fill="none"
        stroke="#ff6b35"
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  )
}
