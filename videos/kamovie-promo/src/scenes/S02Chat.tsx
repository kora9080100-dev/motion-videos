import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Center, Reveal, Sfx} from '../components/anim';
import {Cursor} from '../components/graphics';
import {arabic, C, clamp, easeInOut, tween} from '../theme';

const QUESTION = 'مين يصمم لي موشن يوقّف الناس؟';
const BOX = {left: 80, top: 860, width: 920, height: 260};
// Send button center; the next transition dives into this point
export const SEND = {x: BOX.left + 36 + 44, y: BOX.top + BOX.height - 34 - 44};

const TYPE_START = 14;
const TYPE_END = 50;

// AI chat box: the question gets typed and sent
export const S02Chat: React.FC = () => {
	const frame = useCurrentFrame();
	const chars = Array.from(QUESTION);
	const shown = Math.floor(interpolate(frame, [TYPE_START, TYPE_END], [0, chars.length], clamp));
	const typing = frame >= TYPE_START;
	const caretOn = Math.floor(frame / 8) % 2 === 0 || (frame > TYPE_START && frame < TYPE_END);
	const ready = frame >= TYPE_END;

	const cursorP = tween(frame, 50, 62, 0, 1, easeInOut);
	const press = frame >= 63 && frame < 67;
	const ripple = tween(frame, 63, 75, 0, 1);

	return (
		<AbsoluteFill style={{background: C.cream}}>
			<Center y={760}>
				<Reveal at={2} dur={14} from={{y: 20, scale: 1.05, blur: 12}}>
					<div style={{fontFamily: arabic, fontWeight: 700, fontSize: 60, color: '#3B3434', direction: 'rtl'}}>
						كيف أقدر أساعدك اليوم؟
					</div>
				</Reveal>
			</Center>

			<div
				style={{
					position: 'absolute',
					...BOX,
					borderRadius: 48,
					background: '#1E1B1B',
					boxShadow: '0 30px 60px rgba(40,20,20,0.25)',
					opacity: tween(frame, 0, 10, 0, 1),
					translate: `0 ${tween(frame, 0, 14, 60, 0)}px`,
					scale: tween(frame, 0, 14, 0.94, 1),
				}}
			>
				<div
					style={{
						position: 'absolute',
						top: 40,
						right: 48,
						left: 48,
						direction: 'rtl',
						fontFamily: arabic,
						fontWeight: 700,
						fontSize: 48,
						lineHeight: 1.3,
						color: typing ? C.cream : 'rgba(238,230,216,0.35)',
						whiteSpace: 'nowrap',
					}}
				>
					{typing ? chars.slice(0, shown).join('') : 'اسأل أي شي…'}
					<span style={{opacity: caretOn && !ready ? 1 : 0, color: C.cream, fontWeight: 400, marginRight: 4}}>|</span>
				</div>

				{/* Tools row */}
				<div
					style={{
						position: 'absolute',
						right: 40,
						bottom: 44,
						display: 'flex',
						alignItems: 'center',
						gap: 22,
						direction: 'rtl',
						color: 'rgba(238,230,216,0.6)',
						fontFamily: arabic,
						fontWeight: 600,
						fontSize: 34,
					}}
				>
					<div style={{width: 64, height: 64, borderRadius: 32, border: '3px solid rgba(238,230,216,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, lineHeight: 1}}>
						+
					</div>
					<span>أدوات</span>
				</div>

				{/* Send button */}
				<div
					style={{
						position: 'absolute',
						left: 36,
						bottom: 34,
						width: 88,
						height: 88,
						borderRadius: 44,
						background: ready ? C.burgundyLight : 'rgba(238,230,216,0.25)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						scale: press ? 0.86 : 1,
						boxShadow: `0 0 0 ${ripple * 70}px rgba(156,30,46,${0.35 * (1 - ripple)})`,
					}}
				>
					<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={C.cream} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
						<path d="M12 19 V5 M5 12 L12 5 L19 12" />
					</svg>
				</div>
			</div>

			<div
				style={{
					position: 'absolute',
					left: interpolate(cursorP, [0, 1], [900, SEND.x - 8]),
					top: interpolate(cursorP, [0, 1], [1600, SEND.y - 6]),
					opacity: tween(frame, 48, 52, 0, 1),
					scale: press ? 0.85 : 1,
				}}
			>
				<Cursor size={84} />
			</div>

			{Array.from({length: 9}, (_, i) => (
				<Sfx key={i} name="type" at={TYPE_START + i * 4} volume={0.45} />
			))}
			<Sfx name="click" at={63} volume={0.9} />
		</AbsoluteFill>
	);
};
