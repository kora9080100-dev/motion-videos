import { useState } from 'react';
import type { HintView, RoomView, SecretView } from '../../shared/types';
import { Avatar } from '../components/ui';
import { playerById, ghostPlayer } from '../lib/view';

export function SpectatorNote() {
  return (
    <section className="card center stack" data-testid="spectator">
      <span className="big-emoji">👀</span>
      <b style={{ fontSize: 19 }}>أنت تتفرج على هذي الجولة</b>
      <p className="dim small">دخلت والجولة شغالة، بتلعب معنا من الجولة الجاية إن شاء الله.</p>
    </section>
  );
}

/** Small tap-to-peek reminder of the player's own role during hints and voting. */
export function MiniSecret({ secret }: { secret: SecretView | null }) {
  const [show, setShow] = useState(false);
  if (!secret || secret.role === 'spectator') return null;
  const value =
    secret.role === 'liar'
      ? `أنت الكذّاب 😈${secret.category ? ` • ${secret.category.emoji} ${secret.category.name}` : ''}`
      : `${secret.word} • ${secret.category.emoji} ${secret.category.name}`;
  return (
    <button className="mini-secret" onClick={() => setShow((s) => !s)} aria-pressed={show}>
      <span style={{ fontSize: 22 }}>{show ? '🙈' : '👁️'}</span>
      <span style={{ flex: 1 }}>
        <span className="tiny muted" style={{ display: 'block' }}>
          {show ? 'اضغط للإخفاء' : 'دورك (اضغط عشان تشوفه)'}
        </span>
        <span className={`value ${show ? '' : 'blur'}`} aria-hidden={!show}>
          {show ? value : 'كلمة سرية مخفية'}
        </span>
      </span>
    </button>
  );
}

export function HintFeed({ view, hints }: { view: RoomView; hints: HintView[] }) {
  if (hints.length === 0) {
    return <p className="center muted small">ما فيه تلميحات للحين… أول تلميح بيظهر هنا</p>;
  }
  const rounds = [...new Set(hints.map((h) => h.hintRound))];
  return (
    <div className="hint-feed" data-testid="hint-feed">
      {rounds.map((r) => (
        <div key={r} className="hint-feed">
          {rounds.length > 1 && <div className="hint-round-label">— الجولة {r} —</div>}
          {hints
            .filter((h) => h.hintRound === r)
            .map((h, i) => {
              const p = playerById(view, h.playerId);
              return (
                <div key={`${r}-${i}`} className={`hint ${h.playerId === view.meId ? 'mine' : ''} ${h.text === null ? 'skipped' : ''}`}>
                  <Avatar player={p ?? ghostPlayer(h.nickname)} size="sm" />
                  <div className="bubble">
                    <div className="who">{h.nickname}</div>
                    <div className="txt">{h.text ?? '⏭️ ما كتب تلميح'}</div>
                  </div>
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}
