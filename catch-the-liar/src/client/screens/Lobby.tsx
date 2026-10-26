import { useState } from 'react';
import { MAX_PLAYERS, MIN_PLAYERS, type PlayerView, type RoomView } from '../../shared/types';
import { HowToPlay } from '../components/HowToPlay';
import { InviteCard } from '../components/Invite';
import { Scoreboard } from '../components/Scoreboard';
import { SettingsCard } from '../components/Settings';
import { Avatar, Button, Dots, PhaseHead, Sheet } from '../components/ui';
import { game } from '../lib/store';
import { toast } from '../lib/toasts';
import { hostName, isHost, playersLabel } from '../lib/view';

export function Lobby({ view }: { view: RoomView }) {
  const host = isHost(view);
  const online = view.players.filter((p) => p.connected).length;
  const missing = Math.max(0, MIN_PLAYERS - online);
  const [starting, setStarting] = useState(false);
  const [kickTarget, setKickTarget] = useState<PlayerView | null>(null);
  const hasScores = view.players.some((p) => p.score > 0);

  async function start() {
    setStarting(true);
    const res = await game.send('round:start');
    setStarting(false);
    if (!res.ok) toast(res.error, 'error');
  }

  async function kick() {
    if (!kickTarget) return;
    const res = await game.send('room:kick', { playerId: kickTarget.id });
    setKickTarget(null);
    if (!res.ok) toast(res.error, 'error');
  }

  async function resetScores() {
    const res = await game.send('scores:reset');
    if (!res.ok) toast(res.error, 'error');
  }

  return (
    <>
      <PhaseHead
        icon="🛋️"
        title="انتظار اللاعبين"
        subtitle={host ? 'شارك الرابط مع ربعك، وإذا اكتملتوا ابدأ الجولة' : `أهلاً فيك! ننتظر ${hostName(view)} يبدأ الجولة`}
      />

      <InviteCard code={view.code} />

      <section className="card" aria-label="اللاعبين">
        <div className="card-title">
          👥 اللاعبين
          <span className="count">
            {view.players.length}/{MAX_PLAYERS}
          </span>
        </div>
        <div className="players-grid" data-testid="lobby-players">
          {view.players.map((p) => (
            <div key={p.id} className={`player-chip ${p.id === view.meId ? 'me' : ''}`}>
              <Avatar player={p} showStatus showCrown />
              <div className="info">
                <div className="name">{p.nickname}</div>
                <div className="meta">
                  {p.id === view.meId ? 'أنت' : p.isHost ? 'المضيف' : p.connected ? 'متصل' : 'غير متصل'}
                  {p.score > 0 && ` • ${p.score} نقطة`}
                </div>
              </div>
              {host && p.id !== view.meId && (
                <button className="kick" onClick={() => setKickTarget(p)} aria-label={`إخراج ${p.nickname}`}>
                  ✕
                </button>
              )}
            </div>
          ))}
          {missing > 0 &&
            Array.from({ length: missing }, (_, i) => (
              <div className="empty-seat" key={`empty-${i}`}>
                <span className="ghost">＋</span>
                <span>بانتظار لاعب…</span>
              </div>
            ))}
        </div>
      </section>

      <SettingsCard view={view} editable={host} />

      <details className="card mobile-only">
        <summary className="card-title" style={{ marginBottom: 0, cursor: 'pointer' }}>
          🎯 كيف نلعب؟
        </summary>
        <div style={{ marginTop: 12 }}>
          <HowToPlay />
        </div>
      </details>

      {hasScores && (
        <section className="card">
          <div className="card-title">
            🏆 لوحة النقاط
            {host && (
              <Button variant="ghost" size="xs" className="count" onClick={resetScores} style={{ marginInlineStart: 'auto' }}>
                تصفير
              </Button>
            )}
          </div>
          <Scoreboard view={view} />
        </section>
      )}

      <div className="action-bar">
        {host ? (
          <>
            <Button size="lg" block onClick={start} loading={starting} disabled={missing > 0} data-testid="start-round">
              🚀 ابدأ الجولة
            </Button>
            <span className="center small muted">
              {missing > 0
                ? `تحتاجون ${missing === 1 ? 'لاعب واحد' : missing === 2 ? 'لاعبين' : `${missing} لاعبين`} زيادة على الأقل`
                : `متصل ${playersLabel(online)}، جاهزين؟`}
            </span>
          </>
        ) : (
          <div className="waiting">
            بانتظار المضيف يبدأ الجولة <Dots />
          </div>
        )}
      </div>

      <Sheet open={!!kickTarget} onClose={() => setKickTarget(null)} title="إخراج لاعب">
        <div className="stack">
          <p>
            متأكد تبي تطلع <b>{kickTarget?.nickname}</b> من الغرفة؟
          </p>
          <div className="row">
            <Button variant="danger" block onClick={kick}>
              إيه، أخرجه
            </Button>
            <Button variant="ghost" block onClick={() => setKickTarget(null)}>
              لا
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
