import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, LOGO_FONT} from './theme';

// Big soft light ribbons in the brand's coffee tones (the reference uses green/purple)
const Aurora: React.FC<{f: number}> = ({f}) => {
	const a = interpolate(f, [0, 150], [-26, 8]);
	const b = interpolate(f, [0, 150], [18, -10]);
	const drift = interpolate(f, [0, 150], [0, -120]);
	return (
		<svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="ribA" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#ffe2a8" />
					<stop offset="40%" stopColor="#f0a040" />
					<stop offset="100%" stopColor="#9c3a12" />
				</linearGradient>
				<linearGradient id="ribB" x1="1" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#b8481a" />
					<stop offset="55%" stopColor="#e08a2e" />
					<stop offset="100%" stopColor="#ffd9a0" />
				</linearGradient>
				<filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="46" />
				</filter>
				<filter id="edge" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="3" />
				</filter>
			</defs>
			<g style={{mixBlendMode: 'screen'}} transform={`translate(0 ${drift})`}>
				<g transform={`rotate(${a} 1500 2300)`}>
					<ellipse cx="1500" cy="2300" rx="1550" ry="1180" fill="none" stroke="url(#ribA)" strokeWidth="300" filter="url(#soft)" opacity="1" />
					<ellipse cx="1500" cy="2300" rx="1420" ry="1060" fill="none" stroke={C.brandCream} strokeWidth="5" filter="url(#edge)" opacity="0.5" />
				</g>
				<g transform={`rotate(${b} -400 -300)`}>
					<ellipse cx="-400" cy="-300" rx="1300" ry="1050" fill="none" stroke="url(#ribB)" strokeWidth="250" filter="url(#soft)" opacity="0.9" />
					<ellipse cx="-400" cy="-300" rx="1190" ry="950" fill="none" stroke={C.amber} strokeWidth="4" filter="url(#edge)" opacity="0.45" />
				</g>
			</g>
		</svg>
	);
};

// Chevron band like the one printed on the cup
const Band: React.FC<{progress: number}> = ({progress}) => {
	const w = 640;
	const step = 40;
	let zig = `M0 30`;
	for (let x = step / 2, up = true; x <= w; x += step / 2, up = !up) zig += ` L${x} ${up ? 10 : 50}`;
	const dash = 2000;
	return (
		<svg width={w} height="60" viewBox={`0 0 ${w} 60`} style={{overflow: 'visible'}}>
			<g fill="none" stroke={C.brandCream} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" style={{filter: 'drop-shadow(0 0 8px rgba(242,227,179,0.6))'}}>
				<path d={`M0 0 H${w}`} strokeDasharray={dash} strokeDashoffset={dash * (1 - progress)} />
				<path d={zig} strokeDasharray={dash} strokeDashoffset={dash * (1 - progress)} />
				<path d={`M0 60 H${w}`} strokeDasharray={dash} strokeDashoffset={dash * (1 - progress)} />
			</g>
		</svg>
	);
};

export const Logo: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const letters = 'Era Drip'.split('');
	const fadeFromWhite = interpolate(f, [0, 8], [1, 0], {extrapolateRight: 'clamp'});
	const lights = interpolate(f, [0, 20], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
	const wordRy = interpolate(f, [0, 149], [-30, -9], {easing: Easing.out(Easing.cubic)});
	const wordRx = interpolate(f, [0, 149], [16, 7], {easing: Easing.out(Easing.cubic)});
	const wordRz = interpolate(f, [0, 149], [-7, -4]);
	const band = interpolate(f, [26, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
	const pulse = 1 + 0.12 * Math.exp(-Math.max(0, f - 20) / 10) * (f >= 20 ? 1 : 0);

	return (
		<AbsoluteFill style={{background: '#050403', overflow: 'hidden'}}>
			<AbsoluteFill style={{opacity: lights}}>
				<Aurora f={f} />
			</AbsoluteFill>
			<AbsoluteFill style={{perspective: 1400, alignItems: 'center', justifyContent: 'center'}}>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 34,
						transform: `translateY(-40px) rotateX(${wordRx}deg) rotateY(${wordRy}deg) rotateZ(${wordRz}deg)`,
						transformStyle: 'preserve-3d',
					}}
				>
					<div style={{display: 'flex', direction: 'ltr', transformStyle: 'preserve-3d'}}>
						{letters.map((ch, i) => {
							const p = spring({frame: f - 2 - i * 2, fps, config: {damping: 14, stiffness: 110, mass: 0.8}});
							const q = 1 - p;
							return (
								<span
									key={i}
									style={{
										display: 'inline-block',
										width: ch === ' ' ? 54 : undefined,
										fontFamily: LOGO_FONT,
										fontSize: 196,
										color: '#fff7e6',
										opacity: interpolate(p, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
										transform: `translate3d(${q * (i - 3.5) * 120}px, ${q * -160}px, ${q * -1100}px) rotateY(${q * 85}deg) rotateX(${q * -40}deg)`,
										filter: q > 0.02 ? `blur(${q * 18}px)` : undefined,
										textShadow: `0 0 ${18 * pulse}px rgba(255,240,210,0.9), 0 0 ${50 * pulse}px rgba(224,164,88,0.75), 0 0 110px rgba(200,135,58,0.45)`,
									}}
								>
									{ch === ' ' ? ' ' : ch}
								</span>
							);
						})}
					</div>
					<Band progress={band} />
				</div>
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.6) 100%)'}} />
			<AbsoluteFill style={{background: '#fff8ec', opacity: fadeFromWhite}} />
		</AbsoluteFill>
	);
};
