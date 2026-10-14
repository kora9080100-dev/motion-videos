import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FlagPole} from '../components/Flag';
import {Falcon} from '../components/Silhouettes';
import {clamp, easeIn, easeInOut, T} from '../theme';

// Golden-hour sky, the flag high on its pole, and a falcon climbing past the sun.
// The falcon finally sweeps over the lens and wipes to the next shot.
export const FalconFlag: React.FC = () => {
	const f = useCurrentFrame();
	const dur = T.prep - T.falcon;
	const climb = easeInOut(interpolate(f, [0, dur - 7], [0, 1], clamp));
	const pass = easeIn(interpolate(f, [dur - 7, dur], [0, 1], clamp));
	const x = interpolate(climb, [0, 1], [170, 760]) + pass * -260;
	const y = interpolate(climb, [0, 1], [1620, 700]) + pass * -300;
	const size = interpolate(climb, [0, 1], [300, 520]) * (1 + pass * 9);
	const flap = Math.sin(f * 0.85);
	const tilt = interpolate(f, [0, dur], [-3, 2], clamp);
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `rotate(${tilt}deg) scale(1.08)`}}>
				<AbsoluteFill
					style={{
						background: 'linear-gradient(180deg, #24345f 0%, #4f5583 26%, #9a7088 50%, #e39a62 74%, #f8cf8c 100%)',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						left: 640 - 700,
						top: 1180 - 700,
						width: 1400,
						height: 1400,
						borderRadius: '50%',
						background: 'radial-gradient(circle, rgba(255,240,200,1) 0%, rgba(255,214,140,0.7) 9%, rgba(255,170,100,0.25) 30%, rgba(255,150,100,0) 60%)',
					}}
				/>
				<div style={{position: 'absolute', left: 250, top: 330}}>
					<FlagPole width={760} poleHeight={1800} speed={0.24} amp={0.06} />
				</div>
				<div
					style={{
						position: 'absolute',
						left: x - size / 2,
						top: y - (size * 0.6) / 2,
						transform: `rotate(${interpolate(climb, [0, 1], [28, 14])}deg)`,
					}}
				>
					<Falcon size={size} flap={flap} />
				</div>
			</AbsoluteFill>
			{/* lens flare dots along the sun axis */}
			{[0.35, 0.6, 0.85].map((k, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: 640 + (540 - 640) * k * 2 - 40,
						top: 1180 + (960 - 1180) * k * 2 - 40,
						width: 80 + i * 40,
						height: 80 + i * 40,
						borderRadius: '50%',
						background: 'rgba(255,220,170,0.12)',
						filter: 'blur(4px)',
					}}
				/>
			))}
		</AbsoluteFill>
	);
};
