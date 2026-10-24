import React from 'react';
import {arabic, C, wide} from '../theme';

// KAMOVIE mark: a play triangle inside camera viewfinder corners
export const LogoMark: React.FC<{
	size: number;
	color?: string;
	bg?: string;
	style?: React.CSSProperties;
}> = ({size, color = C.cream, bg = 'transparent', style}) => (
	<svg width={size} height={size} viewBox="0 0 100 100" style={style}>
		<rect x="0" y="0" width="100" height="100" rx="22" fill={bg} />
		<g fill="none" stroke={color} strokeWidth="6.5" strokeLinecap="round">
			<path d="M18 36 V22 Q18 18 22 18 H36" />
			<path d="M64 18 H78 Q82 18 82 22 V36" />
			<path d="M82 64 V78 Q82 82 78 82 H64" />
			<path d="M36 82 H22 Q18 82 18 78 V64" />
		</g>
		<path d="M41 33 L68 50 L41 67 Z" fill={color} stroke={color} strokeWidth="4" strokeLinejoin="round" />
	</svg>
);

export const Wordmark: React.FC<{size: number; color: string; spacing?: number}> = ({
	size,
	color,
	spacing = 0.32,
}) => (
	<div
		style={{
			fontFamily: wide,
			fontSize: size,
			color,
			letterSpacing: `${spacing}em`,
			marginRight: `-${spacing}em`,
			lineHeight: 1,
		}}
	>
		KAMOVIE
	</div>
);

export const StopSign: React.FC<{size: number}> = ({size}) => {
	const pts = Array.from({length: 8}, (_, i) => {
		const a = (Math.PI / 8) * (2 * i + 1);
		return `${50 + 48 * Math.cos(a)},${50 + 48 * Math.sin(a)}`;
	}).join(' ');
	const inner = Array.from({length: 8}, (_, i) => {
		const a = (Math.PI / 8) * (2 * i + 1);
		return `${50 + 42 * Math.cos(a)},${50 + 42 * Math.sin(a)}`;
	}).join(' ');
	return (
		<div style={{position: 'relative', width: size, height: size}}>
			<svg width={size} height={size} viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 18px 24px rgba(0,0,0,0.35))'}}>
				<polygon points={pts} fill="#F4EFE6" />
				<polygon points={inner} fill="#D3262C" />
			</svg>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: arabic,
					fontWeight: 900,
					fontSize: size * 0.34,
					color: '#F4EFE6',
					paddingBottom: size * 0.04,
				}}
			>
				قف
			</div>
		</div>
	);
};

export const Starburst: React.FC<{size: number; color: string; points?: number}> = ({
	size,
	color,
	points = 14,
}) => {
	const d = Array.from({length: points * 2}, (_, i) => {
		const r = i % 2 === 0 ? 48 : 30;
		const a = (Math.PI / points) * i;
		return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
	}).join(' ');
	return (
		<svg width={size} height={size} viewBox="0 0 100 100">
			<polygon points={d} fill={color} />
		</svg>
	);
};

export const Cursor: React.FC<{size: number}> = ({size}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={{filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))'}}>
		<path
			d="M4 2.5 L4 19.5 L8.6 15.4 L11.6 22 L14.6 20.7 L11.7 14.2 L17.8 14.2 Z"
			fill="#FFFFFF"
			stroke="#111"
			strokeWidth="1.3"
			strokeLinejoin="round"
		/>
	</svg>
);

// Retro OS window with title bar dots
export const WindowFrame: React.FC<{
	width: number;
	height: number;
	bar?: string;
	children: React.ReactNode;
	style?: React.CSSProperties;
}> = ({width, height, bar = '#E9E2D4', children, style}) => (
	<div
		style={{
			width,
			height,
			borderRadius: 14,
			overflow: 'hidden',
			background: '#111',
			boxShadow: '0 24px 50px rgba(0,0,0,0.45), 0 2px 0 rgba(255,255,255,0.15) inset',
			display: 'flex',
			flexDirection: 'column',
			...style,
		}}
	>
		<div
			style={{
				height: 34,
				background: bar,
				display: 'flex',
				alignItems: 'center',
				gap: 9,
				paddingLeft: 14,
				flexShrink: 0,
			}}
		>
			{['#E5534B', '#E9B43A', '#4FB04A'].map((c) => (
				<div key={c} style={{width: 13, height: 13, borderRadius: 7, background: c}} />
			))}
		</div>
		<div style={{flex: 1, position: 'relative', overflow: 'hidden'}}>{children}</div>
	</div>
);

export const PlayIcon: React.FC<{size: number; color: string; ring?: boolean}> = ({size, color, ring = true}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		{ring ? <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="6" /> : null}
		<path d="M40 30 L72 50 L40 70 Z" fill={color} />
	</svg>
);

export const BulbIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
		<path d="M50 14 C33 14 24 27 24 40 C24 51 31 57 35 63 C38 67 38 71 38 74 H62 C62 71 62 67 65 63 C69 57 76 51 76 40 C76 27 67 14 50 14 Z" />
		<path d="M40 84 H60" />
		<path d="M44 92 H56" />
		<path d="M50 74 V54 M43 47 L50 54 L57 47" />
	</svg>
);

export const PenIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
		<path d="M50 12 L74 46 L62 82 H38 L26 46 Z" />
		<path d="M50 12 V50" />
		<circle cx="50" cy="56" r="6" />
		<path d="M34 90 H66" />
	</svg>
);

export const MotionIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="62" cy="50" r="22" />
		<path d="M56 41 L71 50 L56 59 Z" fill={color} />
		<path d="M10 34 H30 M4 50 H28 M10 66 H30" />
	</svg>
);

export const PlaneIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
		<path d="M88 14 L12 46 L42 56 L52 86 Z" />
		<path d="M88 14 L42 56" />
	</svg>
);

// Ornamental woven border, a nod to Sadu patterns
export const PatternTile: React.FC<{
	width: number;
	height: number;
	panel: string;
	border: string;
	accent: string;
	children: React.ReactNode;
	id: string;
}> = ({width, height, panel, border, accent, children, id}) => (
	<div style={{position: 'relative', width, height, boxShadow: '0 16px 30px rgba(60,10,15,0.25)'}}>
		<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
			<defs>
				<pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
					<rect width="28" height="28" fill={border} />
					<path d="M0 28 L14 6 L28 28 Z" fill={accent} />
					<path d="M7 28 L14 17 L21 28 Z" fill={C.cream} />
				</pattern>
			</defs>
			<rect width={width} height={height} fill={`url(#${id})`} />
			<rect x="22" y="22" width={width - 44} height={height - 44} fill={C.cream} />
			<rect x="30" y="30" width={width - 60} height={height - 60} fill={panel} />
		</svg>
		<div style={{position: 'absolute', inset: 30, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			{children}
		</div>
	</div>
);

export const GoldFrame: React.FC<{
	width: number;
	height: number;
	border?: number;
	children: React.ReactNode;
	style?: React.CSSProperties;
}> = ({width, height, border = 34, children, style}) => (
	<div
		style={{
			width,
			height,
			padding: border,
			background: `linear-gradient(135deg, ${C.goldLight} 0%, ${C.gold} 25%, ${C.goldDark} 50%, ${C.gold} 72%, ${C.goldLight} 100%)`,
			boxShadow: `0 40px 80px rgba(0,0,0,0.55), inset 0 0 0 4px ${C.goldDark}, inset 0 0 0 9px ${C.goldLight}`,
			...style,
		}}
	>
		<div
			style={{
				width: '100%',
				height: '100%',
				position: 'relative',
				overflow: 'hidden',
				boxShadow: `0 0 0 6px ${C.goldDark}, inset 0 0 40px rgba(0,0,0,0.8)`,
			}}
		>
			{children}
		</div>
	</div>
);
