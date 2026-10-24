import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Reveal, Sfx, useShake} from '../components/anim';
import {Thumb, ThumbKind} from '../components/thumbs';
import {MotionBlurDefs} from '../transitions';
import {arabic, C, clamp} from '../theme';

const PHONE = {x: 70, y: 470, w: 470, h: 960};
const BEZEL = 16;
const SW = PHONE.w - BEZEL * 2;
const SH = PHONE.h - BEZEL * 2;
const FEED: ThumbKind[] = ['brand', 'chart', 'store', 'coffee', 'build', 'food', 'app', 'kamovie'];
const STOP = 40;

const scrollAt = (f: number) =>
	interpolate(f, [4, STOP], [0, (FEED.length - 1) * SH], {...clamp, easing: Easing.bezier(0.55, 0, 0.1, 1)});

const blurLevels = [0, 12, 24, 40, 60];

// Thumb flicks through a feed until it lands on a KAMOVIE video
export const S12Feed: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const offset = scrollAt(frame);
	const speed = Math.abs(offset - scrollAt(frame - 1));
	const level = blurLevels.reduce((best, b) => (speed * 0.12 >= b ? b : best), 0);
	const settle = spring({frame: frame - STOP, fps, config: {damping: 9, stiffness: 200}});
	const bounce = frame >= STOP ? (1 - settle) * -40 : 0;
	const shake = useShake(STOP, 8, 8);
	const heart = spring({frame: frame - (STOP + 6), fps, config: {damping: 8, stiffness: 180}});
	const swipe = (frame % 14) / 14;
	const swiping = frame >= 2 && frame < STOP - 8;

	return (
		<AbsoluteFill style={{background: C.cream, overflow: 'hidden'}}>
			<MotionBlurDefs />
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 330, background: C.burgundy}} />
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 330, background: C.burgundy}} />

			<div
				style={{
					position: 'absolute',
					left: PHONE.x,
					top: PHONE.y,
					width: PHONE.w,
					height: PHONE.h,
					borderRadius: 70,
					background: '#0F0F10',
					padding: BEZEL,
					boxSizing: 'border-box',
					boxShadow: '0 50px 80px rgba(60,10,15,0.35), inset 0 0 0 3px #2A2A2C',
					rotate: '-4deg',
					translate: `${shake.x}px ${shake.y}px`,
				}}
			>
				<div style={{position: 'relative', width: SW, height: SH, borderRadius: 56, overflow: 'hidden', background: '#000'}}>
					<div
						style={{
							position: 'absolute',
							left: 0,
							top: 0,
							width: SW,
							translate: `0 ${-offset - bounce}px`,
							filter: level ? `url(#mby-${level})` : undefined,
						}}
					>
						{FEED.map((k, i) => (
							<div key={i} style={{position: 'relative', width: SW, height: SH}}>
								<Thumb kind={k} scale={1.15} />
								{/* Feed chrome: caption bars and action buttons */}
								<div style={{position: 'absolute', right: 28, bottom: 60, width: 260, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end'}}>
									<div style={{width: 200, height: 18, borderRadius: 9, background: 'rgba(255,255,255,0.85)'}} />
									<div style={{width: 140, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.55)'}} />
								</div>
								<div style={{position: 'absolute', left: 22, bottom: 70, display: 'flex', flexDirection: 'column', gap: 22}}>
									{[0, 1, 2].map((j) => (
										<div key={j} style={{width: 54, height: 54, borderRadius: 27, background: 'rgba(255,255,255,0.3)'}} />
									))}
								</div>
							</div>
						))}
					</div>

					{/* Heart pop on the KAMOVIE video */}
					<div
						style={{
							position: 'absolute',
							left: 22 + 27 - 60,
							bottom: 70 + 2 * 76 + 27 - 60,
							width: 120,
							height: 120,
							scale: heart,
							opacity: frame >= STOP + 6 ? 1 : 0,
						}}
					>
						<svg width="120" height="120" viewBox="0 0 24 24">
							<path d="M12 21 C 5 15, 2 12, 2 8.5 A 4.5 4.5 0 0 1 12 6 A 4.5 4.5 0 0 1 22 8.5 C 22 12, 19 15, 12 21 Z" fill="#E8344A" stroke="#fff" strokeWidth="1.2" />
						</svg>
					</div>

					{/* Finger swipe indicator */}
					<div
						style={{
							position: 'absolute',
							left: SW / 2 - 50,
							top: interpolate(swipe, [0, 1], [SH * 0.75, SH * 0.25]),
							width: 100,
							height: 100,
							borderRadius: 50,
							background: 'rgba(255,255,255,0.45)',
							border: '4px solid rgba(255,255,255,0.8)',
							opacity: swiping ? Math.sin(swipe * Math.PI) : 0,
						}}
					/>
				</div>
			</div>

			<div style={{position: 'absolute', right: 70, top: 640, direction: 'rtl', display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
				<Reveal at={4} dur={12}>
					<div style={{fontFamily: arabic, fontWeight: 900, fontSize: 96, color: C.ink, lineHeight: 1.3}}>أعرف وش</div>
				</Reveal>
				<Reveal at={STOP} dur={10} springy from={{y: 0, scale: 1.6, blur: 16}}>
					<div style={{fontFamily: arabic, fontWeight: 900, fontSize: 140, color: C.burgundy, lineHeight: 1.3}}>يوقّـف</div>
				</Reveal>
				<Reveal at={STOP + 6} dur={10} springy from={{y: 0, scale: 1.6, blur: 16}}>
					<div style={{fontFamily: arabic, fontWeight: 900, fontSize: 140, color: C.burgundy, lineHeight: 1.3}}>السحبة</div>
				</Reveal>
			</div>

			<Sfx name="swoosh-soft" at={0} volume={0.4} />
			<Sfx name="whip" at={8} volume={0.4} />
			<Sfx name="whip" at={20} volume={0.4} />
			<Sfx name="impact" at={STOP} volume={0.6} />
			<Sfx name="pop" at={STOP + 6} volume={0.6} />
		</AbsoluteFill>
	);
};
