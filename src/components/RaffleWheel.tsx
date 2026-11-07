import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { animate } from "framer-motion";
import { randomInt, spinTarget } from "@/lib/raffle";

const CX = 290;
const CY = 262;
const R_SEG = 190;
const PALETTE = [
  { bg: "#17b890", fg: "#ffffff" },
  { bg: "#3b9ae9", fg: "#ffffff" },
  { bg: "#b83f94", fg: "#ffffff" },
  { bg: "#f2b51d", fg: "#ffffff" },
  { bg: "#f4f4f4", fg: "#1c0f3a" },
  { bg: "#f0605d", fg: "#ffffff" },
];

const pt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)] as const;
};

export type RaffleWheelHandle = { spin: () => void };

type Props = {
  entries: string[];
  onSpinStart?: () => void;
  onResult: (index: number) => void;
  disabled?: boolean;
};

export const RaffleWheel = forwardRef<RaffleWheelHandle, Props>(function RaffleWheel(
  { entries, onSpinStart, onResult, disabled },
  ref,
) {
  const n = entries.length;
  const groupRef = useRef<SVGGElement>(null);
  const rotation = useRef(0);
  const controls = useRef<{ stop: () => void } | null>(null);
  const [spinning, setSpinning] = useState(false);

  const setRotation = (deg: number) => {
    rotation.current = deg;
    groupRef.current?.setAttribute("transform", `rotate(${deg} ${CX} ${CY})`);
  };

  useEffect(() => () => controls.current?.stop(), []);

  const spin = useCallback(() => {
    if (spinning || disabled || n < 2) return;
    const winner = randomInt(n);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = rotation.current;
    const to = spinTarget(from, winner, n, reduce ? 2 : 6 + randomInt(3));
    setSpinning(true);
    onSpinStart?.();
    controls.current = animate(from, to, {
      duration: reduce ? 1.2 : 7,
      ease: [0.16, 0.72, 0.1, 1],
      onUpdate: (v) => setRotation(v),
      onComplete: () => {
        setRotation(to % 360);
        setSpinning(false);
        onResult(winner);
      },
    });
  }, [spinning, disabled, n, onSpinStart, onResult]);

  useImperativeHandle(ref, () => ({ spin }), [spin]);

  const slices = useMemo(() => {
    const seg = 360 / n;
    const fontSize = n <= 8 ? 30 : n <= 16 ? 22 : n <= 30 ? 15 : n <= 60 ? 10 : 0;
    const maxChars = n <= 8 ? 11 : n <= 16 ? 14 : 18;
    return entries.map((label, i) => {
      let color = PALETTE[i % PALETTE.length];
      if (n > 1 && i === n - 1 && color === PALETTE[0]) color = PALETTE[3];
      const a1 = i * seg;
      const a2 = (i + 1) * seg;
      const [x1, y1] = pt(a1, R_SEG);
      const [x2, y2] = pt(a2, R_SEG);
      const d =
        n === 1
          ? ""
          : `M ${CX} ${CY} L ${x1} ${y1} A ${R_SEG} ${R_SEG} 0 ${seg > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
      const text = label.length > maxChars ? label.slice(0, maxChars - 1) + "…" : label;
      return { i, d, color, text, mid: a1 + seg / 2, fontSize };
    });
  }, [entries, n]);

  const lights = useMemo(() => Array.from({ length: 24 }, (_, k) => pt(k * 15, 233)), []);
  const notches = useMemo(() => Array.from({ length: 8 }, (_, k) => k * 45), []);

  return (
    <svg
      viewBox="0 0 580 590"
      className={`mx-auto block h-auto w-full max-w-[560px] select-none ${spinning ? "wheel-spinning" : ""}`}
      role="img"
      aria-label="Raffle wheel"
    >
      <defs>
        <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff5a3c" />
          <stop offset="0.55" stopColor="#e0262f" />
          <stop offset="1" stopColor="#a50e24" />
        </linearGradient>
        <linearGradient id="ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb02e" />
          <stop offset="1" stopColor="#e8571f" />
        </linearGradient>
        <linearGradient id="stand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e0262f" />
          <stop offset="1" stopColor="#b3122a" />
        </linearGradient>
        <radialGradient id="gold" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#fff0a8" />
          <stop offset="0.5" stopColor="#e7a928" />
          <stop offset="1" stopColor="#a8660b" />
        </radialGradient>
        <radialGradient id="shine" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* stand (behind the wheel) */}
      <ellipse cx={CX} cy={578} rx={230} ry={10} fill="#000" opacity="0.25" />
      <path d="M170 566 C185 490 230 440 290 440 C350 440 395 490 410 566 Z" fill="url(#stand)" />
      <rect x={135} y={546} width={310} height={26} rx={8} fill="#c4162a" />
      <rect x={135} y={546} width={310} height={8} rx={4} fill="#ff6a4a" opacity="0.7" />

      {/* rim */}
      <circle cx={CX} cy={CY} r={245} fill="url(#rim)" filter="url(#shadow)" />
      <circle cx={CX} cy={CY} r={212} fill="url(#ring)" />
      <circle cx={CX} cy={CY} r={199} fill="#ffffff" />
      {notches.map((a) => {
        const [x, y] = pt(a, 238);
        return <polygon key={a} points="0,-13 9,6 -9,6" fill="#fff" transform={`translate(${x} ${y}) rotate(${a})`} />;
      })}
      <g>
        {lights.map(([x, y], k) => (
          <circle key={k} className="rim-light" cx={x} cy={y} r={4.5} fill="#ffd64a" stroke="#b8860b" strokeWidth={1} />
        ))}
      </g>

      {/* rotating slices */}
      <g ref={groupRef}>
        {n === 0 && <circle cx={CX} cy={CY} r={R_SEG} fill="#6b5f82" />}
        {n === 1 && <circle cx={CX} cy={CY} r={R_SEG} fill={slices[0].color.bg} />}
        {slices.map((s) =>
          n > 1 ? <path key={s.i} d={s.d} fill={s.color.bg} stroke="#ffffff" strokeOpacity="0.55" strokeWidth={1.5} /> : null,
        )}
        {slices.map((s) =>
          s.fontSize ? (
            <g key={`t${s.i}`} transform={`rotate(${s.mid} ${CX} ${CY})`}>
              <text
                x={CX}
                y={CY - R_SEG + 18}
                transform={`rotate(90 ${CX} ${CY - R_SEG + 18})`}
                dominantBaseline="central"
                fontFamily="'Lilita One', Impact, sans-serif"
                fontSize={s.fontSize}
                fill={s.color.fg}
                style={{ letterSpacing: 0.5 }}
              >
                {s.text}
              </text>
            </g>
          ) : null,
        )}
        <circle cx={CX} cy={CY} r={R_SEG} fill="url(#shine)" pointerEvents="none" />
      </g>

      {/* fixed center needle + hub (click to spin) */}
      <circle cx={CX} cy={CY} r={96} fill="none" stroke="#3b9ae9" strokeWidth={2} opacity="0.9" />
      <circle cx={CX} cy={CY} r={101} fill="none" stroke="#f2b51d" strokeWidth={2} opacity="0.9" />
      <g transform={`translate(${CX} ${CY})`} filter="url(#shadow)">
        <polygon points="0,-122 20,-26 -20,-26" fill="url(#gold)" stroke="#8a5a0a" strokeWidth={1.5} />
        <polygon points="0,-122 0,-26 -20,-26" fill="#fff" opacity="0.25" />
      </g>
      <g
        role="button"
        tabIndex={0}
        aria-label="Spin the wheel"
        onClick={spin}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            spin();
          }
        }}
        style={{ cursor: disabled || spinning || n < 2 ? "not-allowed" : "pointer", outline: "none" }}
      >
        <circle cx={CX} cy={CY} r={50} fill="url(#gold)" stroke="#8a5a0a" strokeWidth={2} />
        <circle cx={CX} cy={CY} r={36} fill="url(#gold)" stroke="#fff3b8" strokeWidth={2} />
        <circle cx={CX} cy={CY} r={14} fill="#fff3b8" opacity="0.7" />
      </g>
    </svg>
  );
});
