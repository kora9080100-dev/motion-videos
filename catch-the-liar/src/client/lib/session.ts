import type { SessionInfo } from '../../shared/types';

// Sessions live in localStorage so a player can come back after closing the browser.
// sessionStorage marks which room *this tab* is in, so a refresh resumes automatically
// while a fresh tab asks before reusing an identity (handy when testing on one device).

export interface StoredSession extends SessionInfo {
  nickname: string;
  savedAt: number;
}

const NICK_KEY = 'ctl.nickname';
const SESSION_PREFIX = 'ctl.session.';
const ACTIVE_KEY = 'ctl.active';
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function getNickname(): string {
  return safe(() => localStorage.getItem(NICK_KEY) ?? '', '');
}

export function saveNickname(name: string): void {
  safe(() => localStorage.setItem(NICK_KEY, name), undefined);
}

export function saveSession(s: SessionInfo, nickname: string): void {
  const value: StoredSession = { ...s, nickname, savedAt: Date.now() };
  safe(() => {
    localStorage.setItem(SESSION_PREFIX + s.code, JSON.stringify(value));
    sessionStorage.setItem(ACTIVE_KEY, s.code);
  }, undefined);
}

export function getSession(code: string): StoredSession | null {
  return safe(() => {
    const raw = localStorage.getItem(SESSION_PREFIX + code);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredSession;
    if (!s.token || Date.now() - s.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(SESSION_PREFIX + code);
      return null;
    }
    return s;
  }, null);
}

export function isActiveInThisTab(code: string): boolean {
  return safe(() => sessionStorage.getItem(ACTIVE_KEY) === code, false);
}

export function markActive(code: string): void {
  safe(() => sessionStorage.setItem(ACTIVE_KEY, code), undefined);
}

export function clearSession(code: string): void {
  safe(() => {
    localStorage.removeItem(SESSION_PREFIX + code);
    if (sessionStorage.getItem(ACTIVE_KEY) === code) sessionStorage.removeItem(ACTIVE_KEY);
  }, undefined);
}

export function touchSession(code: string): void {
  const s = getSession(code);
  if (s) safe(() => localStorage.setItem(SESSION_PREFIX + code, JSON.stringify({ ...s, savedAt: Date.now() })), undefined);
}
