import { describe, expect, it } from 'vitest';
import { GameRoom } from '../src/server/game/room';
import {
  GUESS_MS,
  HOST_GRACE_MS,
  OFFLINE_REMOVE_MS,
  OFFLINE_TURN_GRACE_MS,
  REVEAL_MS,
  ROOM_IDLE_CLOSE_MS,
} from '../src/server/game/constants';
import type { RoomState } from '../src/server/game/types';
import { POINTS } from '../src/shared/types';
import { T0, currentTurn, liarOf, playAllHints, roomWith, startToHints, testDeps } from './helpers';

describe('room membership', () => {
  it('makes the first player host and validates nicknames', () => {
    const { room, ids } = roomWith(1);
    expect(room.state.hostId).toBe(ids[0]);
    expect(room.addPlayer({ id: 'x1', nickname: 'ا', tokenHash: 'h', now: T0 }).ok).toBe(false);
    expect(room.addPlayer({ id: 'x2', nickname: ' لاعب1 ', tokenHash: 'h', now: T0 })).toMatchObject({ ok: false });
    expect(room.addPlayer({ id: 'x3', nickname: 'سارة‮', tokenHash: 'h', now: T0 }).ok).toBe(true);
    expect(room.getPlayer('x3')!.nickname).toBe('سارة');
  });

  it('caps the room at 10 players', () => {
    const { room } = roomWith(10);
    const res = room.addPlayer({ id: 'extra', nickname: 'زائد', tokenHash: 'h', now: T0 });
    expect(res).toMatchObject({ ok: false });
  });

  it('only the host can kick, and kicked tokens are banned', () => {
    const { room, ids } = roomWith(4);
    expect(room.kick(ids[1]!, ids[2]!, T0).ok).toBe(false);
    expect(room.kick(ids[0]!, ids[2]!, T0).ok).toBe(true);
    expect(room.getPlayer(ids[2]!)).toBeUndefined();
    expect(room.isBanned('hash-3')).toBe(true);
  });

  it('passes host to the next connected player when the host leaves', () => {
    const { room, ids } = roomWith(3);
    room.setConnected(ids[1]!, false, T0);
    room.leave(ids[0]!, T0);
    expect(room.state.hostId).toBe(ids[2]);
  });

  it('closes the room when the last player leaves', () => {
    const { room, ids } = roomWith(1);
    room.leave(ids[0]!, T0);
    expect(room.closed).toBe(true);
  });
});

describe('starting a round', () => {
  it('needs the host and at least 3 connected players', () => {
    const { room, ids } = roomWith(3);
    expect(room.startRound(ids[1]!, T0).ok).toBe(false);
    room.setConnected(ids[2]!, false, T0);
    expect(room.startRound(ids[0]!, T0)).toMatchObject({ ok: false });
    room.setConnected(ids[2]!, true, T0);
    expect(room.startRound(ids[0]!, T0).ok).toBe(true);
    expect(room.state.phase).toBe('reveal');
    expect(room.state.round!.participants).toHaveLength(3);
  });

  it('never picks locked (Plus) packs', () => {
    const { room, ids } = roomWith(3);
    room.updateSettings(ids[0]!, { packIds: ['secret'] });
    expect(room.state.settings.packIds).toEqual([]);
    for (let i = 0; i < 20; i++) {
      room.startRound(ids[0]!, T0);
      expect(room.state.round!.packId).not.toBe('secret');
      room.state.phase = 'results';
    }
  });

  it('does not repeat words until the selection is exhausted', () => {
    const { room, ids } = roomWith(3);
    room.updateSettings(ids[0]!, { packIds: ['animals'] });
    const seen = new Set<string>();
    for (let i = 0; i < 9; i++) {
      expect(room.startRound(ids[0]!, T0).ok).toBe(true);
      seen.add(room.state.round!.word);
      room.state.usedWordIds.push(room.state.round!.wordId);
      room.state.phase = 'results';
    }
    expect(seen.size).toBe(9);
    expect(room.startRound(ids[0]!, T0).ok).toBe(true); // cycle restarts
  });

  it('spreads the liar role across players', () => {
    const { room, ids } = roomWith(4, 99);
    const counts = new Map<string, number>();
    for (let i = 0; i < 200; i++) {
      room.startRound(ids[0]!, T0);
      counts.set(liarOf(room), (counts.get(liarOf(room)) ?? 0) + 1);
      room.state.phase = 'results';
    }
    expect(counts.size).toBe(4);
    for (const c of counts.values()) expect(c).toBeGreaterThan(25);
  });
});

describe('secret information', () => {
  it('only civilians receive the word; the liar and spectators never do', () => {
    const { room, ids } = roomWith(4);
    room.startRound(ids[0]!, T0);
    room.addPlayer({ id: 'late', nickname: 'متأخر', tokenHash: 'h', now: T0 });
    room.setConnected('late', true, T0);
    const r = room.state.round!;
    for (const id of [...ids, 'late']) {
      const view = room.viewFor(id, T0);
      const json = JSON.stringify(view);
      if (id === r.liarId) {
        expect(view.secret).toMatchObject({ role: 'liar' });
        expect(json).not.toContain(r.word);
        expect(json).not.toContain(r.wordId);
      } else if (id === 'late') {
        expect(view.secret).toEqual({ role: 'spectator' });
        expect(json).not.toContain(r.word);
      } else {
        expect(view.secret).toMatchObject({ role: 'civilian', word: r.word });
      }
      // Nobody can tell who the liar is from the public part of the view.
      expect(json).not.toContain('liarId');
    }
  });

  it('hides the category from the liar when the host turns it off', () => {
    const { room, ids } = roomWith(3);
    room.updateSettings(ids[0]!, { liarSeesCategory: false });
    room.startRound(ids[0]!, T0);
    expect(room.viewFor(liarOf(room), T0).secret).toEqual({ role: 'liar', category: null });
  });

  it('keeps votes secret until the results', () => {
    const { room, ids } = roomWith(4);
    startToHints(room, ids);
    playAllHints(room);
    const [a, b] = room.state.round!.participants;
    room.castVote(a!, b!, T0);
    const other = room.viewFor(b!, T0);
    expect(other.myVote).toBeNull();
    expect(other.players.find((p) => p.id === a)!.hasVoted).toBe(true);
    expect(JSON.stringify(other)).not.toContain(`"${a}":"${b}"`);
  });
});

describe('round flow', () => {
  it('moves to hints when everyone is ready, or when the reveal timer ends', () => {
    const { room, ids } = roomWith(3);
    room.startRound(ids[0]!, T0);
    room.markReady(ids[0]!, T0);
    expect(room.state.phase).toBe('reveal');
    room.tick(T0 + REVEAL_MS);
    expect(room.state.phase).toBe('hints');
  });

  it('enforces turn order and covers every player for each hint round', () => {
    const { room, ids } = roomWith(4);
    room.updateSettings(ids[0]!, { hintRounds: 2 });
    startToHints(room, ids);
    const r = room.state.round!;
    const notCurrent = r.participants.find((id) => id !== currentTurn(room))!;
    expect(room.submitHint(notCurrent, 'تلميح', T0)).toMatchObject({ ok: false });
    playAllHints(room);
    expect(r.hints).toHaveLength(8);
    for (const id of r.participants) expect(r.hints.filter((h) => h.playerId === id)).toHaveLength(2);
    expect(room.state.phase).toBe('voting');
  });

  it('rejects hints that give away the word (civilians only)', () => {
    const { room, ids } = roomWith(3);
    startToHints(room, ids);
    const r = room.state.round!;
    // Rotate turns until a civilian is up.
    while (currentTurn(room) === r.liarId) room.submitHint(r.liarId, 'شي', T0);
    const res = room.submitHint(currentTurn(room), `أحب ${r.word}`, T0);
    expect(res).toMatchObject({ ok: false });
  });

  it('skips a turn when the timer ends', () => {
    const { room, ids } = roomWith(3);
    room.updateSettings(ids[0]!, { hintRounds: 1, hintSeconds: 20 });
    startToHints(room, ids);
    const first = currentTurn(room);
    room.tick(T0 + 20_000);
    expect(room.state.round!.hints[0]).toMatchObject({ playerId: first, text: null });
    expect(currentTurn(room)).not.toBe(first);
  });

  it('lets the host skip an absent player', () => {
    const { room, ids } = roomWith(3);
    startToHints(room, ids);
    const cur = currentTurn(room);
    const someoneElse = room.state.round!.participants.find((id) => id !== cur && id !== room.state.hostId);
    if (someoneElse) expect(room.skipTurn(someoneElse, T0).ok).toBe(false);
    expect(room.skipTurn(room.state.hostId, T0).ok).toBe(true);
  });
});

describe('voting and scoring', () => {
  function toVoting(n = 4, seed = 7) {
    const ctx = roomWith(n, seed);
    ctx.room.updateSettings(ctx.ids[0]!, { hintRounds: 1 });
    startToHints(ctx.room, ctx.ids);
    playAllHints(ctx.room);
    return ctx;
  }

  it('rejects self votes and votes for non-participants', () => {
    const { room } = toVoting();
    const [a] = room.state.round!.participants;
    expect(room.castVote(a!, a!, T0).ok).toBe(false);
    expect(room.castVote(a!, 'nobody', T0).ok).toBe(false);
  });

  it('catching the liar opens the guess phase; a wrong guess keeps civilians ahead', () => {
    const { room } = toVoting(4);
    const r = room.state.round!;
    const liar = r.liarId;
    const civilians = r.participants.filter((id) => id !== liar);
    for (const c of civilians) room.castVote(c, liar, T0);
    room.castVote(liar, civilians[0]!, T0);
    expect(room.state.phase).toBe('guess');
    const liarView = room.viewFor(liar, T0);
    const civView = room.viewFor(civilians[0]!, T0);
    expect(liarView.guess!.options).toHaveLength(8);
    expect(liarView.guess!.options).toContain(r.word);
    expect(civView.guess!.options).toBeNull();
    const wrong = r.guessOptions.find((w) => w !== r.word)!;
    room.submitGuess(liar, wrong, T0);
    expect(room.state.phase).toBe('results');
    const result = room.viewFor(liar, T0).result!;
    expect(result.caught).toBe(true);
    expect(result.guess).toEqual({ word: wrong, correct: false });
    for (const c of civilians) expect(room.getPlayer(c)!.score).toBe(POINTS.correct_vote);
    expect(room.getPlayer(liar)!.score).toBe(0);
  });

  it('a correct guess earns the liar points', () => {
    const { room } = toVoting(3);
    const r = room.state.round!;
    const civilians = r.participants.filter((id) => id !== r.liarId);
    for (const c of civilians) room.castVote(c, r.liarId, T0);
    room.castVote(r.liarId, civilians[0]!, T0);
    room.submitGuess(r.liarId, r.word, T0);
    expect(room.getPlayer(r.liarId)!.score).toBe(POINTS.liar_guessed);
  });

  it('a tie means the liar escapes', () => {
    const { room } = toVoting(4);
    const r = room.state.round!;
    const liar = r.liarId;
    const [c1, c2, c3] = r.participants.filter((id) => id !== liar) as [string, string, string];
    room.castVote(c1, liar, T0);
    room.castVote(c2, c3, T0);
    room.castVote(c3, liar, T0);
    room.castVote(liar, c3, T0); // liar 2 votes, c3 2 votes
    expect(room.state.phase).toBe('results');
    expect(room.state.round!.result!.caught).toBe(false);
    expect(room.getPlayer(liar)!.score).toBe(POINTS.liar_escaped);
    expect(room.getPlayer(c1)!.score).toBe(POINTS.correct_vote);
    expect(room.getPlayer(c2)!.score).toBe(0);
  });

  it('voting ends on timeout with whatever votes exist', () => {
    const { room } = toVoting(3);
    room.tick(T0 + 60_000);
    expect(room.state.phase).toBe('results');
    expect(room.state.round!.result!.caught).toBe(false);
  });

  it('the guess times out as a wrong answer', () => {
    const { room } = toVoting(3);
    const r = room.state.round!;
    for (const id of r.participants.filter((x) => x !== r.liarId)) room.castVote(id, r.liarId, T0);
    room.castVote(r.liarId, r.participants.find((x) => x !== r.liarId)!, T0);
    expect(room.state.phase).toBe('guess');
    room.tick(T0 + GUESS_MS);
    expect(room.state.phase).toBe('results');
    expect(room.state.round!.result!.guess).toEqual({ word: null, correct: false });
  });

  it('starts a new round from results with fresh roles and keeps scores', () => {
    const { room, ids } = toVoting(3);
    room.tick(T0 + 60_000);
    const firstWord = room.state.round!.word;
    const scores = room.state.players.map((p) => p.score);
    expect(room.startRound(ids[0]!, T0 + 70_000).ok).toBe(true);
    expect(room.state.round!.number).toBe(2);
    expect(room.state.round!.word).not.toBe(firstWord);
    expect(room.state.players.map((p) => p.score)).toEqual(scores);
    room.state.phase = 'results';
    expect(room.resetScores(ids[0]!).ok).toBe(true);
    expect(room.state.players.every((p) => p.score === 0)).toBe(true);
  });
});

describe('disconnects and leaving', () => {
  it('skips the turn of a disconnected player after a grace period', () => {
    const { room, ids } = roomWith(3);
    room.updateSettings(ids[0]!, { hintSeconds: 90 });
    startToHints(room, ids);
    const cur = currentTurn(room);
    room.setConnected(cur, false, T0 + 1000);
    room.tick(T0 + 1000 + OFFLINE_TURN_GRACE_MS - 1);
    expect(currentTurn(room)).toBe(cur);
    room.tick(T0 + 1000 + OFFLINE_TURN_GRACE_MS);
    expect(room.state.round!.hints[0]).toMatchObject({ playerId: cur, text: null });
  });

  it('finishes voting without waiting for disconnected players', () => {
    const { room, ids } = roomWith(4);
    room.updateSettings(ids[0]!, { hintRounds: 1 });
    startToHints(room, ids);
    playAllHints(room);
    const [a, b, c, d] = room.state.round!.participants as [string, string, string, string];
    room.setConnected(d, false, T0);
    room.castVote(a, b, T0);
    room.castVote(b, c, T0);
    expect(room.state.phase).toBe('voting');
    room.castVote(c, a, T0);
    expect(room.state.phase).not.toBe('voting');
  });

  it('a returning player gets their secret back', () => {
    const { room, ids } = roomWith(3);
    room.startRound(ids[0]!, T0);
    const civ = room.state.round!.participants.find((id) => id !== liarOf(room))!;
    room.setConnected(civ, false, T0);
    room.setConnected(civ, true, T0 + 5000);
    expect(room.viewFor(civ, T0 + 5000).secret).toMatchObject({ role: 'civilian', word: room.state.round!.word });
  });

  it('ends the round when the liar leaves', () => {
    const { room, ids } = roomWith(4);
    startToHints(room, ids);
    room.leave(liarOf(room), T0);
    expect(room.state.phase).toBe('results');
    expect(room.state.round!.result!.reason).toBe('liar_left');
    expect(room.state.players.every((p) => p.score === 0)).toBe(true);
  });

  it('aborts when fewer than 3 players remain', () => {
    const { room, ids } = roomWith(3);
    startToHints(room, ids);
    const civ = room.state.round!.participants.find((id) => id !== liarOf(room))!;
    room.leave(civ, T0);
    expect(room.state.round!.result!.reason).toBe('not_enough_players');
  });

  it('removes a leaving player from future turns and their votes', () => {
    const { room, ids } = roomWith(5);
    room.updateSettings(ids[0]!, { hintRounds: 2 });
    startToHints(room, ids);
    const r = room.state.round!;
    const leaver = r.participants.find((id) => id !== r.liarId && id !== currentTurn(room))!;
    room.leave(leaver, T0);
    expect(r.turnQueue.slice(r.turnIndex).some((s) => s.playerId === leaver)).toBe(false);
    playAllHints(room);
    expect(room.state.phase).toBe('voting');
  });

  it('moves the current turn on if the speaking player leaves', () => {
    const { room, ids } = roomWith(4);
    startToHints(room, ids);
    const r = room.state.round!;
    let cur = currentTurn(room);
    while (cur === r.liarId) {
      room.submitHint(cur, 'شي', T0);
      cur = currentTurn(room);
    }
    room.leave(cur, T0);
    expect(currentTurn(room)).not.toBe(cur);
  });

  it('transfers host after the host is offline for a while', () => {
    const { room, ids } = roomWith(3);
    room.setConnected(ids[0]!, false, T0);
    room.tick(T0 + HOST_GRACE_MS - 1);
    expect(room.state.hostId).toBe(ids[0]);
    room.tick(T0 + HOST_GRACE_MS);
    expect(room.state.hostId).toBe(ids[1]);
  });

  it('removes long-offline players and closes idle rooms', () => {
    const { room, ids } = roomWith(3);
    room.setConnected(ids[2]!, false, T0);
    room.tick(T0 + OFFLINE_REMOVE_MS);
    expect(room.getPlayer(ids[2]!)).toBeUndefined();
    room.setConnected(ids[0]!, false, T0 + OFFLINE_REMOVE_MS);
    room.setConnected(ids[1]!, false, T0 + OFFLINE_REMOVE_MS);
    room.tick(T0 + OFFLINE_REMOVE_MS + 1);
    expect(room.nextWakeAt()).not.toBeNull();
    room.tick(T0 + OFFLINE_REMOVE_MS + ROOM_IDLE_CLOSE_MS + 1);
    expect(room.closed).toBe(true);
  });
});

describe('settings and snapshots', () => {
  it('ignores invalid settings and blocks changes mid-round', () => {
    const { room, ids } = roomWith(3);
    room.updateSettings(ids[0]!, { hintSeconds: 999, voteSeconds: 45, hintRounds: 7 as never, packIds: ['food', 'nope'] });
    expect(room.state.settings).toMatchObject({ hintSeconds: 45, voteSeconds: 45, hintRounds: 2, packIds: ['food'] });
    room.startRound(ids[0]!, T0);
    expect(room.updateSettings(ids[0]!, { hintRounds: 1 }).ok).toBe(false);
  });

  it('survives a JSON snapshot round-trip mid-round', () => {
    const { room, ids } = roomWith(3);
    startToHints(room, ids);
    const json = JSON.stringify(room.state);
    const restored = GameRoom.restore(JSON.parse(json) as RoomState, testDeps(), T0 + 1000);
    expect(restored.state.phase).toBe('hints');
    expect(restored.state.players.every((p) => !p.connected)).toBe(true);
    expect(restored.state.phaseEndsAt!).toBeGreaterThanOrEqual(T0 + 1000 + 20_000);
    for (const id of ids) restored.setConnected(id, true, T0 + 2000);
    playAllHints(restored, T0 + 2000);
    expect(restored.state.phase).toBe('voting');
  });
});
