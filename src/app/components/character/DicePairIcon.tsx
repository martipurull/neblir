/**
 * Stylized trio of d10s — pentagonal trapezohedron profile with faceted shading
 * so they read clearly as physical dice at small sizes.
 */
export function DicePairIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 -4 52 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Rear die: slightly behind and to the right */}
      <g transform="translate(18 1) rotate(11 26 18)">
        <DieFacets
          scale={0.9}
          topLight={0.24}
          topRight={0.36}
          bottomLeft={0.5}
          bottomRight={0.64}
        />
      </g>

      {/* Front die: base of the stack */}
      <g transform="translate(0 4) rotate(-7 26 18)">
        <DieFacets
          topLight={0.2}
          topRight={0.32}
          bottomLeft={0.44}
          bottomRight={0.58}
        />
      </g>

      {/* Top die: smaller, perched above where the pair meets (drawn last so it reads in front) */}
      <g transform="translate(11 -3) rotate(4 26 18)">
        <DieFacets
          scale={0.72}
          topLight={0.26}
          topRight={0.38}
          bottomLeft={0.52}
          bottomRight={0.66}
        />
      </g>
    </svg>
  );
}

/** Single d10 silhouette: rhombus split into four facets meeting at a ridge + center hub (like gem facets). */
function DieFacets({
  scale = 1,
  topLight,
  topRight,
  bottomLeft,
  bottomRight,
}: {
  scale?: number;
  topLight: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}) {
  const s = scale;
  /* Kite / trapezohedron “equator” profile: pointed top & bottom */
  const T = { x: 26 * s, y: 4 * s };
  const L = { x: 10 * s, y: 18 * s };
  const B = { x: 26 * s, y: 30 * s };
  const R = { x: 42 * s, y: 18 * s };
  const C = { x: 26 * s, y: 18 * s };

  const fmt = (p: { x: number; y: number }) =>
    `${p.x.toFixed(2)},${p.y.toFixed(2)}`;

  const outline = `M${fmt(T)} L${fmt(L)} L${fmt(B)} L${fmt(R)} Z`;

  return (
    <g strokeLinejoin="round">
      {/* Facet fills — stacked light → dark suggests curved faces */}
      <path
        d={`M${fmt(T)} L${fmt(L)} L${fmt(C)} Z`}
        fill="currentColor"
        fillOpacity={topLight}
      />
      <path
        d={`M${fmt(T)} L${fmt(C)} L${fmt(R)} Z`}
        fill="currentColor"
        fillOpacity={topRight}
      />
      <path
        d={`M${fmt(L)} L${fmt(C)} L${fmt(B)} Z`}
        fill="currentColor"
        fillOpacity={bottomLeft}
      />
      <path
        d={`M${fmt(C)} L${fmt(R)} L${fmt(B)} Z`}
        fill="currentColor"
        fillOpacity={bottomRight}
      />
      {/* Ridge: vertical apex → equator + horizontal across (classic “gem” facet read) */}
      <path
        d={`M${fmt(T)} L${fmt(C)} M${fmt(L)} L${fmt(R)}`}
        stroke="currentColor"
        strokeWidth={1.1 * s}
        strokeOpacity={0.5}
        fill="none"
      />
      {/* Outer rim */}
      <path
        d={outline}
        stroke="currentColor"
        strokeWidth={1.45 * s}
        strokeLinejoin="round"
        fill="none"
      />
      {/* Tiny highlight on the upper “peak” facet — reads as glossy polyhedral die */}
      <ellipse
        cx={26 * s}
        cy={11 * s}
        rx={3.2 * s}
        ry={2 * s}
        fill="currentColor"
        fillOpacity={0.14}
      />
    </g>
  );
}
