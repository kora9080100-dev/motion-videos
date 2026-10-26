export const REVEAL_MS = 30_000;
export const GUESS_MS = 30_000;
/** A disconnected player's hint turn is skipped after this grace period. */
export const OFFLINE_TURN_GRACE_MS = 12_000;
/** A disconnected liar loses the guess after this grace period. */
export const OFFLINE_GUESS_GRACE_MS = 12_000;
/** Host role moves to another connected player after the host is offline this long. */
export const HOST_GRACE_MS = 20_000;
/** Offline players are removed from the room after this long. */
export const OFFLINE_REMOVE_MS = 10 * 60_000;
/** Rooms with nobody connected are closed after this long. */
export const ROOM_IDLE_CLOSE_MS = 30 * 60_000;
export const AVATAR_COUNT = 10;
