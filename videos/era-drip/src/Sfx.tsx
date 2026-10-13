import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {SEGMENTS, TRIPTYCH} from './Montage';
import {T} from './theme';

type Cue = {at: number; file: string; volume?: number; dur?: number};

const montageCues = (): Cue[] => {
	const cues: Cue[] = [];
	const cuts = [...SEGMENTS.map((s) => ({from: s.from, fx: s.fx})), {from: TRIPTYCH.from, fx: 'triptych'}];
	for (const c of cuts) {
		if (c.from === T.montage) continue;
		if (c.fx === 'glitch') cues.push({at: c.from, file: 'glitch.wav', volume: 0.55});
		else if (c.fx === 'toWhite') continue;
		else cues.push({at: c.from, file: 'whip.wav', volume: 0.45});
	}
	for (const at of [T.montage, TRIPTYCH.from, 657, 773, 876, 913]) cues.push({at, file: 'hit.wav', volume: 0.8});
	return cues;
};

const CUES: Cue[] = [
	// chat
	{at: 4, file: 'send.wav', volume: 0.7},
	{at: 16, file: 'send.wav', volume: 0.7},
	{at: 34, file: 'send.wav', volume: 0.7},
	{at: 60, file: 'send.wav', volume: 0.7},
	{at: 147, file: 'whoosh.wav', volume: 0.6},
	{at: 172, file: 'typing.wav', volume: 0.5, dur: 36},
	{at: 208, file: 'typing.wav', volume: 0.5, dur: 36},
	{at: 244, file: 'typing.wav', volume: 0.5, dur: 22},
	{at: 267, file: 'receive.wav', volume: 0.75},
	{at: 370, file: 'whoosh.wav', volume: 0.6},
	{at: T.reply + 4, file: 'receive.wav', volume: 0.6},
	{at: T.reply + 4, file: 'impact.wav', volume: 0.85},
	{at: 460, file: 'riser.wav', volume: 0.55},
	// montage
	...montageCues(),
	// logo
	{at: 935, file: 'riser.wav', volume: 0.5},
	{at: T.logo, file: 'impact.wav', volume: 0.9},
	{at: T.logo + 4, file: 'shimmer.wav', volume: 0.6},
];

export const Sfx: React.FC = () => (
	<>
		{CUES.map((c, i) => (
			<Sequence key={i} from={c.at} durationInFrames={c.dur ?? 90}>
				<Audio src={staticFile(`sfx/${c.file}`)} volume={c.volume ?? 1} />
			</Sequence>
		))}
	</>
);
