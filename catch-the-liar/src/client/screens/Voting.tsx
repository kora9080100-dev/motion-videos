import { useEffect, useState } from 'react';
import type { RoomView } from '../../shared/types';
import { Avatar, Button, PhaseHead } from '../components/ui';
import { game } from '../lib/store';
import { toast } from '../lib/toasts';
import { playerById } from '../lib/view';
import { HintFeed, MiniSecret, SpectatorNote } from './shared';

export function Voting({ view }: { view: RoomView }) {
  const participants = view.players.filter((p) => p.inRound);
  const spectator = view.secret?.role === 'spectator' || !participants.some((p) => p.id === view.meId);
  const candidates = participants.filter((p) => p.id !== view.meId);
  const [selected, setSelected] = useState<string | null>(view.myVote);
  const [busy, setBusy] = useState(false);
  const voted = participants.filter((p) => p.hasVoted).length;

  useEffect(() => {
    if (view.myVote) setSelected((s) => s ?? view.myVote);
  }, [view.myVote]);

  async function vote() {
    if (!selected) return;
    setBusy(true);
    const res = await game.send('vote:cast', { targetId: selected });
    setBusy(false);
    if (!res.ok) toast(res.error, 'error');
  }

  const selectedName = playerById(view, selected)?.nickname;
  const label = !view.myVote
    ? selected
      ? `🗳️ صوّت على ${selectedName}`
      : 'اختر لاعب أول'
    : selected !== view.myVote
      ? `غيّر صوتي إلى ${selectedName}`
      : `✅ صوّتت على ${selectedName}`;

  return (
    <>
      <PhaseHead icon="🕵️" title="مين الكذّاب؟" subtitle="راجع التلميحات واختر اللي تشك فيه" endsAt={view.phaseEndsAt} />

      {spectator ? (
        <SpectatorNote />
      ) : (
        <div className="vote-grid" role="radiogroup" aria-label="اختر الكذّاب">
          {candidates.map((p) => {
            const clues = view.hints.filter((h) => h.playerId === p.id);
            return (
              <button
                key={p.id}
                className="vote-card"
                role="radio"
                aria-checked={selected === p.id}
                aria-pressed={selected === p.id}
                onClick={() => setSelected(p.id)}
                data-testid={`vote-${p.nickname}`}
              >
                <Avatar player={p} size="lg" showStatus />
                <span className="name">{p.nickname}</span>
                <span className="clues">
                  {clues.length === 0 && <span className="clue">بدون تلميح</span>}
                  {clues.map((h, i) => (
                    <span className="clue" key={i}>
                      {h.text ?? '⏭️'}
                    </span>
                  ))}
                </span>
                {view.myVote === p.id && <span className="stamp">صوتك هنا ✔</span>}
              </button>
            );
          })}
        </div>
      )}

      <section className="card tight">
        <div className="card-title" style={{ marginBottom: 8 }}>
          🗳️ صوّتوا
          <span className="count">
            {voted}/{participants.length}
          </span>
        </div>
        <div className="voted-strip">
          {participants.map((p) => (
            <span key={p.id} title={p.nickname}>
              <Avatar player={p} size="sm" className={p.hasVoted ? '' : 'pending'} />
            </span>
          ))}
        </div>
      </section>

      {!spectator && <MiniSecret secret={view.secret} />}

      <details className="card">
        <summary className="card-title" style={{ marginBottom: 0, cursor: 'pointer' }}>
          🗨️ كل التلميحات
        </summary>
        <div style={{ marginTop: 12 }}>
          <HintFeed view={view} hints={view.hints} />
        </div>
      </details>

      {!spectator && (
        <div className="action-bar">
          <Button
            size="lg"
            block
            onClick={vote}
            loading={busy}
            disabled={!selected || selected === view.myVote}
            data-testid="cast-vote"
          >
            {label}
          </Button>
          {view.myVote && <span className="center tiny muted">تقدر تغيّر رأيك قبل لا يخلص الوقت</span>}
        </div>
      )}
    </>
  );
}
