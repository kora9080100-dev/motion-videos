import { useState } from 'react';
import type { PointReason, RoomView, RoundResultView } from '../../shared/types';
import { Scoreboard } from '../components/Scoreboard';
import { Avatar, Button, Dots } from '../components/ui';
import { useOnChange, vibrate } from '../lib/hooks';
import { game } from '../lib/store';
import { toast } from '../lib/toasts';
import { ghostPlayer, isHost, playerById } from '../lib/view';
import { HintFeed } from './shared';

const REASON_LABEL: Record<PointReason, string> = {
  correct_vote: 'صوت صح',
  liar_escaped: 'فلت',
  liar_guessed: 'خمّن الكلمة',
};

function outcome(r: RoundResultView, meIsLiar: boolean): { text: string; tone: 'win' | 'lose' | 'neutral' } {
  if (r.reason === 'liar_left') return { text: 'الكذّاب طلع من اللعبة 🏃 الجولة بدون نقاط', tone: 'neutral' };
  if (r.reason === 'not_enough_players') return { text: 'الجولة انلغت لأن اللاعبين صاروا أقل من ٣', tone: 'neutral' };
  if (!r.caught) return meIsLiar ? { text: 'فلتّ منهم! 😈 +٣ نقاط لك', tone: 'win' } : { text: 'الكذّاب فلت منكم! 😈', tone: 'lose' };
  if (r.guess?.correct)
    return meIsLiar
      ? { text: 'انكشفت… بس خمّنت الكلمة صح! 🎯', tone: 'win' }
      : { text: 'انكشف… بس خمّن الكلمة صح! 😈', tone: 'lose' };
  return meIsLiar ? { text: 'انكشفت وما خمّنت الكلمة 😅', tone: 'lose' } : { text: 'كشفتوا الكذّاب! 🎉', tone: 'win' };
}

export function Results({ view }: { view: RoomView }) {
  const r = view.result;
  const host = isHost(view);
  const [busy, setBusy] = useState<'again' | 'lobby' | null>(null);

  useOnChange(r?.roundNumber, () => vibrate(80));

  if (!r) return null;
  const meIsLiar = r.liarId === view.meId;
  const liar = playerById(view, r.liarId);
  const o = outcome(r, meIsLiar);
  const myPoints = r.points.find((p) => p.playerId === view.meId);

  async function again() {
    setBusy('again');
    const res = await game.send('round:start');
    setBusy(null);
    if (!res.ok) toast(res.error, 'error');
  }

  async function lobby() {
    setBusy('lobby');
    const res = await game.send('room:lobby');
    setBusy(null);
    if (!res.ok) toast(res.error, 'error');
  }

  return (
    <>
      <section className="card stack" data-testid="results">
        <div className="reveal-hero">
          <span className="kicker">الكذّاب كان…</span>
          <Avatar player={liar ?? ghostPlayer(r.liarName)} size="xl" />
          <div className="liar-name" data-testid="liar-name">
            {r.liarName}
            {meIsLiar && <span className="muted" style={{ fontSize: 18 }}> (أنت!)</span>}
          </div>
        </div>
        <div className="word-reveal">
          <span className="dim">الكلمة السرية:</span>
          <span className="w" data-testid="result-word">
            {r.word}
          </span>
          <span className="badge">
            {r.category.emoji} {r.category.name}
          </span>
        </div>
        {r.guess && (
          <p className="center small dim">
            {r.guess.word ? `خمّن الكذّاب: «${r.guess.word}» ${r.guess.correct ? '✅' : '❌'}` : 'الكذّاب ما لحق يخمّن ⏰'}
          </p>
        )}
        <div className={`outcome ${o.tone}`} data-testid="outcome">
          {o.text}
        </div>
        {myPoints && myPoints.delta > 0 && (
          <p className="center" style={{ fontWeight: 900, color: 'var(--green)' }}>
            كسبت +{myPoints.delta} ({myPoints.reasons.map((x) => REASON_LABEL[x]).join(' + ')})
          </p>
        )}
      </section>

      {r.reason === 'normal' && r.votes.length > 0 && (
        <section className="card">
          <div className="card-title">🗳️ مين صوّت على مين؟</div>
          <div className="vote-list">
            {r.votes.map((v) => (
              <div key={v.voterId} className={`vote-line ${v.targetId === r.liarId ? 'correct' : ''}`}>
                <b>{v.voterName}</b>
                <span className="arrow">←</span>
                <span>{v.targetName}</span>
                <span className="mark">{v.targetId === r.liarId ? '✅' : '❌'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-title">🏆 لوحة النقاط</div>
        <Scoreboard view={view} showDeltas />
      </section>

      {view.hints.length > 0 && (
        <details className="card">
          <summary className="card-title" style={{ marginBottom: 0, cursor: 'pointer' }}>
            🗨️ تلميحات الجولة
          </summary>
          <div style={{ marginTop: 12 }}>
            <HintFeed view={view} hints={view.hints} />
          </div>
        </details>
      )}

      <div className="action-bar">
        {host ? (
          <>
            <Button size="lg" block onClick={again} loading={busy === 'again'} disabled={busy !== null} data-testid="play-again">
              🔁 جولة جديدة
            </Button>
            <Button variant="ghost" size="sm" block onClick={lobby} loading={busy === 'lobby'} disabled={busy !== null}>
              ⚙️ رجوع للغرفة والإعدادات
            </Button>
          </>
        ) : (
          <div className="waiting">
            ننتظر المضيف يبدأ جولة جديدة <Dots />
          </div>
        )}
      </div>
    </>
  );
}
