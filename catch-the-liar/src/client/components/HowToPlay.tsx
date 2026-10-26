import { POINTS } from '../../shared/types';

const STEPS = [
  { icon: '🏠', title: 'أنشئ غرفة وشارك الرابط', text: 'ربعك يدخلون من جوالاتهم بالرابط أو برمز الغرفة.' },
  { icon: '🤫', title: 'كل واحد يشوف دوره بالسر', text: 'الكل ياخذ نفس الكلمة… إلا واحد هو الكذّاب، ما يعرفها!' },
  { icon: '💬', title: 'تلميحات بالدور', text: 'كل لاعب يكتب تلميح عن الكلمة: لا يكون واضح مرة، ولا غامض مرة. وممنوع تكرر تلميح غيرك!' },
  { icon: '🗳️', title: 'صوّتوا على الكذّاب', text: 'إذا انكشف، عنده فرصة أخيرة يخمّن الكلمة ويسرق النقاط.' },
];

export function HowToPlay() {
  return (
    <div className="stack">
      <div className="steps">
        {STEPS.map((s) => (
          <div className="step" key={s.title}>
            <span className="step-icon">{s.icon}</span>
            <div>
              <b>{s.title}</b>
              <span>{s.text}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="badges" style={{ justifyContent: 'flex-start' }}>
        <span className="badge">✅ صوت صح: +{POINTS.correct_vote}</span>
        <span className="badge orange">😈 الكذّاب فلت: +{POINTS.liar_escaped}</span>
        <span className="badge">🎯 خمّن الكلمة: +{POINTS.liar_guessed}</span>
      </div>
    </div>
  );
}
