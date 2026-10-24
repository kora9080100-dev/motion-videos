import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Drift, Reveal, Sfx, Vignette} from '../components/anim';
import {GoldFrame} from '../components/graphics';
import {Thumb, ThumbKind} from '../components/thumbs';
import {arabic, C, clamp} from '../theme';

const SIDE_FRAMES: {x: number; y: number; w: number; h: number; kind: ThumbKind}[] = [
	{x: -150, y: 150, w: 300, h: 380, kind: 'perfume'},
	{x: 900, y: 120, w: 320, h: 260, kind: 'build'},
	{x: -170, y: 1420, w: 340, h: 300, kind: 'food'},
	{x: 910, y: 1380, w: 300, h: 400, kind: 'brand'},
];

const LINES = [
	{text: 'إذا', size: 110, at: 6},
	{text: 'مشروعك', size: 160, at: 14},
	{text: 'جاهز', size: 160, at: 24},
	{text: 'يلفت الأنظار…', size: 104, at: 36},
];

// Gallery wall: a big gold frame holds "إذا مشروعك جاهز يلفت الأنظار…", a shadow walks past
export const S14Wall: React.FC = () => {
	const frame = useCurrentFrame();
	const shadowX = interpolate(frame, [0, 75], [1200, -500], clamp);

	return (
		<AbsoluteFill style={{background: '#3A0810', overflow: 'hidden'}}>
			<Drift from={1.02} to={1.1}>
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					<defs>
						<pattern id="damask" width="120" height="160" patternUnits="userSpaceOnUse">
							<path d="M60 10 C 80 40, 100 60, 60 80 C 20 60, 40 40, 60 10 Z M60 80 C 80 100, 100 120, 60 150 C 20 120, 40 100, 60 80 Z" fill="#4C0E18" />
							<circle cx="0" cy="80" r="10" fill="#4C0E18" />
							<circle cx="120" cy="80" r="10" fill="#4C0E18" />
						</pattern>
					</defs>
					<rect width="1080" height="1920" fill="url(#damask)" />
				</svg>

				{SIDE_FRAMES.map((f, i) => (
					<div key={i} style={{position: 'absolute', left: f.x, top: f.y, filter: 'brightness(0.55)'}}>
						<GoldFrame width={f.w} height={f.h} border={22}>
							<Thumb kind={f.kind} scale={f.w / 380} />
						</GoldFrame>
					</div>
				))}

				<div style={{position: 'absolute', left: 540 - 410, top: 960 - 520}}>
					<GoldFrame width={820} height={1040} border={32}>
						<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #6E1320, #2A050B 80%)'}} />
						<AbsoluteFill
							style={{
								direction: 'rtl',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'flex-start',
								justifyContent: 'center',
								padding: '0 60px',
							}}
						>
							{LINES.map((l, i) => (
								<Reveal key={i} at={l.at} dur={12} from={{y: 50, blur: 20, scale: 1.1}}>
									<div style={{fontFamily: arabic, fontWeight: 900, fontSize: l.size, color: C.cream, lineHeight: 1.3, whiteSpace: 'nowrap'}}>{l.text}</div>
								</Reveal>
							))}
						</AbsoluteFill>
					</GoldFrame>
				</div>
			</Drift>

			{/* Passing silhouette */}
			<svg
				width={700}
				height={1500}
				viewBox="0 0 70 150"
				style={{position: 'absolute', left: shadowX, top: 520, opacity: 0.55, filter: 'blur(26px)'}}
			>
				<ellipse cx="35" cy="22" rx="14" ry="17" fill="#0B0103" />
				<path d="M8 150 C 6 80, 12 50, 35 44 C 58 50, 64 80, 62 150 Z" fill="#0B0103" />
			</svg>

			<AbsoluteFill style={{background: 'radial-gradient(ellipse 50% 40% at 50% 45%, rgba(255,200,150,0.12), transparent 70%)'}} />
			<Vignette strength={0.65} />

			<Sfx name="swoosh-soft" at={0} volume={0.4} />
			{LINES.map((l) => (
				<Sfx key={l.at} name="pop" at={l.at} volume={0.3} />
			))}
			<Sfx name="riser" at={28} volume={0.6} />
		</AbsoluteFill>
	);
};
