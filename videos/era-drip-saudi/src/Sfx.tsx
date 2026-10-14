import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {SHOTS} from './shots';
import {Move} from './scenes/Footage';
import {T} from './theme';

type Cue = {at: number; file: string; volume?: number; dur?: number};

const MOVE_SFX: Record<Move, {file: string; volume: number; lead: number} | null> = {
	whipL: {file: 'whip.wav', volume: 0.55, lead: 3},
	whipR: {file: 'whip.wav', volume: 0.55, lead: 3},
	whipUp: {file: 'whip.wav', volume: 0.55, lead: 3},
	whipDown: {file: 'whip.wav', volume: 0.55, lead: 3},
	zoom: {file: 'whoosh.wav', volume: 0.5, lead: 6},
	flash: {file: 'impact.wav', volume: 0.35, lead: 0},
	none: null,
};

// One cue per transition, taken from the shot list so sound and picture stay locked.
const transitionCues = (): Cue[] => {
	const cues: Cue[] = [];
	for (const s of SHOTS) {
		const m = s.enter ? MOVE_SFX[s.enter] : null;
		if (m) cues.push({at: s.from - m.lead, file: m.file, volume: m.volume});
		if (s.word) cues.push({at: s.from, file: 'hit.wav', volume: 0.45});
	}
	return cues;
};

const SCENE_CUES: Cue[] = [
	{at: 30, file: 'whoosh.wav', volume: 0.55},
	{at: T.falcon + 2, file: 'wings.wav', volume: 0.5},
	{at: T.falcon + 6, file: 'falcon.wav', volume: 0.45},
	{at: T.falcon + 9, file: 'flap.wav', volume: 0.4},
	{at: T.prep - 6, file: 'whoosh.wav', volume: 0.6},
	{at: T.emblem - 16, file: 'riser.wav', volume: 0.5},
	{at: T.emblem, file: 'impact.wav', volume: 0.8},
	{at: T.emblem + 2, file: 'shimmer.wav', volume: 0.55},
	{at: T.ceremony, file: 'roll.wav', volume: 0.7},
	{at: T.ceremony + 1, file: 'flap.wav', volume: 0.45},
	{at: T.guards, file: 'boom.wav', volume: 0.5},
	{at: T.swords, file: 'sword.wav', volume: 0.6},
	{at: T.swords + 3, file: 'sword.wav', volume: 0.4},
	{at: T.cupLand - 11, file: 'fall.wav', volume: 0.55},
	{at: T.cupLand, file: 'impact.wav', volume: 0.9},
	{at: T.push - 4, file: 'riser.wav', volume: 0.35},
	{at: T.drop, file: 'jet.wav', volume: 0.7, dur: 95},
	{at: T.drop + 4, file: 'jet.wav', volume: 0.28, dur: 95},
	{at: T.montage - 8, file: 'whoosh.wav', volume: 0.6},
	{at: 449, file: 'jet.wav', volume: 0.7, dur: 95},
	{at: T.finale + 2, file: 'jet.wav', volume: 0.55, dur: 95},
	{at: T.logo, file: 'impact.wav', volume: 0.55},
	{at: T.logo + 2, file: 'shimmer.wav', volume: 0.6},
	{at: T.tagline, file: 'hit.wav', volume: 0.4},
];

// Under the reference track only the big moments get a sound effect, kept low.
const MUSIC_CUES: Cue[] = [
	{at: T.falcon + 6, file: 'falcon.wav', volume: 0.3},
	{at: T.swords, file: 'sword.wav', volume: 0.35},
	{at: T.cupLand, file: 'boom.wav', volume: 0.35},
	{at: T.drop, file: 'jet.wav', volume: 0.55, dur: 95},
	{at: 449, file: 'jet.wav', volume: 0.45, dur: 95},
	{at: T.finale + 2, file: 'jet.wav', volume: 0.4, dur: 95},
	{at: T.logo + 2, file: 'shimmer.wav', volume: 0.35},
];

export const Soundtrack: React.FC<{mode: 'sfx' | 'music'}> = ({mode}) => {
	const cues = mode === 'sfx' ? [...SCENE_CUES, ...transitionCues()] : MUSIC_CUES;
	// headroom so stacked hits never clip
	const master = mode === 'sfx' ? 0.62 : 0.85;
	return (
		<>
			{mode === 'sfx' ? (
				<Audio src={staticFile('sfx/bed.wav')} volume={0.8 * master} />
			) : (
				<Audio src={staticFile('audio/ref-music.m4a')} volume={master} />
			)}
			{cues.map((c, i) => (
				<Sequence key={i} from={Math.max(0, c.at)} durationInFrames={c.dur ?? 75}>
					<Audio src={staticFile(`sfx/${c.file}`)} volume={(c.volume ?? 1) * master} />
				</Sequence>
			))}
		</>
	);
};
