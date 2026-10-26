import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { CHAT_MAX, type RoomView } from '../../shared/types';
import { game, useGame } from '../lib/store';
import { toast } from '../lib/toasts';
import { Avatar, Button } from './ui';

const QUICK = ['😂', '🤔', '😈', '👏', 'شاكّ فيك 👀', 'مستحيل 😳', 'أحسنت 🔥'];

async function send(text: string): Promise<boolean> {
  const res = await game.send('chat:send', { text });
  if (!res.ok) toast(res.error, 'error');
  return res.ok;
}

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString('ar-SA-u-nu-latn', { hour: 'numeric', minute: '2-digit' });
}

/** Message list + quick reactions + input. Used in the mobile sheet and the desktop side card. */
export function ChatPanel({ view, active }: { view: RoomView; active: boolean }) {
  const { chat } = useGame();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);

  // While visible, everything shown counts as read.
  useEffect(() => {
    if (active) game.markChatRead();
  }, [active, chat.length]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight;
  }, [chat.length, active]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    const ok = await send(text);
    setBusy(false);
    if (ok) setText('');
  }

  return (
    <div className="chat">
      <div
        className="chat-list"
        ref={listRef}
        aria-live="polite"
        data-testid="chat-list"
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {chat.length === 0 ? (
          <p className="center muted small" style={{ padding: '24px 8px' }}>
            ما فيه رسائل للحين… قل هلا 👋
          </p>
        ) : (
          chat.map((m) => {
            const mine = m.playerId === view.meId;
            return (
              <div key={m.id} className={`chat-msg ${mine ? 'mine' : ''}`}>
                {!mine && <Avatar player={{ nickname: m.nickname, avatar: m.avatar, connected: true, isHost: false }} size="sm" />}
                <div className="chat-bubble">
                  {!mine && <span className="who">{m.nickname}</span>}
                  <span className="txt">{m.text}</span>
                  <span className="at">{timeLabel(m.at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="chat-quick" aria-label="ردود سريعة">
        {QUICK.map((q) => (
          <button key={q} type="button" className="chip" onClick={() => void send(q)}>
            {q}
          </button>
        ))}
      </div>
      <form className="input-row" onSubmit={submit}>
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب رسالة…"
          maxLength={CHAT_MAX}
          enterKeyHint="send"
          autoComplete="off"
          aria-label="رسالة"
          data-testid="chat-input"
        />
        <Button type="submit" variant="purple" loading={busy} disabled={!text.trim()} data-testid="chat-send">
          أرسل
        </Button>
      </form>
      <p className="tiny muted center">لا تكتب الكلمة السرية 😉 الروابط والكلام غير اللائق ممنوع</p>
    </div>
  );
}

/** Header button with the unread count (phones; desktop shows the chat in the side column). */
export function ChatButton({ meId, onClick }: { meId: string; onClick: () => void }) {
  const { chat, chatReadAt } = useGame();
  const unread = chat.filter((m) => m.at > chatReadAt && m.playerId !== meId).length;
  return (
    <button
      className={`icon-btn chat-btn mobile-only ${unread ? 'has-unread' : ''}`}
      onClick={onClick}
      aria-label={unread ? `الدردشة، ${unread} رسائل جديدة` : 'الدردشة'}
      data-testid="chat-button"
    >
      💬
      {unread > 0 && <span className="badge-count">{unread > 9 ? '9+' : unread}</span>}
    </button>
  );
}
