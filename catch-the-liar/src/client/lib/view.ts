import type { PlayerView, RoomView } from '../../shared/types';

export function playerById(view: RoomView, id: string | null | undefined): PlayerView | undefined {
  return id ? view.players.find((p) => p.id === id) : undefined;
}

export function mePlayer(view: RoomView): PlayerView | undefined {
  return playerById(view, view.meId);
}

export function isHost(view: RoomView): boolean {
  return view.hostId === view.meId;
}

export function hostName(view: RoomView): string {
  return playerById(view, view.hostId)?.nickname ?? 'المضيف';
}

/** Placeholder avatar data for people who already left the room. */
export function ghostPlayer(nickname: string): Pick<PlayerView, 'nickname' | 'avatar' | 'connected' | 'isHost'> {
  return { nickname: nickname || '؟', avatar: 1, connected: false, isHost: false };
}

/** "لاعب واحد" / "لاعبين" / "٣ لاعبين" / "١١ لاعب" */
export function playersLabel(n: number): string {
  if (n === 1) return 'لاعب واحد';
  if (n === 2) return 'لاعبين';
  if (n >= 3 && n <= 10) return `${n} لاعبين`;
  return `${n} لاعب`;
}

export function toArabicDigits(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]!);
}
