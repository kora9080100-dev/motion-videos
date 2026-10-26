import { roomUrl } from './router';
import { toast } from './toasts';

export function inviteText(code: string): string {
  return `تعال العب معي «اكشف الكذبة» 🕵️ رمز الغرفة: ${code}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / insecure contexts.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export async function copyRoomLink(code: string): Promise<void> {
  const ok = await copyText(roomUrl(code));
  toast(ok ? 'تم نسخ رابط الغرفة ✅' : 'ما قدرنا ننسخ، انسخ الرابط يدوياً', ok ? 'success' : 'warn');
}

export function canNativeShare(): boolean {
  return typeof navigator.share === 'function';
}

export async function nativeShare(code: string): Promise<void> {
  try {
    await navigator.share({ title: 'اكشف الكذبة', text: inviteText(code), url: roomUrl(code) });
  } catch (err) {
    if ((err as Error).name !== 'AbortError') await copyRoomLink(code);
  }
}

export function whatsappLink(code: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${inviteText(code)}\n${roomUrl(code)}`)}`;
}

export async function qrDataUrl(text: string): Promise<string> {
  const QR = await import('qrcode');
  const svg = await QR.toString(text, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#140b26', light: '#ffffff' },
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
