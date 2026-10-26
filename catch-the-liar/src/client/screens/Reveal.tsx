import { useState } from 'react';
import type { RoomView } from '../../shared/types';
import { Avatar, Button, PhaseHead } from '../components/ui';
import { vibrate } from '../lib/hooks';
import { game } from '../lib/store';
import { toast } from '../lib/toasts';
import { SpectatorNote } from './shared';

export function Reveal({ view }: { view: RoomView }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [busy, setBusy] = useState(false);
  const secret = view.secret;
  const participants = view.players.filter((p) => p.inRound);
  const readyCount = participants.filter((p) => p.ready).length;
  const meReady = view.players.find((p) => p.id === view.meId)?.ready ?? false;

  if (!secret || secret.role === 'spectator') {
    return (
      <>
        <PhaseHead icon="🤫" title="الكل يشوف دوره" subtitle="الجولة بتبدأ بعد شوي" endsAt={view.phaseEndsAt} />
        <SpectatorNote />
      </>
    );
  }

  async function ready() {
    setBusy(true);
    const res = await game.send('round:ready');
    setBusy(false);
    if (!res.ok) toast(res.error, 'error');
  }

  const liar = secret.role === 'liar';

  return (
    <>
      <PhaseHead icon="🤫" title="دورك السري" subtitle="غطّ شاشتك عن الباقين واضغط على البطاقة" endsAt={view.phaseEndsAt} />

      <div
        className={`flip ${open ? 'open' : ''}`}
        role="button"
        tabIndex={0}
        aria-pressed={open}
        aria-label={open ? 'إخفاء الدور' : 'كشف الدور'}
        data-testid="secret-card"
        onClick={() => {
          setOpen((o) => !o);
          if (!seen) vibrate(30);
          setSeen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
            setSeen(true);
          }
        }}
      >
        <div className="flip-inner">
          <div className="flip-face flip-front">
            <span className="big-emoji">🃏</span>
            <b style={{ fontSize: 22 }}>اضغط عشان تكشف دورك</b>
            <span className="small" style={{ color: 'rgba(255,255,255,.75)' }}>
              وتقدر تخفيه بضغطة ثانية
            </span>
          </div>
          {liar ? (
            <div className="flip-face flip-back liar" data-testid="role-liar">
              <span className="big-emoji">😈</span>
              <div className="liar-title">أنت الكذّاب!</div>
              {secret.category ? (
                <span className="badge orange">
                  التصنيف: {secret.category.emoji} {secret.category.name}
                </span>
              ) : (
                <span className="badge orange">ولا تعرف حتى التصنيف 😬</span>
              )}
              <p className="small dim">ما تعرف الكلمة… اسمع تلميحاتهم، اندمج معهم، ولا تنكشف!</p>
            </div>
          ) : (
            <div className="flip-face flip-back" data-testid="role-civilian">
              <span className="secret-label">الكلمة السرية</span>
              <div className="secret-word" data-testid="secret-word">
                {secret.word}
              </div>
              <span className="badge">
                {secret.category.emoji} {secret.category.name}
              </span>
              <p className="small dim">واحد منكم ما يعرفها… لمّح لها بذكاء بدون ما تفضحها!</p>
            </div>
          )}
        </div>
      </div>

      <section className="card tight">
        <div className="card-title" style={{ marginBottom: 8 }}>
          ✅ الجاهزين
          <span className="count">
            {readyCount}/{participants.length}
          </span>
        </div>
        <div className="row wrap">
          {participants.map((p) => (
            <span key={p.id} title={p.nickname} style={{ opacity: p.ready ? 1 : 0.35 }}>
              <Avatar player={p} size="sm" />
            </span>
          ))}
        </div>
      </section>

      <div className="action-bar">
        <Button size="lg" block onClick={ready} loading={busy} disabled={!seen || meReady} data-testid="ready">
          {meReady ? 'جاهز ✅ ننتظر الباقين' : seen ? 'فهمت، جاهز!' : 'اكشف دورك أول 👆'}
        </Button>
      </div>
    </>
  );
}
