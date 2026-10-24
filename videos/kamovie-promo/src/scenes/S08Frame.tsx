import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Drift, Reveal, Sfx, Vignette} from '../components/anim';
import {GoldFrame, PlayIcon} from '../components/graphics';
import {arabic, C, tween} from '../theme';

const LINES = [
	{text: 'ولا إنّي', at: 14, size: 120},
	{text: 'أحرّك كم كلمة…', at: 24, size: 120},
	{text: 'وأوقّـف', at: 40, size: 170},
];

// Velvet curtain stage with a framed "artwork"; "ولا إني أحرّك كم كلمة… وأوقف"
export const S08Frame: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const drop = spring({frame, fps, config: {damping: 8, stiffness: 90, mass: 1}});
	const glow = 0.6 + Math.sin(frame / 6) * 0.15;

	return (
		<AbsoluteFill
			style={{
				background: `repeating-linear-gradient(90deg, #4E0912 0px, #8C1826 46px, #6A0F1A 70px, #4E0912 96px)`,
				overflow: 'hidden',
			}}
		>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,2,5,0.75) 0%, rgba(20,2,5,0) 30%, rgba(20,2,5,0) 55%, rgba(20,2,5,0.85) 100%)'}} />
			<AbsoluteFill style={{background: `radial-gradient(ellipse 55% 35% at 50% 34%, rgba(255,210,170,${0.22 * glow}), transparent 70%)`}} />

			<Drift from={1} to={1.07}>
				<div
					style={{
						position: 'absolute',
						left: 540 - 300,
						top: 230,
						transformOrigin: '50% -200px',
						translate: `0 ${interpolate(drop, [0, 1], [-1000, 0])}px`,
						rotate: `${interpolate(drop, [0, 1], [-8, 0]) + Math.sin(frame / 9) * 0.6}deg`,
					}}
				>
					<GoldFrame width={600} height={720}>
						<AbsoluteFill
							style={{
								background: 'radial-gradient(circle at 50% 45%, #5A0F18 0%, #240509 55%, #0B0203 100%)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<div style={{filter: `drop-shadow(0 0 ${30 * glow}px rgba(238,120,100,0.8))`, scale: 1 + Math.sin(frame / 7) * 0.03}}>
								<PlayIcon size={260} color={C.cream} />
							</div>
						</AbsoluteFill>
					</GoldFrame>
				</div>

				<div style={{position: 'absolute', right: 90, top: 1060, direction: 'rtl', display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
					{LINES.map((l, i) => (
						<Reveal key={i} at={l.at} dur={11} from={{x: -120, y: 0, scale: 1.05, blur: 22}}>
							<div style={{fontFamily: arabic, fontWeight: 900, fontSize: l.size, color: C.cream, lineHeight: 1.3}}>{l.text}</div>
						</Reveal>
					))}
					<div style={{height: 14, width: 420, background: C.cream, marginTop: 6, transformOrigin: 'right', scale: `${tween(frame, 48, 58, 0, 1)} 1`}} />
				</div>
			</Drift>
			<Vignette strength={0.5} />

			<Sfx name="swoosh-soft" at={0} volume={0.5} />
			<Sfx name="thud" at={9} volume={0.5} />
			<Sfx name="whip" at={14} volume={0.35} />
			<Sfx name="whip" at={24} volume={0.35} />
			<Sfx name="impact" at={40} volume={0.6} />
		</AbsoluteFill>
	);
};
