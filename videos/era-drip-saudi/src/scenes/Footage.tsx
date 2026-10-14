import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {ClipName, GoldText, Shot, Speed} from '../components/Common';
import {clamp, easeIn, easeOut} from '../theme';

export type Move = 'whipL' | 'whipR' | 'whipUp' | 'whipDown' | 'zoom' | 'flash' | 'none';

export type ShotSpec = {
	from: number;
	to: number;
	clip?: ClipName;
	start?: number;
	speeds?: Speed;
	pos?: string;
	zoom?: [number, number];
	origin?: string;
	enter?: Move;
	exit?: Move;
	word?: {text: string; size?: number; top?: number};
	glow?: {x: number; y: number; from: number};
	punch?: number[]; // local frames that get a zoom punch
	render?: (f: number, dur: number) => React.ReactNode;
};

const IN = 4;
const OUT = 3;

const moveOffset = (m: Move, k: number, entering: boolean) => {
	// k: 1 = fully displaced, 0 = in place
	const d = entering ? -1 : 1;
	switch (m) {
		case 'whipL':
			return {tx: d * -k * 900, ty: 0, s: 1, blur: k * 34};
		case 'whipR':
			return {tx: d * k * 900, ty: 0, s: 1, blur: k * 34};
		case 'whipUp':
			return {tx: 0, ty: d * -k * 1500, s: 1, blur: k * 34};
		case 'whipDown':
			return {tx: 0, ty: d * k * 1500, s: 1, blur: k * 34};
		case 'zoom':
			return {tx: 0, ty: 0, s: entering ? 1 - k * 0.35 : 1 + k * 1.6, blur: k * 26};
		default:
			return {tx: 0, ty: 0, s: 1, blur: 0};
	}
};

const ShotBody: React.FC<{s: ShotSpec}> = ({s}) => {
	const f = useCurrentFrame();
	const dur = s.to - s.from;
	const kin = s.enter && s.enter !== 'flash' && s.enter !== 'none' ? 1 - easeOut(interpolate(f, [0, IN], [0, 1], clamp)) : 0;
	const kout = s.exit && s.exit !== 'flash' && s.exit !== 'none' ? easeIn(interpolate(f, [dur - OUT, dur], [0, 1], clamp)) : 0;
	const a = moveOffset(s.enter ?? 'none', kin, true);
	const b = moveOffset(s.exit ?? 'none', kout, false);
	let punch = 1;
	for (const p of s.punch ?? []) punch += Math.max(0, 1 - Math.abs(f - p) / 4) * 0.05;
	const flash = s.enter === 'flash' ? interpolate(f, [0, 4], [1, 0], clamp) : 0;
	const flashOut = s.exit === 'flash' ? interpolate(f, [dur - 3, dur], [0, 1], clamp) : 0;
	const blur = a.blur + b.blur;
	const glow = s.glow ? easeIn(interpolate(f, [s.glow.from, dur], [0, 1], clamp)) : 0;
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
			<AbsoluteFill
				style={{
					transform: `translate(${a.tx + b.tx}px, ${a.ty + b.ty}px) scale(${a.s * b.s * punch})`,
					filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
				}}
			>
				{s.render ? (
					s.render(f, dur)
				) : (
					<Shot clip={s.clip!} start={s.start ?? 0} f={f} dur={dur} speeds={s.speeds} pos={s.pos} zoom={s.zoom} origin={s.origin} />
				)}
				{glow > 0 ? (
					<AbsoluteFill
						style={{
							background: `radial-gradient(circle at ${s.glow!.x}px ${s.glow!.y}px, rgba(255,236,190,${0.95 * glow}) 0%, rgba(255,200,120,${0.6 * glow}) ${8 + glow * 30}%, rgba(255,180,100,0) ${20 + glow * 60}%)`,
							mixBlendMode: 'screen',
						}}
					/>
				) : null}
			</AbsoluteFill>
			{s.word ? (
				<AbsoluteFill
					style={{
						background: `linear-gradient(180deg, rgba(0,0,0,0) ${((s.word.top ?? 1180) - 260) / 19.2}%, rgba(10,6,4,0.5) ${((s.word.top ?? 1180) + 120) / 19.2}%, rgba(0,0,0,0) ${((s.word.top ?? 1180) + 480) / 19.2}%)`,
					}}
				/>
			) : null}
			{s.word ? <GoldText text={s.word.text} f={f - 1} size={s.word.size ?? 210} top={s.word.top ?? 1180} inDur={5} /> : null}
			{flash > 0 ? <AbsoluteFill style={{background: '#fff8ea', opacity: flash}} /> : null}
			{flashOut > 0 || glow > 0.7 ? (
				<AbsoluteFill style={{background: '#fff8ea', opacity: Math.max(flashOut, glow > 0.7 ? (glow - 0.7) / 0.3 : 0)}} />
			) : null}
		</AbsoluteFill>
	);
};

export const ShotList: React.FC<{shots: ShotSpec[]; offset: number}> = ({shots, offset}) => (
	<>
		{shots.map((s, i) => (
			<Sequence key={i} from={s.from - offset} durationInFrames={s.to - s.from}>
				<ShotBody s={s} />
			</Sequence>
		))}
	</>
);
