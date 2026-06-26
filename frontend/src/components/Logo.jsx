// ═══════════════════════════════════════════════════
// COMPONENTS/LOGO.JSX — Logo Lightweight AI Platform
// ═══════════════════════════════════════════════════
export default function Logo({ size = 32, color = '#60A5FA' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160">
      <circle cx="80" cy="65" r="38" fill="none" stroke={color} strokeWidth="4" />
      <path d="M88 40 L62 70 L78 70 L72 100 L98 68 L82 68 Z" fill={color} />
    </svg>
  );
}