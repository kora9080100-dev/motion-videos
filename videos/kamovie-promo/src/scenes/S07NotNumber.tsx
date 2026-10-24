import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Center, Drift, Sfx, Words} from '../components/anim';
import {Starburst} from '../components/graphics';
import {arabic, C, tween} from '../theme';

const ZIGZAG = 'M20 40 L80 10 L140 40 L200 10 L260 40 L320 10 L380 40 L440 10 L500 40 L560 10 L620 40 L680 10 L740 40';
const STRIKE = 'M10 60 C 80 20, 160 90, 250 30';

// "بس قوتي مو في العدد": the +50 tag gets scribbled out
export const S07NotNumber: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const burst = spring({frame: frame - 2, fps, config: {damping: 10, stiffness: 150}});
	const tag = spring({frame: frame - 4, fps, config: {damping: 12, stiffness: 160}});
	const zig = tween(frame, 24, 38, 0, 1);
	const strike = tween(frame, 34, 42, 0, 1);

	return (
		<AbsoluteFill style={{background: C.cream}}>
			<Drift from={1} to={1.06}>
				<div style={{position: 'absolute', right: 90, top: 400, scale: burst, rotate: `${frame * 1.2}deg`}}>
					<Starburst size={230} color={C.burgundy} />
				</div>

				<div
					style={{
						position: 'absolute',
						left: 120,
						top: 440,
						scale: tag,
						rotate: '8deg',
						background: '#FBF8F2',
						border: `5px solid ${C.ink}`,
						padding: '6px 34px 14px',
						boxShadow: '0 14px 26px rgba(0,0,0,0.15)',
					}}
				>
					<div style={{fontFamily: arabic, fontWeight: 900, fontSize: 96, color: C.ink, lineHeight: 1.1}}>+50</div>
					<svg width="270" height="100" viewBox="0 0 270 100" style={{position: 'absolute', left: -6, top: 18}}>
						<path d={STRIKE} fill="none" stroke={C.burgundy} strokeWidth="12" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - strike} />
					</svg>
				</div>

				<Center y={830}>
					<Words text="بس قوتي" at={4} stagger={5} size={160} color={C.ink} />
				</Center>
				<Center y={1050}>
					<Words text="مو في العدد" at={14} stagger={4} size={170} color={C.burgundy} />
				</Center>
				<Center y={1230}>
					<svg width="760" height="50" viewBox="0 0 760 50">
						<path d={ZIGZAG} fill="none" stroke={C.burgundy} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - zig} />
					</svg>
				</Center>
			</Drift>

			<Sfx name="pop" at={3} volume={0.5} />
			<Sfx name="swoosh-soft" at={13} volume={0.45} />
			<Sfx name="paper" at={24} volume={0.6} />
			<Sfx name="paper" at={34} volume={0.5} />
		</AbsoluteFill>
	);
};
