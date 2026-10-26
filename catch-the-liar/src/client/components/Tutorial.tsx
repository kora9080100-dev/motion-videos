import { useState } from 'react';
import { POINTS } from '../../shared/types';
import { Button, Sheet } from './ui';

const SEEN_KEY = 'ctl.tutorialSeen';

export function tutorialSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* private mode */
  }
}

interface Step {
  emoji: string;
  title: string;
  body: string;
  example?: { who: string; text: string; liar?: boolean }[];
}

const STEPS: Step[] = [
  {
    emoji: '👥',
    title: 'اجمع ربعك',
    body: 'واحد منكم ينشئ غرفة ويرسل الرابط. تحتاجون ٣ لاعبين أو أكثر، وكل واحد يلعب من جواله.',
  },
  {
    emoji: '🤫',
    title: 'كل واحد يشوف بطاقته بالسر',
    body: 'الكل ياخذ نفس الكلمة السرية… إلا واحد بس: هو «الكذّاب» وما يعرف الكلمة! ولا أحد يعرف مين هو.',
  },
  {
    emoji: '💬',
    title: 'لمّحوا بالدور',
    body: 'كل لاعب يكتب كلمة وحدة توصف الكلمة السرية. لا تكون واضح مرة عشان الكذّاب ما يفهمها، ولا غامض مرة عشان ما يشكّون فيك!',
    example: [
      { who: 'سارة', text: 'رز' },
      { who: 'خالد', text: 'غدا الجمعة' },
      { who: 'فهد (الكذّاب)', text: 'لذيذ', liar: true },
    ],
  },
  {
    emoji: '🗳️',
    title: 'صوّتوا على الكذّاب',
    body: 'بعد التلميحات، كل واحد يصوّت على اللي يشك فيه. اللي ياخذ أكثر أصوات ينكشف. تقدرون تتناقشون في الدردشة 💬',
  },
  {
    emoji: '🎯',
    title: 'فرصة أخيرة للكذّاب',
    body: 'إذا انكشف الكذّاب، يقدر يخمّن الكلمة من ٨ خيارات. إذا خمّنها صح ياخذ نقاط!',
  },
];

export function Tutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i]!;
  const last = i === STEPS.length - 1;

  function close() {
    markSeen();
    setI(0);
    onClose();
  }

  return (
    <Sheet open={open} onClose={close} title="كيف نلعب؟">
      <div className="tutorial" data-testid="tutorial">
        <div className="tut-step" key={i}>
          <span className="tut-emoji">{step.emoji}</span>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
          {step.example && (
            <div className="tut-example">
              <span className="tiny muted">مثال: الكلمة السرية «كبسة» 🍛</span>
              {step.example.map((e) => (
                <div key={e.who} className={`tut-line ${e.liar ? 'liar' : ''}`}>
                  <b>{e.who}:</b> <span>«{e.text}»</span>
                </div>
              ))}
              <span className="tiny muted">تلميح فهد عام مرة… شكله ما يعرف الكلمة 🤔</span>
            </div>
          )}
          {last && (
            <div className="badges" style={{ marginTop: 6 }}>
              <span className="badge">✅ صوت صح: +{POINTS.correct_vote}</span>
              <span className="badge orange">😈 الكذّاب فلت: +{POINTS.liar_escaped}</span>
              <span className="badge">🎯 خمّن الكلمة: +{POINTS.liar_guessed}</span>
            </div>
          )}
        </div>

        <div className="tut-dots" aria-hidden="true">
          {STEPS.map((_, n) => (
            <span key={n} className={n === i ? 'on' : ''} />
          ))}
        </div>

        <div className="row">
          {i > 0 && (
            <Button variant="ghost" onClick={() => setI(i - 1)}>
              السابق
            </Button>
          )}
          <Button block onClick={() => (last ? close() : setI(i + 1))} data-testid="tutorial-next">
            {last ? 'فهمت، يلا نلعب! 🎮' : `التالي (${i + 1}/${STEPS.length})`}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
