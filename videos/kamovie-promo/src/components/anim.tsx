import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {arabic, clamp, tween} from '../theme';

export type SfxName =
	| 'whoosh'
	| 'whip'
	| 'swoosh-soft'
	| 'click'
	| 'pop'
	| 'type'
	| 'tick'
	| 'impact'
	| 'paper'
	| 'slap'
	| 'thud'
	| 'ding'
	| 'riser';

export const Sfx: React.FC<{name: SfxName; at: number; volume?: number}> = ({
	name,
	at,
	volume = 0.6,
}) => (
	<Sequence from={at} layout="none" name={`sfx:${name}`}>
		<Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
	</Sequence>
);

type From = {
	x?: number;
	y?: number;
	scale?: number;
	blur?: number;
	rotate?: number;
};

// Blur + scale + slide entrance, the base move of every text beat
export const Reveal: React.FC<{
	at: number;
	dur?: number;
	from?: From;
	springy?: boolean;
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({at, dur = 12, from = {}, springy = false, style, children}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {x = 0, y = 40, scale = 1.15, blur = 18, rotate = 0} = from;
	const p = springy
		? spring({frame: frame - at, fps, config: {damping: 13, stiffness: 170, mass: 0.9}})
		: tween(frame, at, at + dur, 0, 1);
	const fade = tween(frame, at, at + Math.max(4, dur * 0.5), 0, 1);
	return (
		<div
			style={{
				opacity: fade,
				filter: `blur(${interpolate(fade, [0, 1], [blur, 0])}px)`,
				translate: `${interpolate(p, [0, 1], [x, 0])}px ${interpolate(p, [0, 1], [y, 0])}px`,
				scale: interpolate(p, [0, 1], [scale, 1]),
				rotate: `${interpolate(p, [0, 1], [rotate, 0])}deg`,
				...style,
			}}
		>
			{children}
		</div>
	);
};

// Word-by-word kinetic line (RTL)
export const Words: React.FC<{
	text: string;
	at: number;
	stagger?: number;
	size: number;
	color: string;
	weight?: number;
	style?: React.CSSProperties;
	highlight?: Record<string, string>;
}> = ({text, at, stagger = 4, size, color, weight = 900, style, highlight = {}}) => {
	const words = text.split(' ');
	return (
		<div
			style={{
				direction: 'rtl',
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				columnGap: size * 0.28,
				fontFamily: arabic,
				fontWeight: weight,
				fontSize: size,
				lineHeight: 1.25,
				color,
				...style,
			}}
		>
			{words.map((w, i) => (
				<Reveal key={i} at={at + i * stagger} dur={10} from={{y: size * 0.35, scale: 1.25, blur: 16}}>
					<span style={{color: highlight[w] ?? color}}>{w}</span>
				</Reveal>
			))}
		</div>
	);
};

// Text that slides up out of an invisible mask
export const MaskUp: React.FC<{
	at: number;
	dur?: number;
	pad?: number;
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({at, dur = 14, pad = 70, style, children}) => {
	const frame = useCurrentFrame();
	const p = tween(frame, at, at + dur, 0, 1);
	return (
		<div style={{overflow: 'hidden', paddingTop: pad * 0.6, paddingBottom: pad, ...style}}>
			<div style={{translate: `0px ${(1 - p) * 110}%`, opacity: p > 0 ? 1 : 0}}>{children}</div>
		</div>
	);
};

// Decaying camera shake offset
export const useShake = (at: number, amp = 20, len = 14) => {
	const frame = useCurrentFrame();
	const t = frame - at;
	if (t < 0 || t > len) return {x: 0, y: 0};
	const decay = 1 - t / len;
	return {
		x: Math.sin(t * 2.7) * amp * decay,
		y: Math.cos(t * 3.3) * amp * 0.7 * decay,
	};
};

// Film grain over the whole frame
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
	const frame = useCurrentFrame();
	const step = Math.floor(frame / 2);
	const ox = Math.floor(Math.abs(Math.sin(step * 91.7)) * 600);
	const oy = Math.floor(Math.abs(Math.cos(step * 47.3)) * 600);
	return (
		<AbsoluteFill
			style={{
				backgroundImage: `url(${staticFile('noise.png')})`,
				backgroundPosition: `${ox}px ${oy}px`,
				backgroundSize: '600px 600px',
				mixBlendMode: 'overlay',
				opacity,
				pointerEvents: 'none',
			}}
		/>
	);
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
			pointerEvents: 'none',
		}}
	/>
);

// Slow continuous camera drift so no frame is ever static
export const Drift: React.FC<{
	from?: number;
	to?: number;
	rotate?: number;
	children: React.ReactNode;
	style?: React.CSSProperties;
}> = ({from = 1, to = 1.06, rotate = 0, children, style}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	return (
		<AbsoluteFill
			style={{
				scale: interpolate(frame, [0, durationInFrames], [from, to], clamp),
				rotate: `${interpolate(frame, [0, durationInFrames], [0, rotate], clamp)}deg`,
				...style,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

export const Center: React.FC<{
	y: number;
	children: React.ReactNode;
	style?: React.CSSProperties;
}> = ({y, children, style}) => (
	<div
		style={{
			position: 'absolute',
			left: 0,
			right: 0,
			top: y,
			display: 'flex',
			justifyContent: 'center',
			translate: '0 -50%',
			direction: 'rtl',
			...style,
		}}
	>
		{children}
	</div>
);
