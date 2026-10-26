import { useState } from 'react';
import { POINTS, type RoomView } from '../../shared/types';
import { Avatar, Button, Dots, PhaseHead, Timer } from '../components/ui';
import { game } from '../lib/store';
import { toast } from '../lib/toasts';
import { ghostPlayer, playerById } from '../lib/view';

export function Guess({ view }: { view: RoomView }) {
  const g = view.guess;
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!g) return null;
  const liar = playerById(view, g.liarId);
  const iAmLiar = g.liarId === view.meId;

  async function submit() {
    if (!choice) return;
    setBusy(true);
    const res = await game.send('guess:submit', { word: choice });
    setBusy(false);
    if (!res.ok) toast(res.error, 'error');
  }

  return (
    <>
      <div className="reveal-hero">
        <span className="kicker">{iAmLiar ? 'انكشفت! 😱' : 'انكشف الكذّاب! 😱'}</span>
        <Avatar player={liar ?? ghostPlayer(g.liarName)} size="xl" />
        <div className="liar-name">{iAmLiar ? 'أنت الكذّاب' : g.liarName}</div>
      </div>

      {iAmLiar && g.options ? (
        <>
          <PhaseHead
            title="فرصتك الأخيرة!"
            subtitle={`خمّن الكلمة السرية صح وتاخذ +${POINTS.liar_guessed}`}
            endsAt={view.phaseEndsAt}
          />
          <div className="options-grid" role="radiogroup" aria-label="خيارات الكلمة">
            {g.options.map((w) => (
              <button
                key={w}
                className="option"
                role="radio"
                aria-checked={choice === w}
                aria-pressed={choice === w}
                onClick={() => setChoice(w)}
              >
                {w}
              </button>
            ))}
          </div>
          <div className="action-bar">
            <Button size="lg" block disabled={!choice} loading={busy} onClick={submit} data-testid="submit-guess">
              {choice ? `🎯 أكيد هي «${choice}»` : 'اختر كلمة'}
            </Button>
          </div>
        </>
      ) : (
        <section className="card center stack">
          <div className="row" style={{ justifyContent: 'center' }}>
            <Timer endsAt={view.phaseEndsAt} />
          </div>
          <b style={{ fontSize: 19 }}>
            {g.liarName} يحاول يخمّن الكلمة <Dots />
          </b>
          <p className="dim small">إذا خمّنها صح ياخذ نقاط… ادعوا ما يعرفها 🤞</p>
        </section>
      )}
    </>
  );
}
