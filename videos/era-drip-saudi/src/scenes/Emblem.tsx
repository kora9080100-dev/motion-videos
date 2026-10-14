import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {BARISTA_PATH} from '../baristaPath';
import {clamp, easeInOut, LOGO_FONT, T} from '../theme';

// The barista from the logo cast in gold on a cream wall, a light sweeping across it.
export const Emblem: React.FC = () => {
	const f = useCurrentFrame();
	const dur = T.hands - T.emblem;
	const sweep = easeInOut(interpolate(f, [2, 18], [0, 1], clamp));
	const lx = interpolate(sweep, [0, 1], [-300, 1500]);
	const fromWhite = interpolate(f, [0, 5], [1, 0], clamp);
	const toBlack = interpolate(f, [dur - 6, dur], [0, 1], clamp);
	const scale = interpolate(f, [0, dur], [1.07, 1.0], clamp);
	const artW = 560;
	const artH = (artW * 1552) / 1232;
	const top = 520;
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#e9dcc1'}}>
			<AbsoluteFill style={{transform: `scale(${scale})`}}>
				<svg width="1080" height="1920" viewBox="0 0 1080 1920">
					<defs>
						<linearGradient id="wall" x1="0" x2="0" y1="0" y2="1">
							<stop offset="0" stopColor="#bba47c" />
							<stop offset="0.45" stopColor="#e4d5b5" />
							<stop offset="1" stopColor="#a68f69" />
						</linearGradient>
						<filter id="plaster">
							<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2" />
							<feColorMatrix type="matrix" values="0 0 0 0 0.4  0 0 0 0 0.32  0 0 0 0 0.22  0 0 0 0.18 0" />
						</filter>
						<linearGradient id="goldFill" x1="0" x2="1" y1="0" y2="1">
							<stop offset="0" stopColor="#ffe9a3" />
							<stop offset="0.3" stopColor="#d79a2e" />
							<stop offset="0.55" stopColor="#8a5410" />
							<stop offset="0.8" stopColor="#c98d2a" />
							<stop offset="1" stopColor="#f6d58a" />
						</linearGradient>
						<filter id="gold" x="-10%" y="-10%" width="120%" height="120%">
							<feMorphology in="SourceGraphic" operator="dilate" radius="1.6" result="thick" />
							<feGaussianBlur in="thick" stdDeviation="2.6" result="b" />
							<feSpecularLighting in="b" surfaceScale="6" specularConstant="1.2" specularExponent="18" lightingColor="#fff4d6" result="spec">
								<fePointLight x={lx} y={top + 200} z="380" />
							</feSpecularLighting>
							<feComposite in="spec" in2="thick" operator="in" result="specIn" />
							<feComposite in="thick" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="1.1" k4="0" result="lit" />
							<feDropShadow in="lit" dx="7" dy="12" stdDeviation="7" floodColor="#2e1d0a" floodOpacity="0.7" />
						</filter>
					</defs>
					<rect width="1080" height="1920" fill="url(#wall)" />
					<rect width="1080" height="1920" filter="url(#plaster)" />
					{/* window light falling across the wall */}
					{[0, 1, 2].map((i) => (
						<polygon
							key={i}
							points={`${-200 + i * 260},0 ${-60 + i * 260},0 ${520 + i * 260},1920 ${380 + i * 260},1920`}
							fill="#fff8e6"
							opacity="0.28"
							style={{filter: 'blur(26px)'}}
						/>
					))}
					<g filter="url(#gold)">
						<g transform={`translate(${540 - artW / 2} ${top}) scale(${artW / 1232})`}>
							<path d={BARISTA_PATH} fill="url(#goldFill)" fillRule="evenodd" />
						</g>
						<text x="540" y={top + artH + 150} textAnchor="middle" fontFamily={LOGO_FONT} fontSize="132" fill="url(#goldFill)">
							Era Drip
						</text>
					</g>
				</svg>
			</AbsoluteFill>
			<AbsoluteFill
				style={{
					background: `linear-gradient(110deg, rgba(255,255,255,0) ${(sweep * 140 - 30).toFixed(1)}%, rgba(255,250,230,0.35) ${(sweep * 140 - 20).toFixed(1)}%, rgba(255,255,255,0) ${(sweep * 140 - 10).toFixed(1)}%)`,
					mixBlendMode: 'screen',
				}}
			/>
			<AbsoluteFill style={{background: '#fffaf0', opacity: fromWhite}} />
			<AbsoluteFill style={{background: '#000', opacity: toBlack}} />
		</AbsoluteFill>
	);
};
