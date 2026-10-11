import { AlertTriangle, Hand, Skull, XCircle, Zap, Flame, FlaskConical } from 'lucide-react';
import type { ReactNode } from 'react';

export type HazardKind = 'cables' | 'crt' | 'battery' | 'pcb';
type L3 = { mr: string; hi: string; en: string };

export interface HazardConfig {
  kind: HazardKind;
  pill: L3;
  cue: L3;
}

/* Gradient classes are literal strings so Tailwind's scanner emits them. */
const GRADIENT: Record<HazardKind, string> = {
  cables: 'bg-gradient-to-br from-red-950 via-zinc-900 to-black',
  crt: 'bg-gradient-to-br from-amber-950 via-zinc-900 to-black',
  battery: 'bg-gradient-to-br from-orange-950 via-zinc-900 to-black',
  pcb: 'bg-gradient-to-br from-emerald-950 via-zinc-900 to-black',
};

const PILL_ICON: Record<HazardKind, ReactNode> = {
  cables: <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />,
  crt: <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />,
  battery: <Flame className="h-4 w-4 shrink-0" aria-hidden="true" />,
  pcb: <Skull className="h-4 w-4 shrink-0" aria-hidden="true" />,
};

const PILL_STYLE: Record<HazardKind, string> = {
  cables: 'bg-red-600 text-white',
  crt: 'bg-amber-400 text-black',
  battery: 'bg-orange-500 text-black',
  pcb: 'bg-lime-400 text-black',
};

function pick(v: L3, lang: string) {
  return v[lang as keyof L3] || v.en;
}

const svgProps = {
  viewBox: '0 0 120 80',
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  className: 'h-full w-full',
};

function CablesArt() {
  return (
    <svg {...svgProps}>
      {/* wire bundle */}
      <path d="M8 66 C30 52 45 76 62 62 S95 52 112 64" stroke="#f97316" strokeWidth="5" />
      <path d="M8 70 C30 56 45 80 62 66 S95 56 112 68" stroke="#38bdf8" strokeWidth="5" />
      <path d="M8 62 C30 48 45 72 62 58 S95 48 112 60" stroke="#fafafa" strokeWidth="5" />
      {/* flame */}
      <path
        d="M60 8 C64 20 76 24 76 38 A16 16 0 0 1 44 38 C44 32 48 29 50 25 C51 31 55 32 56 30 C58 24 56 16 60 8 Z"
        fill="#f97316" stroke="#fdba74" strokeWidth="2"
      />
      <path d="M60 28 C63 33 68 35 68 41 A8 8 0 0 1 52 41 C52 37 57 35 60 28 Z" fill="#fde047" />
      {/* red ban circle + diagonal strike */}
      <circle cx="60" cy="31" r="27" stroke="#ef4444" strokeWidth="5" />
      <path d="M41 12 L79 50" stroke="#ef4444" strokeWidth="5" />
    </svg>
  );
}

function CrtArt() {
  return (
    <svg {...svgProps}>
      {/* tube funnel */}
      <path d="M78 24 L104 34 L104 52 L78 62 Z" fill="#52525b" stroke="#a1a1aa" strokeWidth="2" />
      {/* body */}
      <rect x="14" y="12" width="68" height="56" rx="8" fill="#3f3f46" stroke="#d4d4d8" strokeWidth="3" />
      <rect x="22" y="20" width="52" height="40" rx="5" fill="#0c0a09" stroke="#71717a" strokeWidth="2" />
      {/* crack */}
      <path d="M52 20 L46 32 L56 38 L44 48 L50 60" stroke="#fde047" strokeWidth="3" />
      <path d="M46 32 L34 30 M56 38 L68 40" stroke="#fde047" strokeWidth="2" />
      {/* shards */}
      <path d="M62 14 l4 -5 l2 6 z M30 62 l-4 5 l6 1 z" fill="#fde047" />
    </svg>
  );
}

function BatteryArt() {
  return (
    <svg {...svgProps}>
      {/* burst */}
      <path
        d="M60 2 L67 15 L81 8 L79 24 L95 26 L84 38 L98 48 L82 52 L86 68 L70 62 L60 76 L50 62 L34 68 L38 52 L22 48 L36 38 L25 26 L41 24 L39 8 L53 15 Z"
        fill="#ea580c" opacity="0.55"
      />
      {/* swollen battery */}
      <rect x="44" y="12" width="12" height="6" rx="2" fill="#d4d4d8" />
      <path d="M38 22 Q32 40 38 62 Q60 70 82 62 Q88 40 82 22 Q60 16 38 22 Z" fill="#27272a" stroke="#fafafa" strokeWidth="3" />
      <path d="M62 28 L52 44 H60 L56 58 L70 40 H61 Z" fill="#fde047" />
    </svg>
  );
}

function PcbArt() {
  return (
    <svg {...svgProps}>
      {/* board + traces */}
      <rect x="6" y="14" width="108" height="56" rx="6" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
      <path d="M6 30 H34 L42 22 H70 M114 38 H86 L78 46 H50 M6 56 H28 L36 64 H64 M114 58 H96" stroke="#6ee7b7" strokeWidth="2" opacity="0.7" />
      <circle cx="34" cy="30" r="2.5" fill="#fde047" />
      <circle cx="86" cy="38" r="2.5" fill="#fde047" />
      <rect x="82" y="50" width="16" height="10" rx="1" fill="#18181b" stroke="#a1a1aa" />
      {/* flask */}
      <path d="M52 6 H68 M55 6 V24 L42 50 Q40 58 48 58 H72 Q80 58 78 50 L65 24 V6" fill="#022c22" stroke="#fafafa" strokeWidth="3" />
      <path d="M46 44 H74 L78 50 Q80 58 72 58 H48 Q40 58 42 58 Z" fill="#a3e635" />
      {/* corrosive drop */}
      <path d="M60 62 C66 70 68 74 60 78 C52 74 54 70 60 62 Z" fill="#a3e635" stroke="#ecfccb" strokeWidth="1.5" />
    </svg>
  );
}

const ART: Record<HazardKind, () => ReactNode> = {
  cables: () => <CablesArt />,
  crt: () => <CrtArt />,
  battery: () => <BatteryArt />,
  pcb: () => <PcbArt />,
};

export function SafetyHazardBanner({ hazard, lang, alt }: { hazard: HazardConfig; lang: string; alt: string }) {
  const { kind } = hazard;
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative flex h-44 sm:h-48 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-t-2xl px-12 ${GRADIENT[kind]}`}
    >
      <div className="relative h-20 w-32 shrink-0">
        {ART[kind]()}
        {kind === 'crt' && (
          <span className="absolute -right-6 -bottom-1 flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-black">
            <Hand className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        {kind === 'battery' && (
          <Zap className="absolute -right-6 top-0 h-6 w-6 text-yellow-300" aria-hidden="true" />
        )}
        {kind === 'pcb' && (
          <FlaskConical className="absolute -left-6 bottom-0 h-6 w-6 text-lime-300" aria-hidden="true" />
        )}
      </div>
      <span
        className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold leading-tight ${PILL_STYLE[kind]}`}
      >
        {PILL_ICON[kind]}
        <span className="min-w-0 break-words text-center">{pick(hazard.pill, lang)}</span>
      </span>
      <p className="max-w-full break-words text-center text-xs font-medium leading-snug text-zinc-200">
        {pick(hazard.cue, lang)}
      </p>
    </div>
  );
}