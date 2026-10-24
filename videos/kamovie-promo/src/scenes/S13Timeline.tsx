import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Center, Reveal, Sfx} from '../components/anim';
import {arabic, C, clamp, tween} from '../theme';

const PANEL = {x: 70, y: 1020, w: 940, h: 470};
const TRACK_X = 40;
const TRACK_W = PANEL.w - 80;
const KEYS = [0.08, 0.2, 0.31, 0.45, 0.58, 0.69, 0.82, 0.94];
const HEAD_START = 4;
const HEAD_END = 62;

const TRACKS: {label: string; clips: [number, number, string][]}[] = [
	{label: 'نص', clips: [[0, 0.3, C.cream], [0.34, 0.62, C.cream], [0.66, 1, C.cream]]},
	{label: 'حركة', clips: [[0, 0.46, C.burgundyLight], [0.5, 1, C.burgundyLight]]},
	{label: 'صوت', clips: [[0, 1, C.gold]]},
];

// Editing timeline: playhead sweeps, every keyframe lights up; "وكل ثانية… لها هدف"
export const S13Timeline: React.FC = () => {
	const frame = useCurrentFrame();
	const head = interpolate(frame, [HEAD_START, HEAD_END], [0, 1], clamp);

	return (
		<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #2A1B1D, #0E0909)'}}>
			<Center y={560}>
				<Reveal at={2} dur={12}>
					<div style={{fontFamily: arabic, fontWeight: 900, fontSize: 130, color: C.cream, lineHeight: 1.3}}>وكل ثانية…</div>
				</Reveal>
			</Center>

			<Center y={790}>
				<div style={{position: 'relative', padding: '0 46px 20px'}}>
					<div style={{position: 'absolute', inset: 0, background: C.burgundy, transformOrigin: 'right', scale: `${tween(frame, 26, 36, 0, 1)} 1`}} />
					<Reveal at={30} dur={10} springy from={{y: 0, scale: 1.4, blur: 14}}>
						<div style={{position: 'relative', fontFamily: arabic, fontWeight: 900, fontSize: 170, color: C.cream, lineHeight: 1.3, whiteSpace: 'nowrap'}}>
							لها هـدف
						</div>
					</Reveal>
				</div>
			</Center>

			<div
				style={{
					position: 'absolute',
					left: PANEL.x,
					top: PANEL.y,
					width: PANEL.w,
					height: PANEL.h,
					background: '#1E1617',
					borderRadius: 26,
					boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 0 2px #33282A',
					opacity: tween(frame, 0, 10, 0, 1),
					translate: `0 ${tween(frame, 0, 14, 80, 0)}px`,
					overflow: 'hidden',
				}}
			>
				{/* Ruler */}
				{Array.from({length: 21}, (_, i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: TRACK_X + (TRACK_W * i) / 20,
							top: 26,
							width: 2,
							height: i % 5 === 0 ? 30 : 16,
							background: 'rgba(238,230,216,0.35)',
						}}
					/>
				))}
				{[0, 1, 2, 3].map((s) => (
					<div key={s} style={{position: 'absolute', left: TRACK_X + (TRACK_W * s) / 4 + 8, top: 52, fontFamily: arabic, fontWeight: 700, fontSize: 22, color: 'rgba(238,230,216,0.5)'}}>
						00:0{s * 2}
					</div>
				))}

				{/* Keyframe lane */}
				<div style={{position: 'absolute', left: TRACK_X, top: 110, width: TRACK_W, height: 2, background: 'rgba(238,230,216,0.15)'}} />
				{KEYS.map((k, i) => {
					const hitFrame = HEAD_START + k * (HEAD_END - HEAD_START);
					const lit = frame >= hitFrame;
					const pop = lit ? tween(frame, hitFrame, hitFrame + 6, 1.8, 1) : 1;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: TRACK_X + k * TRACK_W - 14,
								top: 97,
								width: 28,
								height: 28,
								rotate: '45deg',
								scale: pop,
								background: lit ? C.goldLight : 'transparent',
								border: `3px solid ${lit ? C.goldLight : 'rgba(238,230,216,0.4)'}`,
								boxShadow: lit ? '0 0 18px rgba(235,208,138,0.8)' : 'none',
							}}
						/>
					);
				})}

				{/* Tracks */}
				{TRACKS.map((t, i) =>
					t.clips.map(([a, b, color], j) => (
						<div
							key={`${i}-${j}`}
							style={{
								position: 'absolute',
								left: TRACK_X + a * TRACK_W + 3,
								top: 160 + i * 96,
								width: (b - a) * TRACK_W - 6,
								height: 74,
								borderRadius: 12,
								background: color,
								opacity: i === 0 ? 0.9 : 1,
								transformOrigin: 'left',
								scale: `${tween(frame, 4 + i * 4 + j * 2, 16 + i * 4 + j * 2, 0, 1)} 1`,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'flex-end',
								paddingRight: 18,
								boxSizing: 'border-box',
								fontFamily: arabic,
								fontWeight: 700,
								fontSize: 28,
								color: i === 0 ? C.ink : C.cream,
								direction: 'rtl',
								overflow: 'hidden',
							}}
						>
							{j === 0 ? t.label : ''}
						</div>
					)),
				)}

				{/* Playhead */}
				<div style={{position: 'absolute', left: TRACK_X + head * TRACK_W - 2, top: 14, width: 4, height: PANEL.h - 28, background: '#FF4A5E'}}>
					<div style={{position: 'absolute', left: -14, top: 0, width: 32, height: 26, background: '#FF4A5E', clipPath: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)'}} />
				</div>
			</div>

			<Sfx name="swoosh-soft" at={0} volume={0.4} />
			{KEYS.map((k, i) => (
				<Sfx key={i} name="tick" at={Math.round(HEAD_START + k * (HEAD_END - HEAD_START))} volume={0.35} />
			))}
			<Sfx name="impact" at={30} volume={0.65} />
		</AbsoluteFill>
	);
};
