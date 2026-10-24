import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Sfx, useShake} from '../components/anim';
import {arabic, C, clamp, easeIn, easeOut, tween} from '../theme';

const PW = 760;
const PH = 1000;
const HIT = 30;

const PaperFace: React.FC<{frame: number}> = ({frame}) => (
	<div style={{position: 'absolute', inset: 0, background: '#F4EEE3', direction: 'rtl'}}>
		<div style={{position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center', fontFamily: arabic, fontWeight: 900, fontSize: 170, color: C.ink, lineHeight: 1.1}}>
			أفهم
		</div>
		{/* Target */}
		<div style={{position: 'absolute', left: PW / 2 - 170, top: 330, width: 340, height: 340}}>
			{[170, 128, 86, 44].map((r, i) => (
				<div
					key={r}
					style={{
						position: 'absolute',
						left: 170 - r,
						top: 170 - r,
						width: r * 2,
						height: r * 2,
						borderRadius: '50%',
						background: i % 2 === 0 ? C.burgundy : '#F4EEE3',
						scale: frame >= HIT && frame < HIT + 6 ? 1 + (i + 1) * 0.015 : 1,
					}}
				/>
			))}
		</div>
		<div style={{position: 'absolute', bottom: 90, left: 0, right: 0, textAlign: 'center', fontFamily: arabic, fontWeight: 900, fontSize: 190, color: C.burgundy, lineHeight: 1.1}}>
			هدفـك
		</div>
	</div>
);

// Folded sheet opens on "أفهم هدفك", an arrow lands in the bullseye
export const S09Goal: React.FC = () => {
	const frame = useCurrentFrame();
	const unfold = tween(frame, 2, 18, 0, 1, easeOut);
	const shake = useShake(HIT, 12, 10);
	const fly = interpolate(frame, [HIT - 8, HIT], [0, 1], {...clamp, easing: easeIn});
	const wobble = frame >= HIT ? Math.sin((frame - HIT) * 1.6) * 6 * Math.exp(-(frame - HIT) / 6) : 0;
	// Arrow tip lands on the target center (paper coords → screen coords)
	const tipX = 540;
	const tipY = 960 - PH / 2 + 330 + 170;

	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, ${C.burgundy}, ${C.burgundyDark})`, overflow: 'hidden'}}>
			<AbsoluteFill style={{translate: `${shake.x}px ${shake.y}px`}}>
				<div
					style={{
						position: 'absolute',
						left: 540 - PW / 2,
						top: 960 - PH / 2,
						width: PW,
						height: PH,
						rotate: `${tween(frame, 0, 20, 6, -4)}deg`,
						scale: tween(frame, 0, 20, 0.9, 1),
						perspective: 2200,
						filter: 'drop-shadow(0 40px 50px rgba(0,0,0,0.45))',
					}}
				>
					{/* Bottom half stays flat */}
					<div style={{position: 'absolute', left: 0, top: PH / 2, width: PW, height: PH / 2, overflow: 'hidden'}}>
						<div style={{position: 'absolute', left: 0, top: -PH / 2, width: PW, height: PH}}>
							<PaperFace frame={frame} />
						</div>
					</div>
					{/* Top half flips open around the crease */}
					<div
						style={{
							position: 'absolute',
							left: 0,
							top: 0,
							width: PW,
							height: PH / 2,
							transformOrigin: '50% 100%',
							transform: `rotateX(${interpolate(unfold, [0, 1], [-178, 0])}deg)`,
							transformStyle: 'preserve-3d',
						}}
					>
						<div style={{position: 'absolute', inset: 0, overflow: 'hidden', backfaceVisibility: 'hidden'}}>
							<div style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH}}>
								<PaperFace frame={frame} />
							</div>
							<div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,${0.25 * (1 - unfold)}))`}} />
						</div>
						<div style={{position: 'absolute', inset: 0, background: C.creamDark, transform: 'rotateX(180deg)', backfaceVisibility: 'hidden'}} />
					</div>
					<div style={{position: 'absolute', left: 0, right: 0, top: PH / 2 - 1, height: 2, background: `rgba(0,0,0,${0.12 + 0.2 * (1 - unfold)})`}} />
				</div>

				{/* Arrow */}
				<div
					style={{
						position: 'absolute',
						left: tipX,
						top: tipY,
						width: 0,
						height: 0,
						translate: `${interpolate(fly, [0, 1], [900, 0])}px ${interpolate(fly, [0, 1], [700, 0])}px`,
						rotate: `${38 + wobble}deg`,
						opacity: frame >= HIT - 8 ? 1 : 0,
					}}
				>
					<svg width="520" height="60" viewBox="0 0 520 60" style={{position: 'absolute', left: 0, top: -30}}>
						<rect x="20" y="26" width="430" height="8" rx="4" fill={C.ink} />
						<path d="M0 30 L44 10 L36 30 L44 50 Z" fill={C.ink} />
						<path d="M420 30 L470 4 L510 4 L470 30 L510 56 L470 56 Z" fill={C.gold} />
					</svg>
				</div>
			</AbsoluteFill>

			<Sfx name="paper" at={1} volume={0.7} />
			<Sfx name="whoosh" at={HIT - 9} volume={0.55} />
			<Sfx name="thud" at={HIT} volume={0.9} />
		</AbsoluteFill>
	);
};
