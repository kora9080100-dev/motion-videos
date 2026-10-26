import { useEffect, useRef, useState, type FormEvent } from 'react';
import { HINT_MAX, type RoomView } from '../../shared/types';
import { Avatar, Button, Dots, PhaseHead, Timer } from '../components/ui';
import { useOnChange, vibrate } from '../lib/hooks';
import { game } from '../lib/store';
import { toast } from '../lib/toasts';
import { isHost, playerById } from '../lib/view';
import { HintFeed, MiniSecret, SpectatorNote } from './shared';

export function Hints({ view }: { view: RoomView }) {
  const turn = view.turn;
  const current = playerById(view, turn?.currentPlayerId);
  const mine = !!current && current.id === view.meId;
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useOnChange(mine, (now) => {
    if (now) {
      vibrate([60, 40, 60]);
      setText('');
    }
  });

  useEffect(() => {
    if (mine) inputRef.current?.focus({ preventScroll: true });
  }, [mine, turn?.turnNumber]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    const res = await game.send('hint:submit', { text });
    setBusy(false);
    if (!res.ok) return toast(res.error, 'error');
    setText('');
  }

  async function skip() {
    const res = await game.send('turn:skip');
    if (!res.ok) toast(res.error, 'error');
  }

  if (!turn) return null;
  const doneIds = new Set(view.hints.filter((h) => h.hintRound === turn.hintRound).map((h) => h.playerId));

  return (
    <>
      <PhaseHead
        icon="💬"
        title="مرحلة التلميحات"
        subtitle={
          <>
            التلميح {turn.turnNumber} من {turn.totalTurns}
            {turn.hintRounds > 1 && ` • الجولة ${turn.hintRound} من ${turn.hintRounds}`}
          </>
        }
      />

      <section className={`turn-banner ${mine ? 'mine' : ''}`} data-testid="turn-banner" aria-live="polite">
        {current && <Avatar player={current} size="lg" showStatus />}
        <div className="who">
          {mine ? (
            <>
              <b>دورك! ✍️</b>
              <span className="small dim">اكتب تلميح عن الكلمة… لا تكون واضح مرة!</span>
            </>
          ) : (
            <>
              <b>دور {current?.nickname ?? '…'}</b>
              <span className="small dim">
                {current && !current.connected ? 'غير متصل… بنتخطاه بعد ثواني' : 'يفكّر بتلميح'} <Dots />
              </span>
            </>
          )}
        </div>
        <Timer endsAt={view.phaseEndsAt} />
      </section>

      {mine && (
        <form className="card tight stack" onSubmit={submit}>
          <div className="input-row">
            <input
              ref={inputRef}
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="تلميحك هنا…"
              maxLength={HINT_MAX}
              enterKeyHint="send"
              autoComplete="off"
              data-testid="hint-input"
            />
            <Button type="submit" loading={busy} disabled={!text.trim()} data-testid="hint-send">
              أرسل
            </Button>
          </div>
          <div className="row small muted">
            <span>كلمة أو كلمتين تكفي 👌</span>
            <span className="spacer" />
            <button type="button" className="btn btn-ghost xs" onClick={skip}>
              تخطي دوري
            </button>
          </div>
        </form>
      )}

      <div className="turn-order" aria-label="ترتيب الأدوار">
        {turn.order.map((id) => {
          const p = playerById(view, id);
          if (!p) return null;
          return (
            <div key={id} className={`t ${id === turn.currentPlayerId ? 'current' : ''} ${doneIds.has(id) ? 'done' : ''}`}>
              <Avatar player={p} size="sm" showStatus />
              <span>{id === view.meId ? 'أنت' : p.nickname}</span>
            </div>
          );
        })}
      </div>

      {view.secret?.role === 'spectator' ? <SpectatorNote /> : <MiniSecret secret={view.secret} />}

      <section className="card">
        <div className="card-title">🗨️ التلميحات</div>
        <HintFeed view={view} hints={view.hints} />
      </section>

      {isHost(view) && !mine && current && (
        <Button variant="ghost" size="sm" onClick={skip}>
          ⏭️ تخطي دور {current.nickname}
        </Button>
      )}
    </>
  );
}
