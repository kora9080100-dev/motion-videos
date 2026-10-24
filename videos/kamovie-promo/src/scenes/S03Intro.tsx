import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Center, MaskUp, Sfx, Vignette} from '../components/anim';
import {LogoMark, Wordmark} from '../components/graphics';
import {arabic, C, clamp, easeInOut, tween} from '../theme';

// "أنا" → poster with the logo mark → "كموفي" / KAMOVIE
export const S03Intro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const up = tween(frame, 20, 34, 0, 1, easeInOut);
	const poster = spring({frame: frame - 24, fps, config: {damping: 12, stiffness: 120, mass: 0.9}});
	const rays = interpolate(frame, [24, 40], [0, 1], clamp);

	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(circle at 50% 45%, ${C.burgundyLight} 0%, ${C.burgundy} 50%, ${C.burgundyDeep} 100%)`,
				overflow: 'hidden',
			}}
		>
			{/* Light rays behind the poster */}
			<div
				style={{
					position: 'absolute',
					left: 540 - 1100,
					top: 860 - 1100,
					width: 2200,
					height: 2200,
					borderRadius: '50%',
					background:
						'repeating-conic-gradient(from 0deg, rgba(238,230,216,0.10) 0deg 6deg, rgba(238,230,216,0) 6deg 18deg)',
					rotate: `${frame * 0.35}deg`,
					opacity: rays,
					maskImage: 'radial-gradient(circle, black 0%, transparent 60%)',
				}}
			/>

			<Center y={interpolate(up, [0, 1], [900, 290])}>
				<div
					style={{
						fontFamily: arabic,
						fontWeight: 900,
						fontSize: 360,
						lineHeight: 1,
						color: C.cream,
						scale: interpolate(up, [0, 1], [1, 0.42]) * tween(frame, 0, 12, 1.35, 1),
						filter: `blur(${tween(frame, 0, 10, 22, 0)}px)`,
						opacity: tween(frame, 0, 6, 0, 1),
					}}
				>
					أنا
				</div>
			</Center>

			<Center y={830}>
				<div
					style={{
						width: 500,
						height: 620,
						padding: 16,
						background: '#F3EEE4',
						boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
						scale: interpolate(poster, [0, 1], [0.5, 1]),
						rotate: `${interpolate(poster, [0, 1], [14, -4]) + Math.sin(frame / 18) * 1.2}deg`,
						translate: `0 ${interpolate(poster, [0, 1], [500, 0])}px`,
						opacity: frame >= 24 ? 1 : 0,
					}}
				>
					<div
						style={{
							width: '100%',
							height: '100%',
							background: `radial-gradient(circle at 30% 85%, #FF7A45 0%, #C6283A 22%, #2A0609 62%, #0D0204 100%)`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
							overflow: 'hidden',
						}}
					>
						<div
							style={{
								position: 'absolute',
								inset: 0,
								background: `radial-gradient(circle at ${50 + Math.sin(frame / 10) * 18}% ${40 + Math.cos(frame / 13) * 12}%, rgba(255,160,120,0.35), transparent 45%)`,
							}}
						/>
						<LogoMark size={250} style={{rotate: `${tween(frame, 26, 50, -90, 0)}deg`, scale: tween(frame, 26, 46, 0.4, 1)}} />
					</div>
				</div>
			</Center>

			<Center y={1330}>
				<MaskUp at={40} dur={14}>
					<div style={{fontFamily: arabic, fontWeight: 900, fontSize: 230, lineHeight: 1.15, color: C.cream}}>كموفي</div>
				</MaskUp>
			</Center>

			<Center y={1520}>
				<div
					style={{
						opacity: tween(frame, 52, 64, 0, 0.85),
						letterSpacing: 0,
						scale: tween(frame, 52, 70, 1.25, 1),
						filter: `blur(${tween(frame, 52, 64, 8, 0)}px)`,
					}}
				>
					<Wordmark size={58} color={C.cream} spacing={0.4} />
				</div>
			</Center>

			<Vignette strength={0.45} />
			<Sfx name="impact" at={1} volume={0.45} />
			<Sfx name="swoosh-soft" at={22} volume={0.55} />
			<Sfx name="pop" at={30} volume={0.5} />
			<Sfx name="whoosh" at={39} volume={0.5} />
			<Sfx name="tick" at={53} volume={0.4} />
		</AbsoluteFill>
	);
};
