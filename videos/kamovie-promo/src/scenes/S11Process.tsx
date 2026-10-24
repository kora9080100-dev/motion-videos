import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Drift, MaskUp, Sfx} from '../components/anim';
import {BulbIcon, MotionIcon, PatternTile, PenIcon, PlaneIcon} from '../components/graphics';
import {arabic, C, tween} from '../theme';

type Step = {text: string; Icon: React.FC<{size: number; color: string}>; panel: string; accent: string};

const STEPS: Step[] = [
	{text: 'من الفكـرة', Icon: BulbIcon, panel: C.mustard, accent: C.teal},
	{text: 'للتصميـم', Icon: PenIcon, panel: C.teal, accent: C.mustard},
	{text: 'للحركـة', Icon: MotionIcon, panel: C.burgundy, accent: C.mustard},
	{text: 'للتسليـم', Icon: PlaneIcon, panel: C.navy, accent: C.burgundyLight},
];

const ROW_Y = 300;
const ROW_H = 330;
const STAGGER = 18;
const TILE_W = 300;
const TILE_H = 214;

// Four steps of the process, zigzagging down with patterned icon tiles
export const S11Process: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const path = tween(frame, 8, 8 + STAGGER * 3 + 6, 0, 1);

	return (
		<AbsoluteFill style={{background: C.cream}}>
			<Drift from={1} to={1.05}>
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					<path
						d={`M 280 ${ROW_Y + 120} C 280 ${ROW_Y + 260}, 800 ${ROW_Y + 200}, 800 ${ROW_Y + ROW_H + 120} C 800 ${ROW_Y + ROW_H + 260}, 280 ${ROW_Y + ROW_H + 200}, 280 ${ROW_Y + ROW_H * 2 + 120} C 280 ${ROW_Y + ROW_H * 2 + 260}, 800 ${ROW_Y + ROW_H * 2 + 200}, 800 ${ROW_Y + ROW_H * 3 + 120}`}
						fill="none"
						stroke={C.burgundy}
						strokeOpacity={0.35}
						strokeWidth={6}
						strokeDasharray="4 18"
						strokeLinecap="round"
						style={{clipPath: `inset(0 0 ${(1 - path) * 100}% 0)`}}
					/>
				</svg>

				{STEPS.map((s, i) => {
					const at = 4 + i * STAGGER;
					const p = spring({frame: frame - at, fps, config: {damping: 11, stiffness: 170, mass: 0.8}});
					const tileLeft = i % 2 === 0;
					const y = ROW_Y + i * ROW_H;
					return (
						<React.Fragment key={i}>
							<div
								style={{
									position: 'absolute',
									top: y,
									left: tileLeft ? 90 : 1080 - 90 - TILE_W,
									scale: p,
									rotate: `${(tileLeft ? -1 : 1) * (interpolate(p, [0, 1], [25, 3]))}deg`,
								}}
							>
								<PatternTile id={`tile-${i}`} width={TILE_W} height={TILE_H} panel={s.panel} border={C.burgundyDeep} accent={s.accent}>
									<s.Icon size={110} color={C.cream} />
								</PatternTile>
							</div>
							<div
								style={{
									position: 'absolute',
									top: y + TILE_H / 2,
									translate: '0 -50%',
									...(tileLeft ? {right: 70} : {left: 70}),
									direction: 'rtl',
									textAlign: tileLeft ? 'right' : 'left',
								}}
							>
								<MaskUp at={at + 4} dur={12} pad={50}>
									<div style={{fontFamily: arabic, fontWeight: 900, fontSize: 108, color: i === 0 ? C.ink : C.burgundy, lineHeight: 1.15, whiteSpace: 'nowrap'}}>
										{s.text}
									</div>
								</MaskUp>
							</div>
						</React.Fragment>
					);
				})}
			</Drift>

			<Sfx name="swoosh-soft" at={0} volume={0.4} />
			{STEPS.map((_, i) => (
				<Sfx key={i} name="pop" at={4 + i * STAGGER} volume={0.55} />
			))}
		</AbsoluteFill>
	);
};
