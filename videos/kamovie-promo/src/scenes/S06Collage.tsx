import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Drift, MaskUp, Sfx, Vignette} from '../components/anim';
import {WindowFrame} from '../components/graphics';
import {Thumb, ThumbKind} from '../components/thumbs';
import {arabic, C} from '../theme';

type Win = {kind: ThumbKind; x: number; y: number; w: number; h: number; r: number; at: number};

// Final positions (center points) of the portfolio windows
const WINDOWS: Win[] = [
	{kind: 'build', x: 250, y: 330, w: 460, h: 360, r: -5, at: 0},
	{kind: 'store', x: 820, y: 300, w: 420, h: 380, r: 4, at: 3},
	{kind: 'app', x: 160, y: 900, w: 330, h: 470, r: -3, at: 6},
	{kind: 'content', x: 930, y: 860, w: 360, h: 420, r: 5, at: 9},
	{kind: 'food', x: 280, y: 1530, w: 470, h: 380, r: 3, at: 12},
	{kind: 'perfume', x: 840, y: 1500, w: 400, h: 420, r: -4, at: 15},
	{kind: 'type', x: 560, y: 210, w: 380, h: 280, r: 2, at: 18},
	{kind: 'coffee', x: 560, y: 1700, w: 380, h: 300, r: -2, at: 21},
	{kind: 'chart', x: 110, y: 1250, w: 300, h: 300, r: 6, at: 24},
	{kind: 'brand', x: 990, y: 1190, w: 300, h: 320, r: -6, at: 27},
];

const LINES: {text: string; color: string; size: number}[] = [
	{text: 'لمتـاجـر', color: C.burgundy, size: 118},
	{text: 'تطبيقات', color: C.ink, size: 104},
	{text: 'بـرانـدات', color: C.burgundy, size: 118},
	{text: 'ومحتـوى', color: C.ink, size: 104},
];

// Portfolio windows pile up around a cream card listing the kinds of work
export const S06Collage: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const card = spring({frame: frame - 8, fps, config: {damping: 14, stiffness: 140}});

	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, ${C.burgundy}, ${C.burgundyDark})`, overflow: 'hidden'}}>
			<Drift from={1.04} to={1.12} rotate={-1.5}>
				{WINDOWS.map((w, i) => {
					const p = spring({frame: frame - w.at, fps, config: {damping: 15, stiffness: 120, mass: 0.8}});
					// Fly in from far outside along the line from the center
					const dx = w.x - 540;
					const dy = w.y - 960;
					const len = Math.hypot(dx, dy) || 1;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: w.x - w.w / 2,
								top: w.y - w.h / 2,
								translate: `${interpolate(p, [0, 1], [(dx / len) * 1300, 0])}px ${interpolate(p, [0, 1], [(dy / len) * 1300, 0])}px`,
								rotate: `${interpolate(p, [0, 1], [w.r * 6, w.r])}deg`,
								opacity: frame >= w.at ? 1 : 0,
							}}
						>
							<WindowFrame width={w.w} height={w.h}>
								<Thumb kind={w.kind} scale={w.w / 400} />
							</WindowFrame>
						</div>
					);
				})}

				<div
					style={{
						position: 'absolute',
						left: 540 - 300,
						top: 960 - 380,
						width: 600,
						height: 760,
						background: C.cream,
						boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
						scale: interpolate(card, [0, 1], [0.6, 1]),
						rotate: `${interpolate(card, [0, 1], [10, -2])}deg`,
						opacity: frame >= 8 ? 1 : 0,
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'flex-end',
						padding: '0 60px',
						boxSizing: 'border-box',
						direction: 'rtl',
					}}
				>
					{LINES.map((l, i) => (
						<MaskUp key={i} at={16 + i * 7} dur={10} pad={40} style={{marginTop: -56, width: '100%'}}>
							<div style={{fontFamily: arabic, fontWeight: 900, fontSize: l.size, color: l.color, lineHeight: 1.15, textAlign: 'right'}}>
								{l.text}
							</div>
						</MaskUp>
					))}
				</div>
			</Drift>
			<Vignette strength={0.4} />

			{[0, 9, 18, 27].map((at) => (
				<Sfx key={at} name="whip" at={at} volume={0.32} />
			))}
			<Sfx name="paper" at={8} volume={0.5} />
			{LINES.map((_, i) => (
				<Sfx key={i} name="pop" at={16 + i * 7} volume={0.4} />
			))}
		</AbsoluteFill>
	);
};
