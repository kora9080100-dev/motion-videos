import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Drift, Sfx, Vignette} from '../components/anim';
import {LogoMark, PlayIcon} from '../components/graphics';
import {arabic, C, tween} from '../theme';

const Keyboard: React.FC = () => (
	<div style={{width: 500, height: 180, background: '#F2F0EC', borderRadius: 18, padding: 14, boxSizing: 'border-box', display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 6, boxShadow: '0 20px 30px rgba(0,0,0,0.35)'}}>
		{Array.from({length: 52}, (_, i) => (
			<div key={i} style={{background: '#FFFFFF', borderRadius: 5, boxShadow: '0 2px 0 #CFCBC4'}} />
		))}
	</div>
);

const Phone: React.FC = () => (
	<div style={{width: 250, height: 500, background: '#111', borderRadius: 40, padding: 12, boxSizing: 'border-box', boxShadow: '0 24px 40px rgba(0,0,0,0.4)'}}>
		<div style={{width: '100%', height: '100%', borderRadius: 30, background: `radial-gradient(circle at 50% 40%, ${C.burgundyLight}, ${C.burgundyDeep})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<LogoMark size={130} />
		</div>
	</div>
);

const Polaroid: React.FC = () => (
	<div style={{width: 260, height: 300, background: '#FAF8F4', padding: '16px 16px 60px', boxSizing: 'border-box', boxShadow: '0 18px 30px rgba(0,0,0,0.35)'}}>
		<div style={{width: '100%', height: '100%', background: `linear-gradient(160deg, ${C.teal}, #0E2E28)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<PlayIcon size={90} color={C.cream} />
		</div>
	</div>
);

const Mouse: React.FC = () => (
	<div style={{width: 130, height: 200, background: '#F5F3EF', borderRadius: '65px 65px 60px 60px', boxShadow: '0 18px 26px rgba(0,0,0,0.35)', position: 'relative'}}>
		<div style={{position: 'absolute', left: 64, top: 0, width: 2, height: 80, background: '#CFCBC4'}} />
	</div>
);

const Marker: React.FC = () => (
	<div style={{width: 300, height: 52, borderRadius: 26, background: `linear-gradient(180deg, #3A8F7E, ${C.teal})`, boxShadow: '0 14px 20px rgba(0,0,0,0.35)', position: 'relative'}}>
		<div style={{position: 'absolute', right: -40, top: 10, width: 60, height: 32, borderRadius: '0 16px 16px 0', background: '#1A1A1A'}} />
	</div>
);

const Cup: React.FC = () => (
	<div style={{width: 190, height: 190, borderRadius: '50%', background: '#F4F1EC', boxShadow: '0 18px 28px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
		<div style={{width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, #8A5A35, #4A2A14)'}} />
	</div>
);

const Toggle: React.FC<{on: number}> = ({on}) => (
	<div style={{width: 150, height: 80, borderRadius: 40, background: on > 0.5 ? '#4FB04A' : '#BDB6AA', padding: 8, boxSizing: 'border-box', boxShadow: '0 10px 18px rgba(0,0,0,0.3)'}}>
		<div style={{width: 64, height: 64, borderRadius: 32, background: '#FFF', translate: `${on * 70}px 0`}} />
	</div>
);

type Item = {el: React.ReactNode; x: number; y: number; r: number; from: [number, number]; at: number};

type Sticker = {text: string; bg: string; fg: string; y: number; r: number; at: number; size: number};

const STICKERS: Sticker[] = [
	{text: 'أكتب السكربت', bg: C.ink, fg: C.cream, y: 640, r: -6, at: 18, size: 96},
	{text: 'أصمّم المشاهد', bg: C.burgundyDeep, fg: C.cream, y: 880, r: 4, at: 34, size: 96},
	{text: 'وأحرّكها بإيقاع', bg: C.cream, fg: C.ink, y: 1120, r: -3, at: 50, size: 92},
];

// Burgundy cutting mat seen from above, desk props slide in, task stickers slap down
export const S10Desk: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const toggle = tween(frame, 66, 72, 0, 1);

	const items: Item[] = [
		{el: <Keyboard />, x: -60, y: 90, r: -14, from: [-700, -300], at: 0},
		{el: <Polaroid />, x: 760, y: 120, r: 9, from: [500, -500], at: 3},
		{el: <Cup />, x: 40, y: 1350, r: 0, from: [-500, 300], at: 6},
		{el: <Phone />, x: 790, y: 1290, r: 16, from: [500, 600], at: 4},
		{el: <Mouse />, x: 900, y: 460, r: -12, from: [500, 0], at: 8},
		{el: <Marker />, x: 300, y: 1680, r: -20, from: [-200, 500], at: 10},
		{el: <Toggle on={toggle} />, x: 70, y: 470, r: -8, from: [-500, 0], at: 12},
	];

	return (
		<AbsoluteFill style={{background: '#861522', overflow: 'hidden'}}>
			<Drift from={1.04} to={1.12} rotate={-2.5}>
				<AbsoluteFill
					style={{
						backgroundImage:
							'linear-gradient(rgba(238,230,216,0.22) 2px, transparent 2px), linear-gradient(90deg, rgba(238,230,216,0.22) 2px, transparent 2px), linear-gradient(rgba(238,230,216,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(238,230,216,0.08) 1px, transparent 1px)',
						backgroundSize: '360px 360px, 360px 360px, 72px 72px, 72px 72px',
						backgroundPosition: '-20px -20px',
					}}
				/>
				{items.map((it, i) => {
					const p = spring({frame: frame - it.at, fps, config: {damping: 16, stiffness: 110}});
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: it.x,
								top: it.y,
								rotate: `${it.r + (1 - p) * 20}deg`,
								translate: `${interpolate(p, [0, 1], [it.from[0], 0])}px ${interpolate(p, [0, 1], [it.from[1], 0])}px`,
							}}
						>
							{it.el}
						</div>
					);
				})}

				{STICKERS.map((s, i) => {
					const p = spring({frame: frame - s.at, fps, config: {damping: 12, stiffness: 260, mass: 0.6}});
					return (
						<div key={i} style={{position: 'absolute', left: 0, right: 0, top: s.y, display: 'flex', justifyContent: 'center', translate: '0 -50%'}}>
							<div
								style={{
									background: s.bg,
									color: s.fg,
									fontFamily: arabic,
									fontWeight: 900,
									fontSize: s.size,
									lineHeight: 1.25,
									padding: '4px 44px 22px',
									direction: 'rtl',
									whiteSpace: 'nowrap',
									rotate: `${s.r + (1 - p) * 10}deg`,
									scale: interpolate(p, [0, 1], [1.6, 1]),
									opacity: frame >= s.at ? Math.min(1, (frame - s.at) / 3) : 0,
									boxShadow: `0 ${interpolate(p, [0, 1], [50, 16])}px ${interpolate(p, [0, 1], [60, 24])}px rgba(0,0,0,0.4)`,
								}}
							>
								{s.text}
							</div>
						</div>
					);
				})}
			</Drift>
			<Vignette strength={0.45} />

			<Sfx name="whoosh" at={0} volume={0.4} />
			{STICKERS.map((s) => (
				<Sfx key={s.at} name="slap" at={s.at + 2} volume={0.8} />
			))}
			<Sfx name="click" at={66} volume={0.7} />
		</AbsoluteFill>
	);
};
