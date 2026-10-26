import { useEffect, useState } from 'react';
import { roomUrl } from '../lib/router';
import { canNativeShare, copyRoomLink, nativeShare, qrDataUrl, whatsappLink } from '../lib/share';
import { Button, Sheet } from './ui';

export function InviteCard({ code }: { code: string }) {
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
      <QrSheet code={code} open={qrOpen} onClose={() => setQrOpen(false)} />
    </section>
  );
}

export function ShareSheet({ code, open, onClose }: { code: string; open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="ادعُ أصدقاءك">
      <div className="stack">
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
