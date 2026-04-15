import { useTheme } from '../context/ThemeContext'

export default function BrandIcon({ size = 36 }) {
  const { dark } = useTheme()
  return dark ? <NeonStore size={size} /> : <NaturalStore size={size} />
}

// ── Light Mode: Warm natural store with animations ──────────
function NaturalStore({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="n-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#87CEEB" />
          <stop offset="100%" stopColor="#b8e4f7" />
        </linearGradient>
        <linearGradient id="n-wall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#f5e6c8" />
          <stop offset="100%" stopColor="#e8d0a0" />
        </linearGradient>
        <linearGradient id="n-roof" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#c0392b" />
          <stop offset="100%" stopColor="#96281b" />
        </linearGradient>
        <linearGradient id="n-door" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#8B4513" />
          <stop offset="100%" stopColor="#6B3410" />
        </linearGradient>
        <radialGradient id="n-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFA500" />
        </radialGradient>
        <filter id="n-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Sky background */}
      <circle cx="50" cy="50" r="48" fill="url(#n-sky)" />

      {/* Sun */}
      <circle cx="75" cy="22" r="8" fill="url(#n-sun)" filter="url(#n-glow)">
        <animate attributeName="r" values="7;9;7" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* Sun rays */}
      {[0,45,90,135,180,225,270,315].map((angle, i) => (
        <line key={i}
          x1={75 + Math.cos(angle * Math.PI / 180) * 10}
          y1={22 + Math.sin(angle * Math.PI / 180) * 10}
          x2={75 + Math.cos(angle * Math.PI / 180) * 14}
          y2={22 + Math.sin(angle * Math.PI / 180) * 14}
          stroke="#FFD700" strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
          <animate attributeName="opacity" values="0.4;0.9;0.4"
            dur="3s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
        </line>
      ))}

      {/* Cloud 1 */}
      <g opacity="0.9">
        <animateTransform attributeName="transform" type="translate"
          values="0,0; 8,0; 0,0" dur="8s" repeatCount="indefinite" />
        <ellipse cx="20" cy="28" rx="10" ry="5" fill="white" />
        <ellipse cx="27" cy="25" rx="8"  ry="6" fill="white" />
        <ellipse cx="14" cy="26" rx="6"  ry="4" fill="white" />
      </g>

      {/* Cloud 2 */}
      <g opacity="0.8">
        <animateTransform attributeName="transform" type="translate"
          values="0,0; -5,0; 0,0" dur="11s" repeatCount="indefinite" />
        <ellipse cx="52" cy="20" rx="8"  ry="4" fill="white" />
        <ellipse cx="58" cy="18" rx="6"  ry="5" fill="white" />
        <ellipse cx="46" cy="19" rx="5"  ry="3" fill="white" />
      </g>

      {/* Ground */}
      <ellipse cx="50" cy="84" rx="40" ry="8" fill="#4a7c3f" opacity="0.6" />
      <rect x="10" y="80" width="80" height="10" rx="2" fill="#5a8f4a" opacity="0.5" />

      {/* Store building */}
      <rect x="20" y="50" width="60" height="32" rx="2" fill="url(#n-wall)"
        stroke="#c8a870" strokeWidth="0.8" />

      {/* Roof */}
      <polygon points="15,50 50,30 85,50" fill="url(#n-roof)"
        stroke="#8B2020" strokeWidth="0.8" />
      {/* Roof ridge */}
      <line x1="50" y1="30" x2="50" y2="50" stroke="#8B2020" strokeWidth="0.5" opacity="0.5" />

      {/* Chimney */}
      <rect x="60" y="33" width="6" height="10" rx="1" fill="#c0392b" stroke="#8B2020" strokeWidth="0.5" />
      {/* Smoke */}
      <circle cx="63" cy="30" r="2" fill="#cccccc" opacity="0">
        <animate attributeName="cy"      values="33;20;33"  dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.5;0"   dur="3s" repeatCount="indefinite" />
        <animate attributeName="r"       values="1.5;3;1.5" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="65" cy="28" r="1.5" fill="#cccccc" opacity="0">
        <animate attributeName="cy"      values="33;18;33"  dur="3s" begin="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.4;0"   dur="3s" begin="1s" repeatCount="indefinite" />
        <animate attributeName="r"       values="1;2.5;1"   dur="3s" begin="1s" repeatCount="indefinite" />
      </circle>

      {/* Store sign */}
      <rect x="25" y="52" width="50" height="10" rx="1.5" fill="#c0392b" stroke="#8B2020" strokeWidth="0.5" />
      <rect x="27" y="54" width="14" height="2" rx="0.5" fill="white" opacity="0.9" />
      <rect x="27" y="57" width="10" height="2" rx="0.5" fill="white" opacity="0.7" />
      <rect x="44" y="54" width="12" height="2" rx="0.5" fill="white" opacity="0.9" />
      <rect x="44" y="57" width="16" height="2" rx="0.5" fill="white" opacity="0.7" />
      {/* Sign shimmer */}
      <rect x="25" y="52" width="50" height="10" rx="1.5" fill="white" opacity="0">
        <animate attributeName="opacity" values="0;0.1;0" dur="2.5s" repeatCount="indefinite" />
      </rect>

      {/* Left window */}
      <rect x="23" y="64" width="14" height="12" rx="1" fill="#87CEEB" stroke="#c8a870" strokeWidth="0.6" />
      <line x1="30" y1="64" x2="30" y2="76" stroke="#c8a870" strokeWidth="0.5" />
      <line x1="23" y1="70" x2="37" y2="70" stroke="#c8a870" strokeWidth="0.5" />
      {/* Window light flicker */}
      <rect x="23" y="64" width="14" height="12" rx="1" fill="#FFD700" opacity="0">
        <animate attributeName="opacity" values="0;0.15;0" dur="4s" begin="1s" repeatCount="indefinite" />
      </rect>

      {/* Right window */}
      <rect x="63" y="64" width="14" height="12" rx="1" fill="#87CEEB" stroke="#c8a870" strokeWidth="0.6" />
      <line x1="70" y1="64" x2="70" y2="76" stroke="#c8a870" strokeWidth="0.5" />
      <line x1="63" y1="70" x2="77" y2="70" stroke="#c8a870" strokeWidth="0.5" />
      {/* Window light flicker */}
      <rect x="63" y="64" width="14" height="12" rx="1" fill="#FFD700" opacity="0">
        <animate attributeName="opacity" values="0;0.15;0" dur="4s" begin="2.5s" repeatCount="indefinite" />
      </rect>

      {/* Door */}
      <rect x="41" y="64" width="18" height="18" rx="1.5" fill="url(#n-door)"
        stroke="#c8a870" strokeWidth="0.6" />
      <line x1="50" y1="64" x2="50" y2="82" stroke="#c8a870" strokeWidth="0.5" opacity="0.6" />
      {/* Door handle */}
      <circle cx="47" cy="73" r="1.2" fill="#FFD700" opacity="0.9" />
      <circle cx="53" cy="73" r="1.2" fill="#FFD700" opacity="0.9" />

      {/* Flower pots */}
      <rect x="17" y="77" width="5" height="4" rx="0.5" fill="#c0392b" />
      <circle cx="19.5" cy="75" r="3" fill="#4a7c3f" />
      <circle cx="18" cy="74" r="1.5" fill="#ff6b6b" opacity="0.9">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="21" cy="73" r="1.5" fill="#ff9f43" opacity="0.9">
        <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
      </circle>

      <rect x="78" y="77" width="5" height="4" rx="0.5" fill="#c0392b" />
      <circle cx="80.5" cy="75" r="3" fill="#4a7c3f" />
      <circle cx="79" cy="74" r="1.5" fill="#ff6b6b" opacity="0.9">
        <animate attributeName="opacity" values="1;0.7;1" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="82" cy="73" r="1.5" fill="#ff9f43" opacity="0.9">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* Border */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="#c8a870" strokeWidth="0.5" opacity="0.4" />
    </svg>
  )
}

// ── Dark Mode: Neon cyberpunk store ─────────────────────────
function NeonStore({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="s-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#0a0e1a" />
          <stop offset="100%" stopColor="#060810" />
        </linearGradient>
        <linearGradient id="s-facade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#1a2a4a" />
          <stop offset="100%" stopColor="#080f20" />
        </linearGradient>
        <linearGradient id="s-roof" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#00d4ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0077aa" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="s-win" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00eeff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0055aa" stopOpacity="0.3" />
        </radialGradient>
        <filter id="s-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="s-neon" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="s-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="48" fill="url(#s-bg)" />

      <g style={{ transformOrigin: '50px 50px', animation: 'store-spin 8s linear infinite' }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke="#00d4ff"
          strokeWidth="0.6" strokeDasharray="4 8 12 6 3 10" strokeLinecap="round" opacity="0.5" />
      </g>

      <rect x="22" y="42" width="56" height="34" rx="2" fill="url(#s-facade)"
        stroke="#00d4ff" strokeWidth="0.8" />
      <polygon points="78,42 86,46 86,76 78,76" fill="#060f1e" stroke="#0077aa" strokeWidth="0.5" opacity="0.9" />
      <polygon points="22,42 30,38 86,38 78,42" fill="#0d1f3a" stroke="#00d4ff" strokeWidth="0.5" opacity="0.9" />
      <rect x="18" y="34" width="64" height="6" rx="1" fill="url(#s-roof)" filter="url(#s-neon)" />
      <line x1="18" y1="34" x2="82" y2="34" stroke="#00eeff" strokeWidth="1.2" filter="url(#s-glow)" opacity="0.9" />

      <line x1="50" y1="34" x2="50" y2="18" stroke="#00d4ff" strokeWidth="0.8" opacity="0.7" />
      <circle cx="50" cy="17" r="2.5" fill="#00eeff" filter="url(#s-glow)">
        <animate attributeName="r"       values="2;3.5;2"   dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite" />
      </circle>

      <rect x="28" y="44" width="44" height="10" rx="1.5" fill="#020810" stroke="#00d4ff" strokeWidth="0.6" />
      <rect x="31" y="46.5" width="12" height="1.5" rx="0.5" fill="#00eeff" filter="url(#s-soft)" opacity="0.9" />
      <rect x="31" y="49.5" width="8"  height="1.5" rx="0.5" fill="#00eeff" filter="url(#s-soft)" opacity="0.7" />
      <rect x="45" y="46.5" width="10" height="1.5" rx="0.5" fill="#00d4ff" filter="url(#s-soft)" opacity="0.9" />
      <rect x="45" y="49.5" width="14" height="1.5" rx="0.5" fill="#00d4ff" filter="url(#s-soft)" opacity="0.7" />

      <rect x="40" y="60" width="20" height="16" rx="1" fill="#020810" stroke="#00d4ff" strokeWidth="0.6" />
      <line x1="50" y1="60" x2="50" y2="76" stroke="#00d4ff" strokeWidth="0.5" opacity="0.6" />
      <circle cx="47" cy="68" r="1" fill="#00d4ff" opacity="0.8" />
      <circle cx="53" cy="68" r="1" fill="#00d4ff" opacity="0.8" />

      <rect x="25" y="56" width="12" height="10" rx="1" fill="#020d1f" stroke="#0077aa" strokeWidth="0.5" />
      <rect x="26" y="57" width="10" height="8"  rx="0.5" fill="url(#s-win)" opacity="0.4" />
      <rect x="63" y="56" width="12" height="10" rx="1" fill="#020d1f" stroke="#0077aa" strokeWidth="0.5" />
      <rect x="64" y="57" width="10" height="8"  rx="0.5" fill="url(#s-win)" opacity="0.4" />

      <rect x="22" y="50" width="56" height="1" fill="#00eeff" opacity="0" filter="url(#s-soft)">
        <animate attributeName="y"       values="42;76;42"  dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.4;0"   dur="4s" repeatCount="indefinite" />
      </rect>

      <circle cx="22" cy="42" r="1.5" fill="#00d4ff" filter="url(#s-neon)">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="78" cy="42" r="1.5" fill="#00d4ff" filter="url(#s-neon)">
        <animate attributeName="opacity" values="1;0.5;1"   dur="2s" repeatCount="indefinite" />
      </circle>

      <circle cx="50" cy="50" r="48" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.25" />

      <style>{`
        @keyframes store-spin { to { transform: rotate(360deg); } }
      `}</style>
    </svg>
  )
}
