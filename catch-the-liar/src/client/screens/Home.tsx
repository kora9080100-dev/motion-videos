import { useState, type FormEvent } from 'react';
import { NICKNAME_MAX, ROOM_CODE_LENGTH } from '../../shared/types';
import { isValidRoomCode, normalizeRoomCode, validateNickname } from '../../shared/text';
import { Button, LogoMark } from '../components/ui';
import { HowToPlay } from '../components/HowToPlay';
import { Tutorial } from '../components/Tutorial';
import { navigate } from '../lib/router';
import { getNickname, saveNickname } from '../lib/session';
import { game } from '../lib/store';
import { toast } from '../lib/toasts';

export function Home() {
  const [nickname, setNickname] = useState(getNickname);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  function checkName(): string | null {
    const v = validateNickname(nickname);
    if (!v.ok) {
      setNameError(v.error);
      document.getElementById('nickname')?.focus();
      return null;
    }
    setNameError(null);
    saveNickname(v.value);
    return v.value;
  }

  async function create() {
    const name = checkName();
    if (!name) return;
    setBusy('create');
    const res = await game.create(name);
    setBusy(null);
    if (!res.ok) return toast(res.error, 'error');
    navigate(`/r/${res.code}`);
  }

  async function join(e: FormEvent) {
    e.preventDefault();
    const c = normalizeRoomCode(code);
    if (!isValidRoomCode(c)) return toast('رمز الغرفة 6 أرقام، تأكد منه', 'warn');
    const name = checkName();
    if (!name) return;
    setBusy('join');
    const res = await game.join(c, name);
    setBusy(null);
    if (!res.ok) return toast(res.error, 'error');
    navigate(`/r/${res.code}`);
  }

  return (
    <main className="page">
      <header className="brand">
        <LogoMark />
        <h1 className="title">اكشف الكذبة</h1>
        <div className="subtitle-en ltr">Catch The Liar</div>
        <p className="tagline">الكل يعرف الكلمة السرية… إلا واحد! 🤫 اكشفوا الكذّاب قبل لا يضحك عليكم.</p>
        <div className="badges" style={{ marginTop: 6 }}>
          <span className="badge">👥 من ٣ إلى ١٠ لاعبين</span>
          <span className="badge">📱 كل واحد من جواله</span>
          <span className="badge green">✨ بدون تسجيل</span>
        </div>
      </header>

      <section className="card stack" aria-label="ابدأ اللعب">
        <div className="field">
          <label className="label" htmlFor="nickname">
            اسمك المستعار
          </label>
          <input
            id="nickname"
            className="input"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setNameError(null);
            }}
            placeholder="مثلاً: أبو فهد 😎"
            maxLength={NICKNAME_MAX + 4}
            autoComplete="nickname"
            enterKeyHint="go"
          />
          {nameError && <span className="field-error">{nameError}</span>}
        </div>

        <Button size="lg" block onClick={create} loading={busy === 'create'} disabled={busy !== null}>
          ✨ أنشئ غرفة جديدة
        </Button>

        <div className="divider">أو ادخل غرفة أصدقائك</div>

        <form className="input-row" onSubmit={join}>
          <input
            className="input code"
            value={code}
            onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
            placeholder="••••••"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={ROOM_CODE_LENGTH}
            aria-label="رمز الغرفة"
            autoComplete="off"
            enterKeyHint="go"
          />
          <Button
            variant="purple"
            type="submit"
            loading={busy === 'join'}
            disabled={busy !== null || code.length !== ROOM_CODE_LENGTH}
          >
            ادخل
          </Button>
        </form>
      </section>

      <section className="card">
        <div className="card-title">🎯 كيف نلعب؟</div>
        <HowToPlay />
        <Button variant="ghost" size="sm" block onClick={() => setHelpOpen(true)} style={{ marginTop: 12 }}>
          📖 الشرح خطوة بخطوة مع مثال
        </Button>
      </section>
      <Tutorial open={helpOpen} onClose={() => setHelpOpen(false)} />

      <footer className="footer">اكشف الكذبة • العب مع ربعك من أي مكان</footer>
    </main>
  );
}
