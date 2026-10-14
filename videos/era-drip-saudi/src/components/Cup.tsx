import React from 'react';
import {BARISTA_PATH} from '../baristaPath';
import {LOGO_FONT} from '../theme';

const TOP = 40;
const BOT = 360;
const TOP_HW = 150;
const BOT_HW = 108;
const RY = 24;
const BRY = 17;

const hw = (y: number) => TOP_HW - ((TOP_HW - BOT_HW) * (y - TOP)) / (BOT - TOP);

const BODY = `M${-TOP_HW} ${TOP} L${-BOT_HW} ${BOT} A${BOT_HW} ${BRY} 0 0 0 ${BOT_HW} ${BOT} L${TOP_HW} ${TOP} A${TOP_HW} ${RY} 0 0 1 ${-TOP_HW} ${TOP}Z`;

const ICE = [
	[-70, 34, 48, -12],
	[-14, 28, 52, 9],
	[44, 36, 46, -6],
	[-40, 46, 40, 16],
	[18, 48, 38, -18],
];

// The Era Drip paper cup, front view, iced coffee inside. `width` in px.
export const EraCup: React.FC<{width: number; glow?: number; id?: string}> = ({width, glow = 0, id = 'cup'}) => {
	const zig: string[] = [];
	for (let i = 0; i <= 26; i++) zig.push(`${-156 + i * 12},${i % 2 === 0 ? 306 : 320}`);
	return (
		<svg width={width} height={(width * 400) / 320} viewBox="-160 0 320 400" style={{overflow: 'visible'}}>
			<defs>
				<linearGradient id={`${id}-body`} x1="0" x2="1" y1="0" y2="0">
					<stop offset="0" stopColor="#24130e" />
					<stop offset="0.16" stopColor="#4c2c22" />
					<stop offset="0.34" stopColor="#6a4033" />
					<stop offset="0.55" stopColor="#52312a" />
					<stop offset="0.82" stopColor="#331d17" />
					<stop offset="1" stopColor="#1a0d0a" />
				</linearGradient>
				<radialGradient id={`${id}-coffee`} cx="0.5" cy="0.5" r="0.6">
					<stop offset="0" stopColor="#9a5420" />
					<stop offset="0.6" stopColor="#6d3412" />
					<stop offset="1" stopColor="#3a1a08" />
				</radialGradient>
				<clipPath id={`${id}-clip`}>
					<path d={BODY} />
				</clipPath>
				<clipPath id={`${id}-in`}>
					<ellipse cx="0" cy={TOP} rx={TOP_HW - 9} ry={RY - 4} />
				</clipPath>
			</defs>
			{glow > 0 ? (
				<ellipse cx="0" cy="200" rx="230" ry="260" fill="#ffd27a" opacity={glow * 0.45} style={{filter: 'blur(40px)'}} />
			) : null}
			<ellipse cx="0" cy={BOT + 10} rx={BOT_HW * 1.25} ry={BRY * 1.4} fill="rgba(0,0,0,0.45)" style={{filter: 'blur(8px)'}} />
			<path d={BODY} fill={`url(#${id}-body)`} />
			<g clipPath={`url(#${id}-clip)`}>
				<text
					x="0"
					y="150"
					textAnchor="middle"
					fontFamily={LOGO_FONT}
					fontSize="52"
					fill="#f2e3b3"
					style={{letterSpacing: 1}}
				>
					Era Drip
				</text>
				<g transform={`translate(-38 186) scale(${76 / 1232})`}>
					<path d={BARISTA_PATH} fill="#f2e3b3" fillRule="evenodd" />
				</g>
				<line x1="-160" x2="160" y1="300" y2="300" stroke="#c9a25a" strokeWidth="2" />
				<polyline points={zig.join(' ')} fill="none" stroke="#c9a25a" strokeWidth="2.2" />
				<line x1="-160" x2="160" y1="326" y2="326" stroke="#c9a25a" strokeWidth="2" />
				<path
					d={`M${-hw(346)} 346 L${hw(346)} 346 L${BOT_HW} ${BOT} A${BOT_HW} ${BRY} 0 0 1 ${-BOT_HW} ${BOT}Z`}
					fill="#efe7da"
				/>
				<rect x="-112" y="0" width="34" height="400" fill="#fff" opacity="0.1" style={{filter: 'blur(6px)'}} />
			</g>
			<ellipse cx="0" cy={TOP} rx={TOP_HW} ry={RY} fill="#f3eee4" />
			<ellipse cx="0" cy={TOP} rx={TOP_HW - 9} ry={RY - 4} fill={`url(#${id}-coffee)`} />
			<g clipPath={`url(#${id}-in)`}>
				{ICE.map(([x, y, s, r], i) => (
					<g key={i} transform={`translate(${x} ${y - 14}) rotate(${r})`}>
						<rect x={-s / 2} y={-s / 4} width={s} height={s / 2} rx="8" fill="rgba(255,236,205,0.55)" />
						<rect x={-s / 2 + 5} y={-s / 4 + 3} width={s * 0.45} height={4} rx="2" fill="rgba(255,255,255,0.8)" />
					</g>
				))}
			</g>
		</svg>
	);
};
