import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {clamp, easeIn, easeInOut, easeOut} from './theme';

// Camera dives into a point of the outgoing scene; the next scene opens from that point
type ZoomProps = {x: number; y: number};

const ZoomThrough: React.FC<TransitionPresentationComponentProps<ZoomProps>> = ({
	children,
	presentationDirection,
	presentationProgress: p,
	passedProps: {x, y},
}) => {
	if (presentationDirection === 'exiting') {
		const t = easeIn(p);
		return (
			<AbsoluteFill
				style={{
					transformOrigin: `${x}px ${y}px`,
					scale: interpolate(t, [0, 1], [1, 7]),
					filter: `blur(${interpolate(t, [0, 1], [0, 14])}px)`,
					opacity: interpolate(p, [0.55, 1], [1, 0], clamp),
				}}
			>
				{children}
			</AbsoluteFill>
		);
	}
	const t = easeOut(interpolate(p, [0.25, 1], [0, 1], clamp));
	return (
		<AbsoluteFill
			style={{
				clipPath: `circle(${interpolate(t, [0, 1], [0, 2300])}px at ${x}px ${y}px)`,
				transformOrigin: `${x}px ${y}px`,
				scale: interpolate(t, [0, 1], [1.5, 1]),
				filter: `blur(${interpolate(t, [0, 1], [10, 0])}px)`,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

export const zoomThrough = (props: ZoomProps): TransitionPresentation<ZoomProps> => ({
	component: ZoomThrough,
	props,
});

// Fast whip pan with directional motion blur
type WhipProps = {dir: 'left' | 'right' | 'up' | 'down'};

const blurLevels = [0, 12, 24, 40, 60];

export const MotionBlurDefs: React.FC = () => (
	<svg width="0" height="0" style={{position: 'absolute'}}>
		<defs>
			{blurLevels.slice(1).map((b) => (
				<React.Fragment key={b}>
					<filter id={`mbx-${b}`} x="-20%" y="-5%" width="140%" height="110%">
						<feGaussianBlur stdDeviation={`${b} 0`} />
					</filter>
					<filter id={`mby-${b}`} x="-5%" y="-20%" width="110%" height="140%">
						<feGaussianBlur stdDeviation={`0 ${b}`} />
					</filter>
				</React.Fragment>
			))}
		</defs>
	</svg>
);

const Whip: React.FC<TransitionPresentationComponentProps<WhipProps>> = ({
	children,
	presentationDirection,
	presentationProgress: p,
	passedProps: {dir},
}) => {
	const t = easeInOut(p);
	// Speed of the move, peaks mid-transition, picks the blur level
	const speed = Math.sin(Math.PI * p);
	const level = blurLevels[Math.min(blurLevels.length - 1, Math.round(speed * (blurLevels.length - 1)))];
	const horizontal = dir === 'left' || dir === 'right';
	const sign = dir === 'left' || dir === 'up' ? -1 : 1;
	const offset = presentationDirection === 'exiting' ? sign * t * 100 : sign * (t - 1) * 100;
	return (
		<AbsoluteFill
			style={{
				translate: horizontal ? `${offset}% 0` : `0 ${offset}%`,
				filter: level ? `url(#${horizontal ? 'mbx' : 'mby'}-${level})` : undefined,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

export const whip = (dir: WhipProps['dir']): TransitionPresentation<WhipProps> => ({
	component: Whip,
	props: {dir},
});

// Soft blur cross-zoom
const BlurZoom: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({
	children,
	presentationDirection,
	presentationProgress: p,
}) => {
	const t = easeInOut(p);
	if (presentationDirection === 'exiting') {
		return (
			<AbsoluteFill
				style={{
					scale: interpolate(t, [0, 1], [1, 1.25]),
					filter: `blur(${interpolate(t, [0, 1], [0, 26])}px)`,
					opacity: interpolate(t, [0.3, 1], [1, 0], clamp),
				}}
			>
				{children}
			</AbsoluteFill>
		);
	}
	return (
		<AbsoluteFill
			style={{
				scale: interpolate(t, [0, 1], [0.85, 1]),
				filter: `blur(${interpolate(t, [0, 1], [26, 0])}px)`,
				opacity: interpolate(t, [0, 0.6], [0, 1], clamp),
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

export const blurZoom = (): TransitionPresentation<Record<string, never>> => ({
	component: BlurZoom,
	props: {},
});
