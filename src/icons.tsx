interface IconProps {
  size?: number;
}

export function MoonIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M24,24 m-16,0 a16,16 0 1,0 32,0 a16,16 0 1,0 -32,0 Z
           M32,21 m-14,0 a14,14 0 1,0 28,0 a14,14 0 1,0 -28,0 Z"
      />
    </svg>
  );
}

export function SunIcon({ size = 20 }: IconProps) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const x1 = 24 + 14 * Math.cos(rad);
    const y1 = 24 + 14 * Math.sin(rad);
    const x2 = 24 + 20 * Math.cos(rad);
    const y2 = 24 + 20 * Math.sin(rad);
    return { x1, y1, x2, y2 };
  });

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="10" fill="currentColor" />
      {rays.map((r, i) => (
        <line
          key={i}
          x1={r.x1}
          y1={r.y1}
          x2={r.x2}
          y2={r.y2}
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
