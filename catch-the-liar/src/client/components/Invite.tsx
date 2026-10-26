import { useEffect, useState } from 'react';
import type { RoomView } from '../../shared/types';
import { roomUrl } from '../lib/router';
import { canNativeShare, copyRoomLink, nativeShare, qrDataUrl, whatsappLink } from '../lib/share';
import { game } from '../lib/store';
import { toast } from '../lib/toasts';
import { isHost } from '../lib/view';
import { Button, Sheet } from './ui';

/** Host switch to stop new players from joining; everyone else just sees the status. */
export function LockControl({ view }: { view: RoomView }) {
  const [busy, setBusy] = useState(false);
  if (!isHost(view)) {
    return view.locked ? (
      <p className="center small" style={{ fontWeight: 800, color: 'var(--orange-2)' }}>
        🔒 المضيف قفل الغرفة، ما أحد جديد يقدر يدخل
      </p>
    ) : null;
  }
  async function toggle(locked: boolean) {
    setBusy(true);
    const res = await game.send('room:lock', { locked });
    setBusy(false);
    if (!res.ok) toast(res.error, 'error');
  }
  return (
    <label className="toggle lock-toggle">
      <input
        type="checkbox"
        checked={view.locked}
        disabled={busy}
        onChange={(e) => void toggle(e.target.checked)}
        data-testid="lock-room"
      />
      <span>
        <b>{view.locked ? '🔒 الغرفة مقفلة' : '🔓 قفل الغرفة'}</b>
        <br />
        <span className="small muted">
          {view.locked ? 'ما أحد جديد يقدر يدخل. اللاعبين الموجودين يرجعون عادي لو انقطعوا' : 'إذا اكتملتوا اقفلها عشان ما يدخل أحد غريب'}
        </span>
      </span>
    </label>
  );
}

export function InviteCard({ code, view }: { code: string; view: RoomView }) {
  const [qrOpen, setQrOpen] = useState(false);
  return (
    <section className="card stack" aria-label="دعوة الأصدقاء">
      <div className="code-display">
        <span className="label">رمز الغرفة</span>
        <span className="digits ltr" data-testid="room-code">
          {code}
        </span>
        <span className="tiny muted ltr">{roomUrl(code).replace(/^https?:\/\//, '')}</span>
      </div>
      <div className="share-grid">
        {canNativeShare() ? (
          <Button variant="purple" size="sm" onClick={() => void nativeShare(code)}>
            📤 مشاركة
          </Button>
        ) : (
          <Button variant="purple" size="sm" onClick={() => void copyRoomLink(code)}>
            🔗 نسخ الرابط
          </Button>
        )}
        <a className="btn btn-ghost sm" href={whatsappLink(code)} target="_blank" rel="noopener noreferrer">
          💬 واتساب
        </a>
        {canNativeShare() && (
          <Button variant="ghost" size="sm" onClick={() => void copyRoomLink(code)}>
            🔗 نسخ الرابط
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setQrOpen(true)}>
          🔳 رمز QR
        </Button>
      </div>
      <LockControl view={view} />
      <QrSheet code={code} open={qrOpen} onClose={() => setQrOpen(false)} />
    </section>
  );
}

export function ShareSheet({ view, open, onClose }: { view: RoomView; open: boolean; onClose: () => void }) {
  const code = view.code;
  return (
    <Sheet open={open} onClose={onClose} title="ادعُ أصدقاءك">
      <div className="stack">
        <LockControl view={view} />
        <QrImage code={code} />
        <div className="share-grid">
          {canNativeShare() && (
            <Button variant="purple" size="sm" onClick={() => void nativeShare(code)}>
              📤 مشاركة
            </Button>
          )}
          <Button variant={canNativeShare() ? 'ghost' : 'purple'} size="sm" onClick={() => void copyRoomLink(code)}>
            🔗 نسخ الرابط
          </Button>
          <a className="btn btn-ghost sm" href={whatsappLink(code)} target="_blank" rel="noopener noreferrer">
            💬 واتساب
          </a>
        </div>
      </div>
    </Sheet>
  );
}

function QrSheet({ code, open, onClose }: { code: string; open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="امسح الرمز وادخل">
      <QrImage code={code} />
    </Sheet>
  );
}

function QrImage({ code }: { code: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    qrDataUrl(roomUrl(code)).then((s) => alive && setSrc(s));
    return () => {
      alive = false;
    };
  }, [code]);
  return (
    <div className="qr-box">
      {src ? <img src={src} alt={`رمز QR لدخول الغرفة ${code}`} /> : <span className="spinner" />}
      <span className="digits ltr" style={{ fontSize: 30, fontWeight: 900, letterSpacing: '0.14em', color: 'var(--orange-2)' }}>
        {code}
      </span>
    </div>
  );
}
