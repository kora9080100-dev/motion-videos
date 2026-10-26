import type { RoomView } from '../../shared/types';
import { Avatar } from './ui';

const MEDALS = ['🥇', '🥈', '🥉'];

export function Scoreboard({ view, showDeltas = false }: { view: RoomView; showDeltas?: boolean }) {
  const deltas = new Map(showDeltas && view.result ? view.result.points.map((p) => [p.playerId, p.delta]) : []);
  const sorted = [...view.players].sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname, 'ar'));
  const max = Math.max(1, ...sorted.map((p) => p.score));
  let lastScore = Number.NaN;
  let rank = 0;
  return (
    <div className="score-list" data-testid="scoreboard">
      {sorted.map((p, i) => {
        if (p.score !== lastScore) rank = i;
        lastScore = p.score;
        const d = deltas.get(p.id) ?? 0;
        return (
          <div className="score-row" key={p.id}>
            <span className="fill" style={{ width: `${(p.score / max) * 100}%` }} />
            <span className="rank">{p.score > 0 && rank < 3 ? MEDALS[rank] : rank + 1}</span>
            <Avatar player={p} size="sm" />
            <span className="name">
              {p.nickname}
              {p.id === view.meId && <span className="muted small"> (أنت)</span>}
            </span>
            {d > 0 && <span className="delta">+{d}</span>}
            <span className="pts">{p.score}</span>
          </div>
        );
      })}
    </div>
  );
}
