import { motion } from "framer-motion";

interface StoryIllustrationProps {
  title: string;
  emoji: string;
  category: string;
}

// Seeded hash from title for consistent randomness
function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index * 9301) * 49297;
  return x - Math.floor(x);
}

const CATEGORY_PALETTES: Record<string, { bg: string; accent1: string; accent2: string; pattern: string }> = {
  Science: { bg: "#6366f1", accent1: "#a5b4fc", accent2: "#312e81", pattern: "#818cf8" },
  Tech: { bg: "#0891b2", accent1: "#67e8f9", accent2: "#164e63", pattern: "#22d3ee" },
  World: { bg: "#2563eb", accent1: "#93c5fd", accent2: "#1e3a5f", pattern: "#60a5fa" },
  Sports: { bg: "#16a34a", accent1: "#86efac", accent2: "#14532d", pattern: "#4ade80" },
  Space: { bg: "#1e1b4b", accent1: "#c4b5fd", accent2: "#7c3aed", pattern: "#8b5cf6" },
  Animals: { bg: "#ea580c", accent1: "#fdba74", accent2: "#7c2d12", pattern: "#fb923c" },
  Health: { bg: "#dc2626", accent1: "#fca5a5", accent2: "#7f1d1d", pattern: "#f87171" },
  Fun: { bg: "#d946ef", accent1: "#f0abfc", accent2: "#701a75", pattern: "#e879f9" },
  Culture: { bg: "#d946ef", accent1: "#f0abfc", accent2: "#701a75", pattern: "#e879f9" },
  US: { bg: "#1d4ed8", accent1: "#bfdbfe", accent2: "#7f1d1d", pattern: "#dc2626" },
  Nature: { bg: "#15803d", accent1: "#bbf7d0", accent2: "#14532d", pattern: "#22c55e" },
  Environment: { bg: "#15803d", accent1: "#a7f3d0", accent2: "#064e3b", pattern: "#34d399" },
  Politics: { bg: "#7c3aed", accent1: "#c4b5fd", accent2: "#3b0764", pattern: "#a78bfa" },
  Education: { bg: "#0284c7", accent1: "#bae6fd", accent2: "#0c4a6e", pattern: "#38bdf8" },
};

const DEFAULT_PALETTE = { bg: "#3b82f6", accent1: "#93c5fd", accent2: "#1e40af", pattern: "#60a5fa" };

const StoryIllustration = ({ title, emoji, category }: StoryIllustrationProps) => {
  const hash = hashTitle(title);
  const palette = CATEGORY_PALETTES[category] || DEFAULT_PALETTE;

  // Generate varied decorative elements based on title hash
  const numCircles = 3 + (hash % 4);
  const numStars = 2 + (hash % 3);
  const patternRotation = (hash % 360);

  return (
    <motion.div
      className="relative w-full aspect-[16/10] overflow-hidden border-b-3 border-foreground"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring" }}
    >
      <svg
        viewBox="0 0 480 300"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Halftone dot pattern */}
          <pattern id={`dots-${hash}`} x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="1.5" fill={palette.accent1} opacity="0.3" />
          </pattern>

          {/* Diagonal stripes */}
          <pattern
            id={`stripes-${hash}`}
            x="0" y="0" width="16" height="16"
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${patternRotation % 60 + 30})`}
          >
            <line x1="0" y1="0" x2="0" y2="16" stroke={palette.pattern} strokeWidth="2" opacity="0.15" />
          </pattern>

          {/* Radial gradient for glow */}
          <radialGradient id={`glow-${hash}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.accent1} stopOpacity="0.4" />
            <stop offset="100%" stopColor={palette.bg} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width="480" height="300" fill={palette.bg} />
        <rect width="480" height="300" fill={`url(#dots-${hash})`} />
        <rect width="480" height="300" fill={`url(#stripes-${hash})`} />

        {/* Decorative circles */}
        {Array.from({ length: numCircles }, (_, i) => {
          const cx = 60 + seededRandom(hash, i * 3) * 360;
          const cy = 40 + seededRandom(hash, i * 3 + 1) * 220;
          const r = 20 + seededRandom(hash, i * 3 + 2) * 50;
          return (
            <circle
              key={`c${i}`}
              cx={cx}
              cy={cy}
              r={r}
              fill={i % 2 === 0 ? palette.accent1 : palette.accent2}
              opacity={0.15 + seededRandom(hash, i + 10) * 0.15}
            />
          );
        })}

        {/* Star shapes */}
        {Array.from({ length: numStars }, (_, i) => {
          const cx = 80 + seededRandom(hash, i * 5 + 20) * 320;
          const cy = 30 + seededRandom(hash, i * 5 + 21) * 80;
          const size = 8 + seededRandom(hash, i * 5 + 22) * 12;
          return (
            <g key={`s${i}`} transform={`translate(${cx},${cy})`}>
              <polygon
                points={`0,${-size} ${size*0.3},${-size*0.3} ${size},0 ${size*0.3},${size*0.3} 0,${size} ${-size*0.3},${size*0.3} ${-size},0 ${-size*0.3},${-size*0.3}`}
                fill={palette.accent1}
                opacity="0.6"
              />
            </g>
          );
        })}

        {/* Central glow */}
        <circle cx="240" cy="150" r="120" fill={`url(#glow-${hash})`} />

        {/* Wavy bottom line */}
        <path
          d={`M0 260 Q60 ${240 + (hash % 30)} 120 260 T240 260 T360 260 T480 260 V300 H0Z`}
          fill={palette.accent2}
          opacity="0.3"
        />

        {/* Category badge */}
        <rect x="16" y="12" width={category.length * 10 + 24} height="28" rx="14" fill={palette.accent2} opacity="0.8" />
        <text x="28" y="31" fontFamily="Bangers, cursive" fontSize="14" fill="white" letterSpacing="1">
          {category.toUpperCase()}
        </text>
      </svg>

      {/* Large emoji overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.span
          className="text-7xl md:text-8xl drop-shadow-lg select-none"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          style={{ textShadow: "3px 3px 0px rgba(0,0,0,0.2)" }}
        >
          {emoji}
        </motion.span>
      </div>
    </motion.div>
  );
};

export default StoryIllustration;
