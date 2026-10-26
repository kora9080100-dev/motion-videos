import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { Phase, PlayerView } from '../../shared/types';
import { useCountdown } from '../lib/hooks';
import { useToasts } from '../lib/toasts';

export function LogoMark({ size = 96 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9a6bff" />
          <stop offset="1" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="lm-o" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb04d" />
          <stop offset="1" stopColor="#ff5e1a" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#lm-g)" />
      <path d="M10 33c5.5-9 13-13.5 22-13.5S48.5 24 54 33c-5.5 9-13 13.5-22 13.5S15.5 42 10 33z" fill="#140b26" />
      <g className="pupil">
        <circle cx="32" cy="33" r="9.5" fill="url(#lm-o)" />
        <circle cx="35" cy="30" r="3" fill="#fff" opacity=".9" />
      </g>
      <path d="M20 14l3 5M44 14l-3 5M32 10v6" stroke="#ffb04d" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

const AVATAR_GRADIENTS = [
  ['#ff9a3d', '#ff5e1a'],
  ['#a78bfa', '#6d28d9'],
  ['#34d399', '#059669'],
  ['#60a5fa', '#2563eb'],
  ['#f472b6', '#db2777'],
  ['#facc15', '#ca8a04'],
  ['#22d3ee', '#0891b2'],
  ['#fb7185', '#e11d48'],
  ['#c084fc', '#9333ea'],
  ['#a3e635', '#65a30d'],
];

export function Avatar({
  player,
  size,
  showStatus = false,
  showCrown = false,
  className = '',
}: {
  player: Pick<PlayerView, 'nickname' | 'avatar' | 'connected' | 'isHost'>;
  size?: 'sm' | 'lg' | 'xl';
  showStatus?: boolean;
  showCrown?: boolean;
  className?: string;
}) {
  const [a, b] = AVATAR_GRADIENTS[player.avatar % AVATAR_GRADIENTS.length]!;
  const letter = Array.from(player.nickname.trim())[0] ?? '؟';
  return (
    <span
      className={`avatar ${size ?? ''} ${showStatus && !player.connected ? 'offline' : ''} ${className}`}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
      aria-hidden="true"
    >
      {letter}
      {showCrown && player.isHost && <span className="crown">👑</span>}
      {showStatus && <span className="dot" />}
    </span>
  );
}

export function Button({
  variant = 'primary',
  size,
  block,
  loading,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'purple' | 'ghost' | 'danger';
  size?: 'lg' | 'sm' | 'xs';
  block?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} ${size ?? ''} ${block ? 'block' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spinner" /> : children}
    </button>
  );
}

export function Timer({ endsAt, size = 64 }: { endsAt: number | null; size?: number }) {
  const cd = useCountdown(endsAt);
  if (!cd) return null;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={`timer ${cd.seconds <= 5 ? 'urgent' : ''}`}
      style={{ ['--size' as string]: `${size}px` }}
      role="timer"
      aria-label={`باقي ${cd.seconds} ثانية`}
    >
      <svg viewBox="0 0 64 64">
        <defs>
          <linearGradient id="timer-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffb04d" />
            <stop offset="1" stopColor="#ff5e1a" />
          </linearGradient>
        </defs>
        <circle className="track" cx="32" cy="32" r={r} fill="none" strokeWidth="6" />
        <circle
          className="prog"
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - cd.fraction)}
        />
      </svg>
      <span className="num">{cd.seconds}</span>
    </div>
  );
}

export function Dots() {
  return (
    <span className="dots" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <div className="row" style={{ marginBottom: 6 }}>
          <h2 style={{ marginBottom: 0 }}>{title}</h2>
          <span className="spacer" />
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق">
            ✕
          </button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useToasts();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function ConnectionBanner({ show }: { show: boolean }) {
  // Wait a moment before showing, so quick blips don't flash a warning.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [show]);
  if (!visible) return null;
  return (
    <div className="conn-banner" role="status">
      <span className="spinner" />
      <span>انقطع الاتصال… نحاول نرجعك للغرفة</span>
    </div>
  );
}

const STEPS: { phase: Phase[]; label: string; icon: string }[] = [
  { phase: ['lobby'], label: 'الانتظار', icon: '🛋️' },
  { phase: ['reveal'], label: 'الدور السري', icon: '🤫' },
  { phase: ['hints'], label: 'التلميحات', icon: '💬' },
  { phase: ['voting', 'guess'], label: 'التصويت', icon: '🗳️' },
  { phase: ['results'], label: 'النتيجة', icon: '🏆' },
];

export function PhaseStepper({ phase }: { phase: Phase }) {
  const idx = STEPS.findIndex((s) => s.phase.includes(phase));
  return (
    <nav className="stepper" aria-label="مراحل الجولة">
      {STEPS.map((s, i) => (
        <div
          key={s.label}
          className={`s ${i < idx ? 'done' : ''} ${i === idx ? 'now' : ''}`}
          aria-current={i === idx ? 'step' : undefined}
        >
          <span className="ico">{s.icon}</span>
          <span className="bar" />
          <span>{s.label}</span>
        </div>
      ))}
    </nav>
  );
}

export function PhaseHead({ title, subtitle, endsAt, icon }: { title: string; subtitle?: ReactNode; endsAt?: number | null; icon?: string }) {
  return (
    <div className="phase-head">
      {icon && <span style={{ fontSize: 40, lineHeight: 1 }}>{icon}</span>}
      <div className="grow">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {endsAt !== undefined && <Timer endsAt={endsAt} />}
    </div>
  );
}
