import React from 'react';
import {AbsoluteFill, Freeze, interpolate, OffthreadVideo, random, staticFile, useCurrentFrame} from 'remotion';
import {ARABIC_FONT, clamp, easeOut, FPS, GOLD_GRADIENT} from '../theme';

export type ClipName =
	| 'beans'
	| 'closeup'
	| 'cup'
	| 'dessert'
	| 'grinder'
	| 'matcha'
	| 'mural'
	| 'pour'
	| 'pour-ice'
	| 'pov'
	| 'team';

// [frames, playback rate] pieces, for speed ramps
export type Speed = [number, number][];

export const srcFrame = (start: number, f: number, speeds: Speed = [[9999, 1]]) => {
	let t = start * FPS;
	let left = Math.max(0, f);
	for (const [n, r] of speeds) {
		const k = Math.min(left, n);
		t += k * r;
		left -= k;
		if (left <= 0) break;
	}
	if (left > 0) t += left * speeds[speeds.length - 1][1];
	return Math.floor(t);
};

export const GRADE = 'contrast(1.12) saturate(1.1) brightness(1.02) sepia(0.08)';

// One clip, cover-cropped into the frame, with optional speed ramp and push-in.
export const Shot: React.FC<{
	clip: ClipName;
	start: number;
	f: number;
	dur: number;
	speeds?: Speed;
	pos?: string;
	zoom?: [number, number];
	origin?: string;
	filter?: string;
}> = ({clip, start, f, dur, speeds, pos = '50% 50%', zoom = [1.08, 1], origin = '50% 50%', filter = GRADE}) => {
	const scale = interpolate(f, [0, dur], zoom, clamp);
	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: origin, filter}}>
				<Freeze frame={srcFrame(start, f, speeds)}>
					<OffthreadVideo
						src={staticFile(`clips/${clip}.mp4`)}
						muted
						style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos}}
					/>
				</Freeze>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// Gold Arabic headline that blurs and scales into place.
export const GoldText: React.FC<{
	text: string;
	f: number;
	size?: number;
	top?: number;
	weight?: number;
	inDur?: number;
	outAt?: number;
	color?: string;
}> = ({text, f, size = 150, top = 1300, weight = 900, inDur = 8, outAt, color}) => {
	const t = easeOut(interpolate(f, [0, inDur], [0, 1], clamp));
	const out = outAt === undefined ? 0 : interpolate(f, [outAt, outAt + 5], [0, 1], clamp);
	const opacity = t * (1 - out);
	const scale = interpolate(t, [0, 1], [1.35, 1]) * (1 + out * 0.15);
	const blur = (1 - t) * 18 + out * 12;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top,
				textAlign: 'center',
				direction: 'rtl',
				fontFamily: ARABIC_FONT,
				fontWeight: weight,
				fontSize: size,
				lineHeight: 1.15,
				opacity,
				transform: `scale(${scale})`,
				filter: `blur(${blur}px) drop-shadow(0 6px 18px rgba(0,0,0,0.65))`,
			}}
		>
			<span
				style={
					color
						? {color}
						: {
								backgroundImage: GOLD_GRADIENT,
								WebkitBackgroundClip: 'text',
								backgroundClip: 'text',
								color: 'transparent',
								display: 'inline-block',
								padding: '0.05em 0.15em 0.2em',
							}
				}
			>
				{text}
			</span>
		</div>
	);
};

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.08}) => {
	const frame = useCurrentFrame();
	const seed = Math.floor(random(`grain-${frame}`) * 1000);
	return (
		<AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<svg width="100%" height="100%">
				<filter id="grain">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#grain)" />
			</svg>
		</AbsoluteFill>
	);
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse 75% 60% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`,
			pointerEvents: 'none',
		}}
	/>
);
