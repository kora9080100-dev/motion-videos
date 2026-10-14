import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';


// Saudi flag rippling in the wind. Built from vertical strips that each ride a
// travelling sine wave; the hoist (pole side) stays fixed and the fly end moves most.
// The artwork is never mirrored or rotated, so the Shahada always reads correctly.
export const WavingFlag: React.FC<{
	width: number;
	amp?: number;
	speed?: number;
	phase?: number;
	waves?: number;
	shade?: number;
	hoist?: 'left' | 'right';
}> = ({width, amp = 0.05, speed = 0.22, phase = 0, waves = 1.5, shade = 0.26, hoist = 'left'}) => {
	const frame = useCurrentFrame();
	const h = (width * 2) / 3;
	// enough strips that steps never show, fewer for small distant flags
	const STRIPS = Math.round(Math.min(96, Math.max(14, width / 5)));
	const sw = width / STRIPS;
	const t = frame * speed + phase;
	return (
		<div style={{position: 'relative', width, height: h}}>
			{Array.from({length: STRIPS}).map((_, i) => {
				const u = hoist === 'left' ? (i + 0.5) / STRIPS : 1 - (i + 0.5) / STRIPS;
				const k = u * waves * Math.PI * 2 - t;
				const reach = Math.pow(u, 0.85);
				const dy = Math.sin(k) * amp * h * reach;
				const slope = Math.cos(k) * reach;
				const squash = 1 - 0.05 * reach * Math.sin(k + 0.8);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: i * sw,
							top: 0,
							width: sw + 0.8,
							height: h,
							overflow: 'hidden',
							transform: `translateY(${dy}px) scaleY(${squash})`,
						}}
					>
						<Img
							src={staticFile('img/flag-sa.svg')}
							style={{position: 'absolute', left: -i * sw, top: 0, width, height: h, maxWidth: 'none'}}
						/>
						<div
							style={{
								position: 'absolute',
								inset: 0,
								background: slope > 0 ? '#fff' : '#000',
								opacity: Math.abs(slope) * (slope > 0 ? shade * 0.55 : shade),
							}}
						/>
					</div>
				);
			})}
		</div>
	);
};

// Flag on a polished pole with a golden finial. `poleHeight` is measured from the
// top of the flag down to the base of the pole.
export const FlagPole: React.FC<{
	width: number;
	poleHeight: number;
	amp?: number;
	speed?: number;
	phase?: number;
	waves?: number;
	hoist?: 'left' | 'right';
}> = ({width, poleHeight, hoist = 'left', ...rest}) => {
	const pw = Math.max(3, width * 0.035);
	const poleX = hoist === 'left' ? 0 : width + pw * 0.6;
	return (
		<div style={{position: 'relative', width: width + pw, height: poleHeight}}>
			<div
				style={{
					position: 'absolute',
					left: poleX,
					top: -pw * 1.6,
					width: pw,
					height: poleHeight + pw * 1.6,
					borderRadius: pw,
					background: 'linear-gradient(90deg, #6d6d6d 0%, #f4f4f4 35%, #a8a8a8 70%, #4d4d4d 100%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: poleX - pw * 0.45,
					top: -pw * 3.2,
					width: pw * 1.9,
					height: pw * 1.9,
					borderRadius: '50%',
					background: 'radial-gradient(circle at 35% 35%, #fff3c4, #d9a94a 55%, #7a4f16)',
				}}
			/>
			<div style={{position: 'absolute', left: hoist === 'left' ? pw * 0.8 : 0, top: 0}}>
				<WavingFlag width={width} hoist={hoist} {...rest} />
			</div>
		</div>
	);
};
