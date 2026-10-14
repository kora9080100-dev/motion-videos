import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {BARISTA_PATH} from '../baristaPath';
import {GoldText} from '../components/Common';
import {clamp, easeIn, easeInOut, T} from '../theme';

const CX = 540;
const CY = 900;

// Top-down cup on a dark counter; the barista from the logo is drawn into the crema
// like latte art. Ends by diving into the coffee.
export const Opening: React.FC = () => {
	const f = useCurrentFrame();
	const dur = T.barista;
	const draw = easeInOut(interpolate(f, [5, 30], [0, 1], clamp));
	const dive = easeIn(interpolate(f, [dur - 8, dur], [0, 1], clamp));
	const kick = Math.max(0, 1 - Math.abs(f - 6) / 5) * 0.03 + Math.max(0, 1 - Math.abs(f - 24) / 5) * 0.025;
	const scale = interpolate(f, [0, dur - 8], [1, 1.12], clamp) * (1 + kick) * (1 + dive * 5);
	const rot = interpolate(f, [0, dur], [-9, 3], clamp);
	const artW = 380;
	const artH = (artW * 1552) / 1232;
	return (
		<AbsoluteFill style={{background: '#0b0604', overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${scale}) rotate(${rot}deg)`, transformOrigin: `${CX}px ${CY}px`, filter: dive > 0.05 ? `blur(${dive * 14}px)` : undefined}}>
				<svg width="1080" height="1920" viewBox="0 0 1080 1920">
					<defs>
						<radialGradient id="counter" cx="0.5" cy="0.47" r="0.75">
							<stop offset="0" stopColor="#3b2417" />
							<stop offset="0.55" stopColor="#1c110b" />
							<stop offset="1" stopColor="#070403" />
						</radialGradient>
						<filter id="wood">
							<feTurbulence type="fractalNoise" baseFrequency="0.003 0.09" numOctaves="3" seed="4" />
							<feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.27  0 0 0 0 0.15  0 0 0 0.55 0" />
						</filter>
						<radialGradient id="rim" cx="0.5" cy="0.5" r="0.5">
							<stop offset="0.88" stopColor="#f6f1e8" />
							<stop offset="0.96" stopColor="#d9d1c3" />
							<stop offset="1" stopColor="#a69c8c" />
						</radialGradient>
						<radialGradient id="crema" cx="0.48" cy="0.46" r="0.55">
							<stop offset="0" stopColor="#c99257" />
							<stop offset="0.45" stopColor="#ad6c3b" />
							<stop offset="0.82" stopColor="#7d4524" />
							<stop offset="1" stopColor="#3f1d0d" />
						</radialGradient>
						<filter id="foam">
							<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="9" />
							<feColorMatrix type="matrix" values="0 0 0 0 0.98  0 0 0 0 0.86  0 0 0 0 0.66  0 0 0 0.22 0" />
						</filter>
						<clipPath id="cupIn">
							<circle cx={CX} cy={CY} r="300" />
						</clipPath>
						<mask id="drawMask">
							<rect x="0" y="0" width="1080" height="1920" fill="#000" />
							<path
								d={Array.from({length: 9})
									.map((_, i) => {
										const y = CY - artH / 2 + (i + 0.5) * (artH / 9);
										return i % 2 === 0
											? `${i === 0 ? 'M' : 'L'}${CX - artW / 2 - 40} ${y} L${CX + artW / 2 + 40} ${y}`
											: `L${CX + artW / 2 + 40} ${y} L${CX - artW / 2 - 40} ${y}`;
									})
									.join(' ')}
								fill="none"
								stroke="#fff"
								strokeWidth={artH / 9 + 14}
								pathLength={1}
								strokeDasharray="1 1"
								strokeDashoffset={1 - draw}
							/>
						</mask>
						<filter id="soft">
							<feGaussianBlur stdDeviation="1.6" />
						</filter>
					</defs>
					<rect width="1080" height="1920" fill="url(#counter)" />
					<rect width="1080" height="1920" filter="url(#wood)" opacity="0.5" />
					{/* saucer shadow + cup */}
					<circle cx={CX + 18} cy={CY + 26} r="350" fill="rgba(0,0,0,0.55)" style={{filter: 'blur(24px)'}} />
					<circle cx={CX} cy={CY} r="336" fill="url(#rim)" />
					<circle cx={CX} cy={CY} r="304" fill="#5b3b28" />
					<circle cx={CX} cy={CY} r="300" fill="url(#crema)" />
					<g clipPath="url(#cupIn)">
						<rect x={CX - 300} y={CY - 300} width="600" height="600" filter="url(#foam)" />
						<g mask="url(#drawMask)" filter="url(#soft)">
							<g transform={`translate(${CX - artW / 2} ${CY - artH / 2}) scale(${artW / 1232})`}>
								<path d={BARISTA_PATH} fill="#f8e7c9" fillRule="evenodd" opacity="0.95" />
							</g>
						</g>
						<ellipse cx={CX - 110} cy={CY - 140} rx="120" ry="60" fill="#fff" opacity="0.07" style={{filter: 'blur(18px)'}} />
					</g>
				</svg>
			</AbsoluteFill>
			{/* steam */}
			{[0, 1, 2].map((i) => {
				const p = ((f + i * 14) % 42) / 42;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: CX - 160 + i * 120,
							top: CY - 160 - p * 360,
							width: 90,
							height: 260,
							borderRadius: '50%',
							background: 'rgba(255,240,220,0.5)',
							filter: 'blur(28px)',
							opacity: Math.sin(p * Math.PI) * 0.35 * (1 - dive),
							transform: `translateX(${Math.sin(p * 6 + i) * 30}px)`,
						}}
					/>
				);
			})}
			<GoldText text="زيارة رسمية" f={f - 23} size={124} top={190} inDur={7} outAt={dur - 29} />
		</AbsoluteFill>
	);
};
