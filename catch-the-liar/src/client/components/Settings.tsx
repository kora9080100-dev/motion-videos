import { SETTINGS_LIMITS, type RoomSettings, type RoomView } from '../../shared/types';
import { game } from '../lib/store';
import { toast } from '../lib/toasts';

async function update(patch: Partial<RoomSettings>) {
  const res = await game.send('room:settings', patch);
  if (!res.ok) toast(res.error, 'error');
}

export function SettingsCard({ view, editable }: { view: RoomView; editable: boolean }) {
  const s = view.settings;
  const packs = view.packs.filter((p) => p.available);
  const all = s.packIds.length === 0;

  function togglePack(id: string) {
    if (all) return void update({ packIds: [id] });
    const next = s.packIds.includes(id) ? s.packIds.filter((x) => x !== id) : [...s.packIds, id];
    void update({ packIds: next.length === packs.length ? [] : next });
  }

  if (!editable) {
    const names = all ? 'كل التصنيفات' : packs.filter((p) => s.packIds.includes(p.id)).map((p) => `${p.emoji} ${p.name}`).join('، ');
    return (
      <section className="card">
        <div className="card-title">⚙️ إعدادات الجولة</div>
        <div className="summary-list">
          <div>
            <span>التصنيفات</span>
            <span>{names}</span>
          </div>
          <div>
            <span>جولات التلميح</span>
            <span>{s.hintRounds}</span>
          </div>
          <div>
            <span>وقت التلميح</span>
            <span>{s.hintSeconds} ثانية</span>
          </div>
          <div>
            <span>وقت التصويت</span>
            <span>{s.voteSeconds} ثانية</span>
          </div>
          <div>
            <span>الكذّاب يعرف التصنيف</span>
            <span>{s.liarSeesCategory ? 'نعم' : 'لا'}</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="card-title">⚙️ إعدادات الجولة</div>

      <div className="setting">
        <span className="label">التصنيفات</span>
        <div className="chips">
          <button className="chip" aria-pressed={all} onClick={() => void update({ packIds: [] })}>
            🎲 الكل
          </button>
          {packs.map((p) => (
            <button
              key={p.id}
              className="chip"
              aria-pressed={!all && s.packIds.includes(p.id)}
              onClick={() => togglePack(p.id)}
              title={p.description}
            >
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <span className="label">كم مرة يلمّح كل لاعب؟</span>
        <div className="seg" role="group" aria-label="جولات التلميح">
          {SETTINGS_LIMITS.hintRounds.map((n) => (
            <button key={n} aria-pressed={s.hintRounds === n} onClick={() => void update({ hintRounds: n })}>
              {n === 1 ? 'مرة' : n === 2 ? 'مرتين' : '٣ مرات'}
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <span className="label">وقت كل تلميح</span>
        <div className="seg" role="group" aria-label="وقت التلميح">
          {SETTINGS_LIMITS.hintSeconds.map((n) => (
            <button key={n} aria-pressed={s.hintSeconds === n} onClick={() => void update({ hintSeconds: n })}>
              {n}ث
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <span className="label">وقت التصويت</span>
        <div className="seg" role="group" aria-label="وقت التصويت">
          {SETTINGS_LIMITS.voteSeconds.map((n) => (
            <button key={n} aria-pressed={s.voteSeconds === n} onClick={() => void update({ voteSeconds: n })}>
              {n}ث
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <label className="toggle">
          <input
            type="checkbox"
            checked={s.liarSeesCategory}
            onChange={(e) => void update({ liarSeesCategory: e.target.checked })}
          />
          <span>
            <b>الكذّاب يعرف التصنيف</b>
            <br />
            <span className="small muted">إذا طفيتها، تصير اللعبة أصعب على الكذّاب</span>
          </span>
        </label>
      </div>
    </section>
  );
}
