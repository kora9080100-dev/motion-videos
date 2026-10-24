import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Center, Reveal, Sfx, useShake} from '../components/anim';
import {Thumb, ThumbKind} from '../components/thumbs';
import {arabic, C, clamp, rnd, tween} from '../theme';

const KINDS: ThumbKind[] = ['content', 'store', 'app', 'brand', 'food', 'type', 'coffee', 'chart', 'perfume', 'build'];
const COLS = 4;
const ROWS = 9;
const CELL_W = 250;
const CELL_H = 230;
const GAP = 16;
const COUNT_START = 10;
const COUNT_END = 48;
const TARGET = 50;

// Wall of past videos lighting up while the counter runs to 50
export const S05Counter: React.FC = () => {
	const frame = useCurrentFrame();
	const count = Math.round(interpolate(frame, [COUNT_START, COUNT_END], [0, TARGET], {...clamp, easing: Easing.out(Easing.quad)}));
	const punch = tween(frame, COUNT_END, COUNT_END + 10, 1.18, 1);
	const shake = useShake(COUNT_END, 14, 10);
	const tiles = COLS * ROWS;
	const gridW = COLS * CELL_W + (COLS - 1) * GAP;

	return (
		<AbsoluteFill style={{background: '#120809', overflow: 'hidden'}}>
			<AbsoluteFill style={{translate: `${shake.x}px ${shake.y}px`}}>
				<div
					style={{
						position: 'absolute',
						left: (1080 - gridW) / 2,
						top: -120 - frame * 1.4,
						width: gridW,
						display: 'grid',
						gridTemplateColumns: `repeat(${COLS}, ${CELL_W}px)`,
						gap: GAP,
					}}
				>
					{Array.from({length: tiles}, (_, i) => {
						const order = Math.floor(rnd(i + 3) * tiles);
						const lit = count >= ((order + 1) / tiles) * TARGET;
						return (
							<div
								key={i}
								style={{
									position: 'relative',
									height: CELL_H,
									borderRadius: 14,
									overflow: 'hidden',
									filter: lit ? 'blur(1px) saturate(1)' : 'blur(5px) saturate(0.2)',
									opacity: lit ? 0.75 : 0.28,
									outline: lit ? `3px solid ${C.burgundyLight}` : 'none',
								}}
							>
								<Thumb kind={KINDS[i % KINDS.length]} scale={0.62} />
							</div>
						);
					})}
				</div>
			</AbsoluteFill>

			<AbsoluteFill
				style={{
					background:
						'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(18,8,9,0.92) 0%, rgba(18,8,9,0.6) 60%, rgba(18,8,9,0.35) 100%)',
				}}
			/>

			<Center y={640}>
				<Reveal at={0} dur={12}>
					<div style={{fontFamily: arabic, fontWeight: 900, fontSize: 130, color: C.cream, lineHeight: 1}}>أكثر من</div>
				</Reveal>
			</Center>

			<Center y={930}>
				<div
					style={{
						fontFamily: arabic,
						fontWeight: 900,
						fontSize: 440,
						lineHeight: 1,
						color: C.cream,
						fontVariantNumeric: 'tabular-nums',
						scale: punch,
						opacity: tween(frame, COUNT_START - 4, COUNT_START + 2, 0, 1),
						textShadow: `0 0 ${frame >= COUNT_END ? 60 : 0}px rgba(156,30,46,0.9)`,
					}}
				>
					{count}
				</div>
			</Center>

			<Center y={1230}>
				<div style={{position: 'relative', padding: '6px 40px 22px'}}>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background: C.burgundy,
							transformOrigin: 'right center',
							scale: `${tween(frame, 52, 62, 0, 1)} 1`,
						}}
					/>
					<Reveal at={55} dur={10} from={{y: 30, blur: 12, scale: 1.1}}>
						<div style={{position: 'relative', fontFamily: arabic, fontWeight: 900, fontSize: 96, color: C.cream, lineHeight: 1.3, direction: 'rtl', whiteSpace: 'nowrap'}}>
							فيديو موشن جرافيك
						</div>
					</Reveal>
				</div>
			</Center>

			{Array.from({length: 12}, (_, i) => (
				<Sfx key={i} name="tick" at={COUNT_START + Math.round(Math.pow(i / 12, 1.8) * (COUNT_END - COUNT_START))} volume={0.35} />
			))}
			<Sfx name="impact" at={COUNT_END} volume={0.8} />
			<Sfx name="whip" at={52} volume={0.5} />
		</AbsoluteFill>
	);
};
