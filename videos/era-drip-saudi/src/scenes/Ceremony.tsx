import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {GoldText} from '../components/Common';
import {FlagPole} from '../components/Flag';
import {Formation, V_FORMATION} from '../components/Silhouettes';
import {World} from '../components/World';
import {backOut, clamp, easeIn, easeInOut, easeOut, LOGO_FONT, ARABIC_FONT, T, GOLD_GRADIENT} from '../theme';

const shake = (f: number, at: number, len: number, amp: number, seed: string) => {
	const k = interpolate(f, [at, at + len], [1, 0], clamp) * (f >= at ? 1 : 0);
	return {x: (random(`${seed}x${f}`) - 0.5) * amp * k, y: (random(`${seed}y${f}`) - 0.5) * amp * k};
};

// Welcome ceremony: flags rise, the purple carpet rolls out, guards line up and raise
// their swords, the cup lands, then the camera tilts up into the jet fly-past.
export const Ceremony: React.FC = () => {
	const g = useCurrentFrame();
	const L = (abs: number) => abs - T.ceremony;
	const gGuards = L(T.guards);
	const gSwords = L(T.swords);
	const gLand = L(T.cupLand);
	const gPush = L(T.push);
	const gDrop = L(T.drop);
	const dur = T.montage - T.ceremony;

	const camZ =
		interpolate(g, [0, gGuards], [-2.6, -1.2], {...clamp, easing: easeOut}) +
		interpolate(g, [gLand, gPush], [0, 1.0], {...clamp, easing: easeInOut}) +
		interpolate(g, [gPush, gDrop], [0, 1.1], {...clamp, easing: easeIn});
	const camY = interpolate(g, [0, gGuards], [1.15, 1.5], {...clamp, easing: easeOut});
	const tilt = interpolate(g, [gDrop, gDrop + 12], [0, 1], {...clamp, easing: easeOut});
	const hy = interpolate(g, [0, gGuards], [760, 720], {...clamp, easing: easeOut}) + tilt * 620;
	const sk1 = shake(g, gLand, 10, 0.12, 'land');
	const sk2 = shake(g, gDrop, 16, 0.16, 'drop');

	const carpet = easeOut(interpolate(g, [0, 20], [0, 1], clamp));
	const flags = backOut(interpolate(g, [0, 9], [0, 1], clamp));
	const fall = easeIn(interpolate(g, [gLand - 10, gLand], [0, 1], clamp));
	const squash = g >= gLand ? Math.max(0, Math.cos((g - gLand) * 0.9) * Math.exp(-(g - gLand) * 0.28)) : 0;
	const shock = interpolate(g, [gLand, gLand + 12], [0, 1], clamp);

	const jets = interpolate(g, [gDrop + 1, dur + 4], [0, 1], clamp);
	const jets2 = interpolate(g, [gDrop + 4, dur + 10], [0, 1], clamp);
	const whiteout = easeIn(interpolate(g, [dur - 7, dur], [0, 1], clamp));

	return (
		<AbsoluteFill>
			<World
				s={{
					cam: {x: sk1.x + sk2.x, y: camY + sk1.y + sk2.y, z: camZ, hy, f: 1900},
					carpet,
					flags,
					guards: (i, side) => {
						const t0 = gGuards + i * 1.3 + (side > 0 ? 0.6 : 0);
						const r0 = gSwords + i * 1.1 + (side > 0 ? 0.5 : 0);
						return {
							up: easeOut(interpolate(g, [t0, t0 + 5], [0, 1], clamp)),
							raise: backOut(interpolate(g, [r0, r0 + 5], [0, 1], clamp)),
						};
					},
					cup: g >= gLand - 10 ? {z: 8.5, lift: (1 - fall) * 16, squash, glow: tilt * 0.6} : undefined,
					shock: g >= gLand ? shock : 0,
					nearFlag: tilt > 0.01 ? {x: -1.5, z: camZ + 6.5, h: 5.8} : undefined,
					formations: [
						{id: 'c1', jets: V_FORMATION, start: [-350, 1800], end: [1450, -550], progress: jets, scale: 1.25, trail: 2200},
						{id: 'c2', jets: V_FORMATION.slice(0, 5), start: [1350, 1000], end: [-300, 380], progress: jets2, scale: 0.38, trail: 900},
					],
				}}
			/>
			<GoldText text="مراسم الاستقبال" f={g - 3} size={104} top={250} inDur={7} outAt={gPush - 4} />
			<AbsoluteFill style={{background: '#fffaf0', opacity: whiteout}} />
		</AbsoluteFill>
	);
};

// Montage beat: the flag filling the frame with a far fly-past.
export const FlagCloseup: React.FC<{f: number; dur: number}> = ({f, dur}) => (
	<AbsoluteFill style={{background: 'linear-gradient(180deg, #1c2546 0%, #4b4c78 45%, #c98667 80%, #f2b97c 100%)', overflow: 'hidden'}}>
		<Formation id="fc" jets={V_FORMATION} start={[1250, 1300]} end={[-200, 200]} progress={interpolate(f, [0, dur], [0.25, 0.75])} scale={0.42} trail={1000} />
		<div style={{position: 'absolute', left: -140, top: 520, transform: `rotate(-6deg) scale(${interpolate(f, [0, dur], [1.04, 1.12])})`}}>
			<FlagPole width={1320} poleHeight={2200} speed={0.26} amp={0.07} />
		</div>
	</AbsoluteFill>
);

// Montage beat: jets screaming overhead, seen from the carpet looking up.
export const JetsOverhead: React.FC<{f: number; dur: number}> = ({f, dur}) => (
	<World
		s={{
			cam: {x: 0, y: 1.4, z: 2, hy: 1780, f: 1100},
			carpet: 1,
			flags: 1,
			guards: () => ({up: 1, raise: 1}),
			cup: {z: 8.5, lift: 0, squash: 0},
			formations: [
				{
					id: 'ov',
					jets: V_FORMATION,
					start: [1400, 1700],
					end: [-500, -300],
					progress: interpolate(f, [0, dur], [0.18, 0.62]),
					scale: 1.55,
					trail: 2400,
				},
			],
		}}
	/>
);

// Finale: the full ceremony at dusk, a last fly-past, logo and tagline in the sky.
export const Finale: React.FC = () => {
	const g = useCurrentFrame();
	const dur = T.end - T.finale;
	const gLogo = T.logo - T.finale;
	const gTag = T.tagline - T.finale;
	const camZ = interpolate(g, [0, dur], [0.4, -1.6], {...clamp, easing: easeOut});
	const hy = interpolate(g, [0, 26], [1500, 1130], {...clamp, easing: easeInOut});
	const logoIn = backOut(interpolate(g, [gLogo, gLogo + 7], [0, 1], clamp));
	const logoBlur = interpolate(g, [gLogo, gLogo + 6], [24, 0], clamp);
	const shine = interpolate(g, [gLogo + 4, gLogo + 24], [-30, 130], clamp);
	const sk = shake(g, gLogo, 9, 0.1, 'logo');
	const fadeOut = interpolate(g, [dur - 9, dur], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<World
				s={{
					cam: {x: sk.x, y: 1.35 + sk.y, z: camZ, hy, f: 1900},
					carpet: 1,
					flags: 1,
					flagMinZ: 15,
					guards: () => ({up: 1, raise: 1}),
					cup: {z: 7.6, lift: 0, squash: 0, glow: 0.5},
					formations: [
						{id: 'f1', jets: V_FORMATION, start: [-300, 1300], end: [1450, -500], progress: interpolate(g, [0, 34], [0.05, 1], clamp), scale: 1.0, trail: 2100, trailOpacity: interpolate(g, [30, 48], [0.9, 0.2], clamp)},
						{id: 'f2', jets: V_FORMATION, start: [1250, 760], end: [-250, 330], progress: interpolate(g, [gLogo + 2, dur], [0, 1], clamp), scale: 0.36, trail: 1000},
					],
				}}
			/>
			{/* dark sky band behind the logo for legibility */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,24,0.7) 0%, rgba(8,10,24,0.35) 22%, rgba(8,10,24,0) 36%)'}} />
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 150,
					textAlign: 'center',
					fontFamily: LOGO_FONT,
					fontSize: 196,
					color: '#f2e3b3',
					opacity: logoIn > 0 ? Math.min(1, logoIn * 1.4) : 0,
					transform: `scale(${interpolate(logoIn, [0, 1], [1.6, 1])})`,
					filter: `blur(${logoBlur}px) drop-shadow(0 0 30px rgba(255,200,120,0.55)) drop-shadow(0 8px 20px rgba(0,0,0,0.6))`,
				}}
			>
				<span
					style={{
						backgroundImage: `linear-gradient(110deg, #f2e3b3 ${shine - 12}%, #fff9e8 ${shine}%, #f2e3b3 ${shine + 12}%)`,
						WebkitBackgroundClip: 'text',
						backgroundClip: 'text',
						color: 'transparent',
						display: 'inline-block',
						padding: '0.12em 0.2em 0.32em',
						lineHeight: 1.2,
					}}
				>
					Era Drip
				</span>
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 455,
					textAlign: 'center',
					direction: 'rtl',
					fontFamily: ARABIC_FONT,
					fontWeight: 800,
					fontSize: 92,
					opacity: interpolate(g, [gTag, gTag + 6], [0, 1], clamp),
					transform: `translateY(${interpolate(g, [gTag, gTag + 8], [30, 0], {...clamp, easing: easeOut})}px)`,
					filter: `blur(${interpolate(g, [gTag, gTag + 6], [12, 0], clamp)}px) drop-shadow(0 4px 14px rgba(0,0,0,0.7))`,
				}}
			>
				<span style={{backgroundImage: GOLD_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
					فخرنا في كل كوب
				</span>
			</div>
			<AbsoluteFill style={{background: '#000', opacity: fadeOut}} />
		</AbsoluteFill>
	);
};
