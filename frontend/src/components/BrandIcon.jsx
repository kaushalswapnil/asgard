export default function BrandIcon({ size = 36 }) {
  const id = 'ebp'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <defs>
        {/* Background */}
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>

        {/* Brain arc gradient */}
        <linearGradient id={`${id}-arc`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>

        {/* Node glow */}
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Soft glow */}
        <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Text glow */}
        <filter id={`${id}-textglow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ── Background ── */}
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-bg)`} />

      {/* ── Outer ring ── */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="#38bdf8"
        strokeWidth="0.6" strokeDasharray="2 6" opacity="0.3">
        <animateTransform attributeName="transform" type="rotate"
          from="0 50 50" to="360 50 50" dur="18s" repeatCount="indefinite" />
      </circle>

      {/* ── Inner ring ── */}
      <circle cx="50" cy="50" r="38" fill="none" stroke="#818cf8"
        strokeWidth="0.5" strokeDasharray="4 8" opacity="0.2">
        <animateTransform attributeName="transform" type="rotate"
          from="360 50 50" to="0 50 50" dur="12s" repeatCount="indefinite" />
      </circle>

      {/* ── Neural network connections ── */}
      <g stroke="#38bdf8" strokeWidth="0.7" opacity="0.25">
        {/* Top cluster */}
        <line x1="50" y1="18" x2="34" y2="32" />
        <line x1="50" y1="18" x2="50" y2="34" />
        <line x1="50" y1="18" x2="66" y2="32" />
        {/* Mid left */}
        <line x1="34" y1="32" x2="22" y2="50" />
        <line x1="34" y1="32" x2="34" y2="50" />
        <line x1="34" y1="32" x2="50" y2="34" />
        {/* Mid right */}
        <line x1="66" y1="32" x2="78" y2="50" />
        <line x1="66" y1="32" x2="66" y2="50" />
        <line x1="66" y1="32" x2="50" y2="34" />
        {/* Centre */}
        <line x1="50" y1="34" x2="34" y2="50" />
        <line x1="50" y1="34" x2="50" y2="50" />
        <line x1="50" y1="34" x2="66" y2="50" />
        {/* Bottom cluster */}
        <line x1="22" y1="50" x2="34" y2="66" />
        <line x1="34" y1="50" x2="34" y2="66" />
        <line x1="34" y1="50" x2="50" y2="66" />
        <line x1="50" y1="50" x2="34" y2="66" />
        <line x1="50" y1="50" x2="50" y2="66" />
        <line x1="50" y1="50" x2="66" y2="66" />
        <line x1="66" y1="50" x2="50" y2="66" />
        <line x1="66" y1="50" x2="66" y2="66" />
        <line x1="78" y1="50" x2="66" y2="66" />
      </g>

      {/* ── Pulse travelling along a path ── */}
      <circle r="2" fill="#38bdf8" filter={`url(#${id}-soft)`} opacity="0">
        <animateMotion dur="3s" repeatCount="indefinite"
          path="M50,18 L34,32 L22,50 L34,66 L50,66 L66,50 L78,50 L66,32 L50,18" />
        <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle r="1.5" fill="#818cf8" filter={`url(#${id}-soft)`} opacity="0">
        <animateMotion dur="3s" begin="1.5s" repeatCount="indefinite"
          path="M50,18 L66,32 L78,50 L66,66 L50,66 L34,50 L22,50 L34,32 L50,18" />
        <animate attributeName="opacity" values="0;1;1;0" dur="3s" begin="1.5s" repeatCount="indefinite" />
      </circle>

      {/* ── Neural nodes ── */}
      {/* Top */}
      <circle cx="50" cy="18" r="3.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2"
        filter={`url(#${id}-soft)`}>
        <animate attributeName="r" values="3.5;4.5;3.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="18" r="1.5" fill="#38bdf8" filter={`url(#${id}-glow)`}>
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Mid left outer */}
      <circle cx="22" cy="50" r="3" fill="#0f172a" stroke="#818cf8" strokeWidth="1" />
      <circle cx="22" cy="50" r="1.2" fill="#818cf8" filter={`url(#${id}-soft)`}>
        <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" begin="0.3s" repeatCount="indefinite" />
      </circle>

      {/* Mid left inner */}
      <circle cx="34" cy="32" r="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
      <circle cx="34" cy="32" r="1.2" fill="#38bdf8" filter={`url(#${id}-soft)`}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.2s" begin="0.6s" repeatCount="indefinite" />
      </circle>

      <circle cx="34" cy="50" r="2.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.9" />
      <circle cx="34" cy="50" r="1"   fill="#38bdf8" filter={`url(#${id}-soft)`}>
        <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" begin="0.2s" repeatCount="indefinite" />
      </circle>

      {/* Centre top */}
      <circle cx="50" cy="34" r="3.2" fill="#0f172a" stroke="#a78bfa" strokeWidth="1.1" />
      <circle cx="50" cy="34" r="1.4" fill="#a78bfa" filter={`url(#${id}-glow)`}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.4s" repeatCount="indefinite" />
      </circle>

      {/* Centre */}
      <circle cx="50" cy="50" r="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.4"
        filter={`url(#${id}-soft)`}>
        <animate attributeName="r" values="4;5;4" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="50" r="2" fill="#38bdf8" filter={`url(#${id}-glow)`}>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.6s" repeatCount="indefinite" />
      </circle>

      {/* Mid right inner */}
      <circle cx="66" cy="32" r="3" fill="#0f172a" stroke="#818cf8" strokeWidth="1" />
      <circle cx="66" cy="32" r="1.2" fill="#818cf8" filter={`url(#${id}-soft)`}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="0.9s" repeatCount="indefinite" />
      </circle>

      <circle cx="66" cy="50" r="2.5" fill="#0f172a" stroke="#818cf8" strokeWidth="0.9" />
      <circle cx="66" cy="50" r="1"   fill="#818cf8" filter={`url(#${id}-soft)`}>
        <animate attributeName="opacity" values="1;0.3;1" dur="1.9s" begin="0.4s" repeatCount="indefinite" />
      </circle>

      {/* Mid right outer */}
      <circle cx="78" cy="50" r="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
      <circle cx="78" cy="50" r="1.2" fill="#38bdf8" filter={`url(#${id}-soft)`}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.1s" begin="0.7s" repeatCount="indefinite" />
      </circle>

      {/* Bottom left */}
      <circle cx="34" cy="66" r="3" fill="#0f172a" stroke="#a78bfa" strokeWidth="1" />
      <circle cx="34" cy="66" r="1.2" fill="#a78bfa" filter={`url(#${id}-soft)`}>
        <animate attributeName="opacity" values="1;0.4;1" dur="2.3s" begin="0.5s" repeatCount="indefinite" />
      </circle>

      {/* Bottom centre */}
      <circle cx="50" cy="66" r="3.2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.1" />
      <circle cx="50" cy="66" r="1.4" fill="#38bdf8" filter={`url(#${id}-soft)`}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.7s" begin="0.8s" repeatCount="indefinite" />
      </circle>

      {/* Bottom right */}
      <circle cx="66" cy="66" r="3" fill="#0f172a" stroke="#818cf8" strokeWidth="1" />
      <circle cx="66" cy="66" r="1.2" fill="#818cf8" filter={`url(#${id}-soft)`}>
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" begin="1.1s" repeatCount="indefinite" />
      </circle>

      {/* ── EBP label ── */}
      <text x="50" y="88" textAnchor="middle" fontSize="11" fontWeight="800"
        fontFamily="'Inter', 'Segoe UI', sans-serif" letterSpacing="2"
        fill="url(#ebp-arc)" filter={`url(#${id}-textglow)`}>EBP</text>

      {/* ── Border ── */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="#38bdf8" strokeWidth="0.4" opacity="0.25" />
    </svg>
  )
}
