import { useEffect, useState, type FormEvent } from 'react';
import { NICKNAME_MAX, type RoomPreview, type RoomView } from '../../shared/types';
import { validateNickname } from '../../shared/text';
import { HowToPlay } from '../components/HowToPlay';
import { ShareSheet } from '../components/Invite';
import { Scoreboard } from '../components/Scoreboard';
import { Avatar, Button, ConnectionBanner, LogoMark, PhaseStepper, Sheet } from '../components/ui';
import { useOnChange, vibrate } from '../lib/hooks';
import { navigate } from '../lib/router';
import { getNickname, getSession, isActiveInThisTab, saveNickname } from '../lib/session';
import { game, useGame } from '../lib/store';
import { toast } from '../lib/toasts';
import { playersLabel } from '../lib/view';
import { Guess } from './Guess';
import { Hints } from './Hints';
import { Lobby } from './Lobby';
import { Results } from './Results';
import { Reveal } from './Reveal';
import { Voting } from './Voting';

export function Room({ code }: { code: string }) {
  const g = useGame();
  const inThisRoom = g.session?.code === code;

  // Coming back to a room this tab was already in (refresh): resume automatically.
  useEffect(() => {
    if (g.session?.code === code) return;
    const stored = getSession(code);
    if (stored && isActiveInThisTab(code)) void game.resume(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (g.removed && g.removed.code === code) return <Removed reason={g.removed.reason} />;
  if (!inThisRoom) return <JoinRoom code={code} />;
  if (!g.view) {
    return (
      <div className="full-center">
        <span className="spinner" />
        <p className="dim">{g.connected ? 'ندخلك الغرفة…' : 'نتصل بالسيرفر…'}</p>
        <ConnectionBanner show={!g.connected && g.ready} />
      </div>
    );
  }
  return <RoomScreen view={g.view} connected={g.connected} />;
}

function RoomScreen({ view, connected }: { view: RoomView; connected: boolean }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [scoresOpen, setScoresOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  useOnChange(view.phase, (phase) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (phase === 'voting' || phase === 'reveal') vibrate(40);
  });

  async function leave() {
    setLeaveOpen(false);
    await game.leave();
    navigate('/', { replace: true });
  }

  return (
    <>
      <header className="room-top">
        <button className="icon-btn" onClick={() => setLeaveOpen(true)} aria-label="الخروج من الغرفة">
          🚪
        </button>
        <button className="room-code-chip" onClick={() => setShareOpen(true)} aria-label="مشاركة الغرفة">
          <span className="small dim label-word">غرفة</span>
          <span className="digits ltr">{view.code}</span>
          <span aria-hidden="true">{view.locked ? '🔒' : '📤'}</span>
        </button>
        <span className="spacer" />
        {view.roundNumber > 0 && <span className="round-pill">الجولة {view.roundNumber}</span>}
        <button className="icon-btn" onClick={() => setScoresOpen(true)} aria-label="لوحة النقاط">
          🏆
        </button>
      </header>

      <PhaseStepper phase={view.phase} />

      <div className="room-layout">
        <main className="stack" key={`${view.phase}-${view.roundNumber}`} style={{ animation: 'page-in .4s var(--ease)' }}>
          {view.phase === 'lobby' && <Lobby view={view} />}
          {view.phase === 'reveal' && <Reveal view={view} />}
          {view.phase === 'hints' && <Hints view={view} />}
          {view.phase === 'voting' && <Voting view={view} />}
          {view.phase === 'guess' && <Guess view={view} />}
          {view.phase === 'results' && <Results view={view} />}
        </main>
        <aside className="room-side stack">
          {(view.phase === 'reveal' || view.phase === 'hints' || view.phase === 'voting') && <PlayersStatus view={view} />}
          <section className="card desktop-only">
            <div className="card-title">🎯 تذكير بالقوانين</div>
            <HowToPlay />
          </section>
        </aside>
      </div>

      <ShareSheet view={view} open={shareOpen} onClose={() => setShareOpen(false)} />
      <Sheet open={scoresOpen} onClose={() => setScoresOpen(false)} title="🏆 لوحة النقاط">
        <Scoreboard view={view} />
      </Sheet>
      <Sheet open={leaveOpen} onClose={() => setLeaveOpen(false)} title="الخروج من الغرفة">
        <div className="stack">
          <p>متأكد تبي تطلع؟ {view.phase !== 'lobby' && view.phase !== 'results' ? 'الجولة شغالة وبتطلع منها.' : ''}</p>
          <div className="row">
            <Button variant="danger" block onClick={leave}>
              إيه، اطلع
            </Button>
            <Button variant="ghost" block onClick={() => setLeaveOpen(false)}>
              أكمل اللعب
            </Button>
          </div>
        </div>
      </Sheet>
      <ConnectionBanner show={!connected} />
    </>
  );
}

function PlayersStatus({ view }: { view: RoomView }) {
  const status = (p: RoomView['players'][number]) => {
    if (!p.connected) return '📴 غير متصل';
    if (!p.inRound) return '👀 يتفرج';
    if (view.phase === 'reveal') return p.ready ? '✅ جاهز' : '⏳ يشوف دوره';
    if (view.phase === 'hints' && view.turn?.currentPlayerId === p.id) return '✍️ يكتب الحين';
    if (view.phase === 'voting') return p.hasVoted ? '✅ صوّت' : '🤔 يفكّر';
    return '';
  };
  return (
    <section className="card tight">
      <div className="card-title" style={{ marginBottom: 8 }}>
        👥 اللاعبين
      </div>
      <div className="players-grid side-players">
        {view.players.map((p) => (
          <div key={p.id} className={`player-chip ${p.id === view.meId ? 'me' : ''}`} style={{ animation: 'none' }}>
            <Avatar player={p} size="sm" showStatus showCrown />
            <div className="info">
              <div className="name">
                {p.nickname}
                {p.id === view.meId && <span className="muted small"> (أنت)</span>}
              </div>
              <div className="meta">{status(p)}</div>
            </div>
            <b className="small">{p.score}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function JoinRoom({ code }: { code: string }) {
  const stored = getSession(code);
  const [nickname, setNickname] = useState(() => getNickname());
  const [preview, setPreview] = useState<RoomPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/rooms/${code}`)
      .then((r) => r.json() as Promise<RoomPreview>)
      .then((p) => alive && setPreview(p))
      .catch(() => alive && setPreview({ exists: true }));
    return () => {
      alive = false;
    };
  }, [code]);

  async function join(e: FormEvent) {
    e.preventDefault();
    const v = validateNickname(nickname);
    if (!v.ok) return setError(v.error);
    saveNickname(v.value);
    setBusy(true);
    const res = await game.join(code, v.value);
    setBusy(false);
    if (!res.ok) toast(res.error, 'error');
  }

  async function continueAs() {
    if (!stored) return;
    setBusy(true);
    const res = await game.resume(stored);
    setBusy(false);
    if (!res.ok) toast(res.error, 'error');
  }

  if (preview && !preview.exists) {
    return (
      <main className="page full-center">
        <span className="big-emoji">🔍</span>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>ما لقينا الغرفة {code}</h1>
        <p className="dim">يمكن الرمز غلط، أو الغرفة انتهت. اطلب من صاحبك رابط جديد أو أنشئ غرفتك.</p>
        <Button size="lg" onClick={() => navigate('/')}>
          🏠 الصفحة الرئيسية
        </Button>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="brand">
        <LogoMark size={80} />
        <h1 className="title" style={{ fontSize: 34 }}>
          اكشف الكذبة
        </h1>
        <p className="tagline">
          {preview?.hostName ? (
            <>
              <b>{preview.hostName}</b> يعزمك تلعب معه 🎉
            </>
          ) : (
            'عزموك على جولة! 🎉'
          )}
        </p>
      </header>

      <section className="card stack">
        <div className="code-display">
          <span className="label">رمز الغرفة</span>
          <span className="digits ltr">{code}</span>
          {preview?.exists && preview.players !== undefined && (
            <span className="small muted">
              {preview.players === 0 ? 'ما فيه أحد داخل الغرفة' : `${playersLabel(preview.players)} داخل الغرفة`}{preview.phase && preview.phase !== 'lobby' ? ' • فيه جولة شغالة، بتتفرج لين تبدأ الجاية' : ''}
            </span>
          )}
        </div>

        {stored && (
          <>
            <Button variant="purple" size="lg" block onClick={continueAs} loading={busy} data-testid="continue-as">
              <Avatar player={{ nickname: stored.nickname, avatar: 0, connected: true, isHost: false }} size="sm" />
              كمّل باسم «{stored.nickname}»
            </Button>
            <div className="divider">أو ادخل باسم جديد</div>
          </>
        )}

        {preview?.full ? (
          <p className="center field-error">الغرفة مليانة (١٠ لاعبين) 😕</p>
        ) : preview?.locked ? (
          <p className="center field-error" data-testid="room-locked">
            الغرفة مقفلة 🔒 اطلب من المضيف يفتحها عشان تدخل
          </p>
        ) : (
          <form className="stack" onSubmit={join}>
            <div className="field">
              <label className="label" htmlFor="join-nickname">
                اسمك المستعار
              </label>
              <input
                id="join-nickname"
                className="input"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError(null);
                }}
                placeholder="اكتب اسمك"
                maxLength={NICKNAME_MAX + 4}
                autoComplete="nickname"
                enterKeyHint="go"
              />
              {error && <span className="field-error">{error}</span>}
            </div>
            <Button size="lg" block type="submit" loading={busy && !stored} disabled={busy} data-testid="join-room">
              🚪 ادخل الغرفة
            </Button>
          </form>
        )}
      </section>

      <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
        الرجوع للرئيسية
      </Button>
    </main>
  );
}

function Removed({ reason }: { reason: string }) {
  const text =
    reason === 'kicked'
      ? { emoji: '🚫', title: 'تم إخراجك من الغرفة', body: 'المضيف أخرجك من هذي الغرفة.' }
      : reason === 'timeout'
        ? { emoji: '⏰', title: 'طلعت من الغرفة', body: 'كنت غير متصل فترة طويلة، فطلّعناك من الغرفة.' }
        : reason === 'left'
          ? { emoji: '👋', title: 'طلعت من الغرفة', body: 'نشوفك بجولة ثانية!' }
          : { emoji: '🏁', title: 'الغرفة انتهت', body: 'هذي الغرفة سُكّرت. تقدر تنشئ غرفة جديدة بأي وقت.' };
  return (
    <main className="page full-center">
      <span className="big-emoji">{text.emoji}</span>
      <h1 style={{ fontSize: 26, fontWeight: 900 }}>{text.title}</h1>
      <p className="dim">{text.body}</p>
      <Button
        size="lg"
        onClick={() => {
          game.clearRemoved();
          navigate('/');
        }}
      >
        🏠 الصفحة الرئيسية
      </Button>
    </main>
  );
}
