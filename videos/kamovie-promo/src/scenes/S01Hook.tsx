import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Center, Reveal, Sfx, useShake, Vignette} from '../components/anim';
import {StopSign} from '../components/graphics';
import {arabic, C, tween, easeInOut} from '../theme';

// "لحظة!" slam, stop sign, then "اسمعني للآخر" with echoing repeats
export const S01Hook: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const slam = spring({frame, fps, config: {damping: 11, stiffness: 220, mass: 0.7}});
	const shake = useShake(5, 26, 16);
	const lift = tween(frame, 28, 40, 0, 1, easeInOut);
	const sign = spring({frame: frame - 8, fps, config: {damping: 9, stiffness: 160}});

	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(circle at 50% 42%, ${C.burgundyLight} 0%, ${C.burgundy} 45%, ${C.burgundyDeep} 100%)`,
				overflow: 'hidden',
			}}
		>
			<AbsoluteFill style={{translate: `${shake.x}px ${shake.y}px`}}>
				<div
					style={{
						position: 'absolute',
						right: 70,
						top: 260,
						scale: sign,
						rotate: `${(1 - sign) * -50 - 12 + Math.sin(frame / 14) * 3}deg`,
						translate: `0 ${lift * -40}px`,
					}}
				>
					<StopSign size={240} />
				</div>

				<Center y={860 - lift * 290}>
					<div
						style={{
							fontFamily: arabic,
							fontWeight: 900,
							fontSize: 300,
							color: C.cream,
							lineHeight: 1,
							scale: (2.4 - 1.4 * slam) * (1 - lift * 0.42),
							filter: `blur(${tween(frame, 0, 6, 24, 0)}px)`,
							opacity: tween(frame, 0, 3, 0, 1),
							textShadow: '0 20px 50px rgba(0,0,0,0.35)',
						}}
					>
						لحظة!
					</div>
				</Center>

				{/* Torn paper strip with "اسمعني" */}
				<Center y={860}>
					<Reveal at={32} dur={10} from={{x: 700, y: 0, scale: 1, blur: 30, rotate: 8}}>
						<div
							style={{
								background: C.cream,
								padding: '18px 70px 30px',
								rotate: '-3deg',
								boxShadow: '0 22px 40px rgba(0,0,0,0.35)',
								clipPath:
									'polygon(0% 6%, 8% 0%, 22% 5%, 37% 1%, 52% 6%, 66% 0%, 81% 5%, 100% 2%, 98% 94%, 85% 100%, 70% 95%, 55% 100%, 40% 94%, 24% 100%, 10% 95%, 1% 100%)',
							}}
						>
							<div style={{fontFamily: arabic, fontWeight: 900, fontSize: 150, color: C.ink, lineHeight: 1.2}}>
								اسمعني
							</div>
						</div>
					</Reveal>
				</Center>

				{/* "للآخر" echo trail */}
				{[0, 1, 2].map((i) => {
					const at = 44 + i * 5;
					const p = tween(frame, at, at + 10, 0, 1);
					return (
						<Center key={i} y={1090 + i * 175}>
							<div
								style={{
									fontFamily: arabic,
									fontWeight: 900,
									fontSize: 190,
									color: C.cream,
									lineHeight: 1,
									opacity: p * [1, 0.42, 0.16][i],
									translate: `0 ${(1 - p) * -175}px`,
									filter: `blur(${(1 - p) * 10 + i * 1.5}px)`,
								}}
							>
								للآخـر
							</div>
						</Center>
					);
				})}
			</AbsoluteFill>
			<Vignette strength={0.5} />

			<Sfx name="impact" at={3} volume={0.9} />
			<Sfx name="pop" at={9} volume={0.6} />
			<Sfx name="whip" at={31} volume={0.55} />
			<Sfx name="slap" at={38} volume={0.5} />
			<Sfx name="swoosh-soft" at={44} volume={0.5} />
		</AbsoluteFill>
	);
};
