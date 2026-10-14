import React from 'react';

type P = [number, number];

// Closed Catmull-Rom spline through the points, as an SVG path
const smooth = (pts: P[], tension = 0.5): string => {
	const n = pts.length;
	let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
	for (let i = 0; i < n; i++) {
		const p0 = pts[(i - 1 + n) % n];
		const p1 = pts[i];
		const p2 = pts[(i + 1) % n];
		const p3 = pts[(i + 2) % n];
		const c1: P = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
		const c2: P = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
		d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
	}
	return d + 'Z';
};

/* ---------------- Falcon (seen from below, flying "up") ---------------- */

// flap: -1 (wings down) .. 1 (wings up). Wingspan ~200 units, centred on 0,0.
export const falconPath = (flap: number): string => {
	const lift = flap * 34;
	const span = 1 - 0.22 * Math.abs(flap);
	const wing = (s: number): P[] => {
		const pts: P[] = [
			[8, -16],
			[30, -22 - lift * 0.3],
			[58, -25 - lift * 0.7],
			[86, -21 - lift * 0.95],
			[112, -12 - lift * 1.1],
			[124, -6 - lift * 1.15],
			[104, -2 - lift * 0.95],
			[80, 3 - lift * 0.65],
			[52, 8 - lift * 0.35],
			[28, 12],
			[9, 10],
		];
		const out = pts.map(([x, y]) => [s * x * span, y] as P);
		return s > 0 ? out : out.reverse();
	};
	const pts: P[] = [
		[0, -40],
		[4.5, -35],
		[6, -26],
		...wing(1),
		[6, 22],
		[13, 46],
		[7, 52],
		[0, 53],
		[-7, 52],
		[-13, 46],
		[-6, 22],
		...wing(-1),
		[-6, -26],
		[-4.5, -35],
	];
	return smooth(pts, 0.55);
};

export const Falcon: React.FC<{size: number; flap: number; color?: string; rim?: string}> = ({
	size,
	flap,
	color = '#1c120c',
	rim = 'rgba(255,200,120,0.55)',
}) => (
	<svg width={size} height={size * 0.6} viewBox="-130 -70 260 138" style={{overflow: 'visible'}}>
		<path d={falconPath(flap)} fill={color} stroke={rim} strokeWidth={1.4} />
	</svg>
);

/* ---------------- Fighter jet (plan view, nose up) ---------------- */

const JET_RIGHT: P[] = [
	[0, -62],
	[3.5, -50],
	[6, -36],
	[8, -26],
	[11, -20],
	[12, -8],
	[50, 14],
	[51, 22],
	[14, 22],
	[13, 30],
	[33, 44],
	[33, 51],
	[13, 47],
	[9, 54],
	[0, 52],
];

const jetPathD = (() => {
	const left = JET_RIGHT.slice(1, -1)
		.map(([x, y]) => [-x, y] as P)
		.reverse();
	const pts = [...JET_RIGHT, ...left];
	return 'M' + pts.map(([x, y]) => `${x} ${y}`).join('L') + 'Z';
})();

export const JetShape: React.FC<{fill?: string}> = ({fill = '#1d2229'}) => (
	<g>
		<path d={jetPathD} fill={fill} />
		<path d="M-2.4 -40 Q0 -48 2.4 -40 L2 -28 L-2 -28Z" fill="rgba(255,220,160,0.35)" />
	</g>
);

/* ---------------- Formation with smoke trails ---------------- */

export type Jet = {dx: number; dy: number; smoke?: string};

// Jets fly along `angle` (deg, 0 = up). `progress` moves the leader along its path,
// from `start` to `end` (screen px). Trails stay behind each jet and widen with age.
export const Formation: React.FC<{
	jets: Jet[];
	start: P;
	end: P;
	progress: number;
	scale: number;
	trail?: number;
	id: string;
	jetFill?: string;
	trailOpacity?: number;
}> = ({jets, start, end, progress, scale, trail = 1400, id, jetFill, trailOpacity = 0.9}) => {
	const vx = end[0] - start[0];
	const vy = end[1] - start[1];
	const len = Math.hypot(vx, vy);
	const ux = vx / len;
	const uy = vy / len;
	const angle = (Math.atan2(uy, ux) * 180) / Math.PI + 90;
	const lead: P = [start[0] + vx * progress, start[1] + vy * progress];
	// lateral axis (to the right of travel)
	const rx = -uy;
	const ry = ux;
	const travelled = len * progress;
	return (
		<svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<defs>
				<filter id={`smoke-${id}`} x="-50%" y="-50%" width="200%" height="200%">
					<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed={3} result="n" />
					<feDisplacementMap in="SourceGraphic" in2="n" scale={28 * scale} xChannelSelector="R" yChannelSelector="G" result="d" />
					<feGaussianBlur in="d" stdDeviation={7 * scale} />
				</filter>
				{jets.map((j, i) => (
					<linearGradient
						key={i}
						id={`tg-${id}-${i}`}
						gradientUnits="userSpaceOnUse"
						x1={lead[0] + (rx * j.dx - ux * j.dy) * scale}
						y1={lead[1] + (ry * j.dx - uy * j.dy) * scale}
						x2={lead[0] + (rx * j.dx - ux * j.dy) * scale - ux * trail}
						y2={lead[1] + (ry * j.dx - uy * j.dy) * scale - uy * trail}
					>
						<stop offset="0" stopColor={j.smoke ?? '#fff'} stopOpacity={trailOpacity} />
						<stop offset="0.55" stopColor={j.smoke ?? '#fff'} stopOpacity={trailOpacity * 0.55} />
						<stop offset="1" stopColor={j.smoke ?? '#fff'} stopOpacity={0} />
					</linearGradient>
				))}
			</defs>
			<g filter={`url(#smoke-${id})`}>
				{jets.map((j, i) => {
					if (!j.smoke) return null;
					// tail position of this jet
					const px = lead[0] + (rx * j.dx - ux * j.dy) * scale;
					const py = lead[1] + (ry * j.dx - uy * j.dy) * scale;
					const tailBack = 50 * scale;
					const tx = px - ux * tailBack;
					const ty = py - uy * tailBack;
					const L = Math.min(trail, travelled + 400);
					const ex = tx - ux * L;
					const ey = ty - uy * L;
					const w0 = 6 * scale;
					const w1 = 46 * scale;
					const pts = [
						[tx + rx * w0, ty + ry * w0],
						[ex + rx * w1, ey + ry * w1],
						[ex - rx * w1, ey - ry * w1],
						[tx - rx * w0, ty - ry * w0],
					];
					return <path key={i} d={'M' + pts.map((p) => p.join(' ')).join('L') + 'Z'} fill={`url(#tg-${id}-${i})`} />;
				})}
			</g>
			{jets.map((j, i) => {
				const px = lead[0] + (rx * j.dx - ux * j.dy) * scale;
				const py = lead[1] + (ry * j.dx - uy * j.dy) * scale;
				return (
					<g key={i} transform={`translate(${px} ${py}) rotate(${angle}) scale(${scale})`}>
						<JetShape fill={jetFill} />
					</g>
				);
			})}
		</svg>
	);
};

// Classic V: leader + pairs stepping back. Alternating green/white smoke.
export const V_FORMATION: Jet[] = [
	{dx: 0, dy: 0, smoke: '#ffffff'},
	{dx: -120, dy: 110, smoke: '#0f9b52'},
	{dx: 120, dy: 110, smoke: '#0f9b52'},
	{dx: -240, dy: 220, smoke: '#ffffff'},
	{dx: 240, dy: 220, smoke: '#ffffff'},
	{dx: -360, dy: 330, smoke: '#0f9b52'},
	{dx: 360, dy: 330, smoke: '#0f9b52'},
];
