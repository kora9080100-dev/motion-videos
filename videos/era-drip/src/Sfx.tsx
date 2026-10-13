import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {SHOTS, TRANSITIONS, Tr, WORDS} from './Montage';
import {T} from './theme';

type Cue = {at: number; file: string; volume?: number; dur?: number};

const TRANSITION_SFX: Record<Tr, {file: string; volume: number; lead: number} | null> = {
	flash: {file: 'impact.wav', volume: 0.55, lead: 0},
	whipUp: {file: 'whip.wav', volume: 0.6, lead: 3},
	whipDown: {file: 'whip.wav', volume: 0.6, lead: 3},
	whipL: {file: 'whip.wav', volume: 0.6, lead: 3},
	whipR: {file: 'whip.wav', volume: 0.6, lead: 3},
	zoom: {file: 'whoosh.wav', volume: 0.6, lead: 7},
	spin: {file: 'whoosh.wav', volume: 0.55, lead: 6},
	glitch: {file: 'glitch.wav', volume: 0.55, lead: 1},
	flip: {file: 'whip.wav', volume: 0.55, lead: 3},
	line: {file: 'whoosh.wav', volume: 0.5, lead: 8},
	iris: {file: 'whoosh.wav', volume: 0.5, lead: 10},
	push: {file: 'whoosh.wav', volume: 0.5, lead: 8},
	cut: null,
};

const montageCues = (): Cue[] => {
	const cues: Cue[] = [{at: T.montage, file: 'hit.wav', volume: 0.85}, {at: T.montage + 5, file: 'typing.wav', volume: 0.35, dur: 18}];
	TRANSITIONS.forEach((tr, i) => {
		const sfx = TRANSITION_SFX[tr];
		const at = SHOTS[i + 1].from;
		if (sfx) cues.push({at: at - sfx.lead, file: sfx.file, volume: sfx.volume});
		cues.push({at, file: 'hit.wav', volume: 0.55});
	});
	for (const w of WORDS) cues.push({at: w.from, file: 'impact.wav', volume: 0.45});
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
