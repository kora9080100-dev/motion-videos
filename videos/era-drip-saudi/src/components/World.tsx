import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EraCup} from './Cup';
import {FlagPole} from './Flag';
import {Guard} from './Guard';
import {Formation, Jet} from './Silhouettes';

export type Cam = {x: number; y: number; z: number; hy: number; f: number};

const proj = (cam: Cam, X: number, Y: number, Z: number) => {
	const z = Math.max(0.25, Z - cam.z);
	const s = cam.f / z;
	return {x: 540 + (X - cam.x) * s, y: cam.hy + (cam.y - Y) * s, s, z};
};

const CARPET_HW = 1.3;
const BORDER_IN = 1.08;
const Z_FAR = 70;

export const GUARD_Z = [4.6, 7.2, 10, 13, 16.5, 20.5, 25];
const FLAG_Z = [6, 11.5, 18, 26, 36];

export type FormationSpec = {
	id: string;
	jets: Jet[];
	start: [number, number];
	end: [number, number];
	progress: number;
	scale: number;
	trail?: number;
	trailOpacity?: number;
};

export type WorldState = {
	cam: Cam;
	carpet: number; // 0..1 unrolled
	guards: (i: number, side: number) => {up: number; raise: number};
	cup?: {z: number; lift: number; squash: number; glow?: number};
	shock?: number; // 0..1 landing ring
	flags: number; // 0..1 flags raised
	flagMinZ?: number; // hide the nearest flags (keeps the sky clear for titles)
	nearFlag?: {x: number; z: number; h: number};
	formations?: FormationSpec[];
	sunGlow?: number;
};

const SKYLINE = (
	<svg width="1080" height="190" viewBox="0 -170 1080 190" style={{display: 'block'}}>
		<defs>
			<linearGradient id="haze" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0" stopColor="#5d4560" />
				<stop offset="1" stopColor="#a4706e" />
			</linearGradient>
		</defs>
		<g fill="url(#haze)">
			{/* Kingdom Centre: tapering tower with the arched opening and sky bridge */}
			<path
				fillRule="evenodd"
				d="M688 20 C692 -40 698 -100 706 -158 L726 -158 C734 -100 740 -40 744 20Z M709 -154 Q716 -116 723 -154Z M711 -128 Q716 -100 721 -128 L719 -126 Q716 -112 713 -126Z"
			/>
			{/* Al Faisaliah: pyramid tower with the golden ball and spire */}
			<path d="M372 20 L388 -104 L400 -104 L416 20Z" />
			<circle cx="394" cy="-112" r="8" fill="#c99a6a" />
			<rect x="393" y="-150" width="2" height="34" />
			{/* city blocks */}
			{[
				[0, 34],
				[40, 52],
				[70, 28],
				[110, 64],
				[150, 40],
				[200, 74],
				[240, 46],
				[290, 58],
				[330, 36],
				[440, 62],
				[480, 44],
				[520, 82],
				[560, 50],
				[600, 66],
				[640, 38],
				[770, 56],
				[810, 72],
				[850, 42],
				[900, 60],
				[950, 30],
				[990, 54],
				[1030, 40],
			].map(([x, h], i) => (
				<rect key={i} x={x} y={-h} width={36 + (i % 3) * 6} height={h + 20} />
			))}
			{/* palms */}
			{[90, 260, 560, 860, 1000].map((x, i) => (
				<g key={i} transform={`translate(${x} 4)`}>
					<rect x="-1.5" y="-46" width="3" height="50" />
					<path d="M0 -46 C-14 -52 -24 -46 -30 -38 C-20 -46 -10 -46 0 -44 C-10 -40 -16 -32 -18 -24 C-10 -34 -4 -40 0 -43 C8 -38 12 -30 14 -24 C12 -34 6 -42 1 -45 C10 -48 20 -46 30 -38 C22 -50 10 -52 0 -46Z" />
				</g>
			))}
		</g>
	</svg>
);

export const World: React.FC<{s: WorldState}> = ({s}) => {
	const {cam} = s;
	const hy = cam.hy;

	// ground grid
	const gridLines: React.ReactNode[] = [];
	for (let Z = 2; Z < 60; Z += Z < 12 ? 1.5 : 4) {
		const p = proj(cam, 0, 0, Z);
		if (Z - cam.z < 0.3) continue;
		gridLines.push(<line key={`h${Z}`} x1={-200} x2={1280} y1={p.y} y2={p.y} stroke="#6e4d3a" strokeOpacity={0.18} strokeWidth={1.2} />);
	}
	for (let X = -24; X <= 24; X += 3) {
		const a = proj(cam, X, 0, cam.z + 0.6);
		const b = proj(cam, X, 0, 80);
		gridLines.push(<line key={`v${X}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#6e4d3a" strokeOpacity={0.14} strokeWidth={1.2} />);
	}

	// carpet
	const zNear = cam.z + 0.35;
	const zEnd = zNear + (Z_FAR - zNear) * Math.pow(s.carpet, 1.6);
	const carpetEls: React.ReactNode[] = [];
	if (s.carpet > 0.001) {
		const q = (X: number, Z: number) => {
			const p = proj(cam, X, 0, Z);
			return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
		};
		carpetEls.push(
			<polygon key="base" points={[q(-CARPET_HW, zNear), q(CARPET_HW, zNear), q(CARPET_HW, zEnd), q(-CARPET_HW, zEnd)].join(' ')} fill="url(#carpet)" />,
		);
		// sheen of the low sun running down the middle of the pile
		carpetEls.push(
			<polygon key="sheen" points={[q(-0.55, zNear), q(0.55, zNear), q(0.1, zEnd), q(-0.1, zEnd)].join(' ')} fill="url(#sheen)" />,
		);
		for (const side of [-1, 1]) {
			const zi = Math.min(zEnd, 40);
			carpetEls.push(
				<polygon
					key={`l${side}`}
					points={[q(side * 0.93, zNear), q(side * 0.97, zNear), q(side * 0.97, zi), q(side * 0.93, zi)].join(' ')}
					fill="#d9b25e"
					opacity={0.75}
				/>,
			);
			carpetEls.push(
				<polygon
					key={`b${side}`}
					points={[q(side * BORDER_IN, zNear), q(side * CARPET_HW, zNear), q(side * CARPET_HW, zEnd), q(side * BORDER_IN, zEnd)].join(' ')}
					fill="#d1a24c"
				/>,
			);
			// Sadu triangles along the border
			const step = 0.44;
			for (let Z = Math.ceil(zNear / step) * step, k = 0; Z < Math.min(zEnd, 34); Z += step, k++) {
				const z2 = Math.min(Z + step, zEnd);
				const tip = (Z + z2) / 2;
				const col = ['#8e1f24', '#1c1210', '#f1e7d4'][Math.round(Z / step) % 3];
				carpetEls.push(
					<polygon
						key={`t${side}${k}`}
						points={[q(side * (BORDER_IN + 0.03), Z), q(side * (CARPET_HW - 0.03), tip), q(side * (BORDER_IN + 0.03), z2)].join(' ')}
						fill={col}
					/>,
				);
			}
		}
		if (s.carpet < 0.999) {
			// the rolled-up end racing toward the horizon
			const a = proj(cam, -CARPET_HW * 1.02, 0.18, zEnd);
			const b = proj(cam, CARPET_HW * 1.02, 0.18, zEnd);
			const r = Math.max(2, 0.2 * a.s);
			carpetEls.push(<rect key="roll" x={a.x} y={a.y - r} width={b.x - a.x} height={r * 2} rx={r} fill="url(#roll)" />);
		}
	}

	// sprites sorted far to near
	type Sprite = {z: number; node: React.ReactNode};
	const sprites: Sprite[] = [];

	FLAG_Z.forEach((Z, i) => {
		if (Z < (s.flagMinZ ?? 0)) return;
		for (const side of [-1, 1]) {
			const X = side * 2.6;
			const base = proj(cam, X, 0, Z);
			if (base.z < 0.6) continue;
			const top = proj(cam, X, 6.4 * s.flags, Z);
			const fw = 1.8 * base.s;
			sprites.push({
				z: base.z,
				node: (
					<div key={`f${i}${side}`} style={{position: 'absolute', left: base.x - fw * 0.035 * 0.5, top: top.y}}>
						<FlagPole width={fw} poleHeight={base.y - top.y} phase={i * 1.3 + side} speed={0.2} />
					</div>
				),
			});
		}
	});

	GUARD_Z.forEach((Z, i) => {
		for (const side of [-1, 1]) {
			const {up, raise} = s.guards(i, side);
			if (up <= 0.001) continue;
			const X = side * 1.75;
			const p = proj(cam, X, 0, Z);
			if (p.z < 0.6) continue;
			const h = 1.85 * p.s;
			sprites.push({
				z: p.z,
				node: (
					<div
						key={`g${i}${side}`}
						style={{
							position: 'absolute',
							left: p.x - (h * 0.6) / 2,
							top: p.y - h,
							opacity: Math.min(1, up * 1.4),
							transform: `translateY(${(1 - up) * h * 0.25}px)`,
						}}
					>
						<Guard height={h} raise={raise} flip={side > 0} />
					</div>
				),
			});
		}
	});

	if (s.cup) {
		const {z, lift, squash, glow = 0} = s.cup;
		const p = proj(cam, 0, 0, z);
		const hM = 3.1;
		const hPx = hM * p.s * (1 - squash * 0.12);
		const wPx = ((hM * p.s * 320) / 400) * (1 + squash * 0.1);
		const liftPx = lift * p.s;
		sprites.push({
			z: p.z - 0.01,
			node: (
				<div key="cup" style={{position: 'absolute', left: p.x - wPx / 2, top: p.y - (377 / 400) * hPx - liftPx}}>
					<div style={{width: wPx, height: hPx}}>
						<div style={{transform: `scale(1, ${1 - squash * 0.12})`, transformOrigin: '50% 94%'}}>
							<EraCup width={wPx} glow={glow} id="worldcup" />
						</div>
					</div>
				</div>
			),
		});
	}

	if (s.nearFlag) {
		const p = proj(cam, s.nearFlag.x, 0, s.nearFlag.z);
		const top = proj(cam, s.nearFlag.x, s.nearFlag.h, s.nearFlag.z);
		const fw = 2.2 * p.s;
		sprites.push({
			z: p.z,
			node: (
				<div key="nearflag" style={{position: 'absolute', left: p.x, top: top.y}}>
					<FlagPole width={fw} poleHeight={p.y - top.y} speed={0.24} amp={0.06} />
				</div>
			),
		});
	}

	sprites.sort((a, b) => b.z - a.z);

	const shock = s.shock ?? 0;
	const cupP = s.cup ? proj(cam, 0, 0, s.cup.z) : null;

	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#141a33'}}>
			{/* sky */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: hy - 2000,
					height: 2000,
					background:
						'linear-gradient(180deg, #11162c 0%, #1e2445 40%, #4a3c63 66%, #9a5f6a 82%, #e08c5b 93%, #f8c47e 100%)',
				}}
			/>
			{/* sun */}
			<div
				style={{
					position: 'absolute',
					left: 540 - 520,
					top: hy - 520 - 40,
					width: 1040,
					height: 1040,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(255,226,160,0.95) 0%, rgba(255,190,110,0.55) 12%, rgba(255,150,90,0.18) 36%, rgba(255,140,90,0) 62%)',
					opacity: s.sunGlow ?? 1,
				}}
			/>
			{(s.formations ?? []).map((fm) => (
				<Formation key={fm.id} {...fm} />
			))}
			<div style={{position: 'absolute', left: 0, top: hy - 170}}>{SKYLINE}</div>
			{/* ground */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: hy,
					height: 2400,
					background: 'linear-gradient(180deg, #e2b285 0%, #c99a73 6%, #a9805f 22%, #7c5a43 60%, #5a3f2f 100%)',
				}}
			/>
			<svg width="1080" height="1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<defs>
					<linearGradient id="carpet" x1="0" x2="0" y1="1" y2="0" gradientUnits="objectBoundingBox">
						<stop offset="0" stopColor="#5b3f8c" />
						<stop offset="0.6" stopColor="#7a5aa8" />
						<stop offset="1" stopColor="#b88fb8" />
					</linearGradient>
					<linearGradient id="sheen" x1="0" x2="0" y1="1" y2="0" gradientUnits="objectBoundingBox">
						<stop offset="0" stopColor="#c9a6e6" stopOpacity="0" />
						<stop offset="0.7" stopColor="#e2c4f0" stopOpacity="0.28" />
						<stop offset="1" stopColor="#ffe0c0" stopOpacity="0.55" />
					</linearGradient>
					<linearGradient id="roll" x1="0" x2="0" y1="0" y2="1">
						<stop offset="0" stopColor="#a585d0" />
						<stop offset="0.5" stopColor="#6a4c99" />
						<stop offset="1" stopColor="#3a2860" />
					</linearGradient>
				</defs>
				{gridLines}
				{carpetEls}
				{cupP && shock > 0 && shock < 1 ? (
					<ellipse
						cx={cupP.x}
						cy={cupP.y}
						rx={(0.8 + shock * 5) * cupP.s}
						ry={(0.8 + shock * 5) * cupP.s * 0.18}
						fill="none"
						stroke="#ffe6b0"
						strokeWidth={10 * (1 - shock)}
						opacity={1 - shock}
						style={{filter: 'blur(3px)'}}
					/>
				) : null}
			</svg>
			{sprites.map((sp) => sp.node)}
			{/* warm haze over the horizon */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: hy - 140,
					height: 220,
					background: 'linear-gradient(180deg, rgba(255,190,120,0) 0%, rgba(255,190,120,0.35) 55%, rgba(255,190,120,0) 100%)',
					pointerEvents: 'none',
				}}
			/>
		</AbsoluteFill>
	);
};
