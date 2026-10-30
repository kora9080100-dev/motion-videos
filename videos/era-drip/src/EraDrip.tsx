import React from 'react';
import {
	AbsoluteFill,
	Audio,
	interpolate,
	OffthreadVideo,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

// Three stacked 16:9-ish strips like the reference, split by thin black lines.
const W = 1080;
const H = 1920;
const GAP = 6;
const PANEL_H = (H - GAP * 2) / 3;

// The pour shots are framed tall, so their page uses a 2x2 grid of portrait cells
// that shows each clip whole instead of cropping it into a strip.
const CELL_W = (W - GAP) / 2;
const CELL_H = (H - GAP) / 2;

// Source clips are 464x832 portrait (top-down ones get rotated to landscape).
const SRC_ASPECT = 464 / 832;

type Shot = {
	src: string;
	// Seconds into the source clip where the panel starts.
	from: number;
	// Vertical focus for portrait clips cropped into a landscape strip (0 = top, 1 = bottom).
	focus?: number;
	// Rotate top-down portrait clips so they fill the strip without cropping.
	rotate?: 90 | -90;
	// Slow a clip down to stay on the best part of the take.
	rate?: number;
};

type Page =
	| {frames: number; layout: 'strips'; shots: [Shot, Shot, Shot]}
	| {frames: number; layout: 'grid'; shots: [Shot, Shot, Shot, Shot]};

const PAGES: Page[] = [
	{
		frames: 87,
		layout: 'strips',
		shots: [
			{src: 'clips/tin-slide.mp4', from: 0.55, rotate: -90},
			{src: 'clips/counter.mp4', from: 0, focus: 0.15},
			{src: 'clips/cup-slide.mp4', from: 1.3},
		],
	},
	{
		frames: 96,
		layout: 'strips',
		shots: [
			{src: 'clips/tin-spoon.mp4', from: 1.6, rotate: 90},
			{src: 'clips/counter.mp4', from: 2.9, focus: 0.92},
			{src: 'clips/window.mp4', from: 0.8, focus: 0.67},
		],
	},
	{
		frames: 87,
		layout: 'grid',
		shots: [
			{src: 'clips/pour-cup.mp4', from: 0.8},
			{src: 'clips/pour-hand.mp4', from: 0, rate: 0.8},
			{src: 'clips/v60.mp4', from: 1.0},
			{src: 'clips/mural.mp4', from: 0.5},
		],
	},
];

export const TOTAL_FRAMES = PAGES.reduce((sum, p) => sum + p.frames, 0);

// Warm golden grade to match the reference's sunlit orange look.
const GRADE = 'sepia(0.3) saturate(1.65) contrast(1.12) brightness(0.97)';

const Panel: React.FC<{
	shot: Shot;
	frames: number;
	width: number;
	height: number;
	zoom: [number, number];
}> = ({shot, frames, width, height, zoom}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const push = interpolate(frame, [0, frames], zoom);

	const videoStyle: React.CSSProperties = {
		width: '100%',
		height: '100%',
		objectFit: 'cover',
		objectPosition: `50% ${(shot.focus ?? 0.5) * 100}%`,
		filter: GRADE,
	};

	const video = (
		<OffthreadVideo
			src={staticFile(shot.src)}
			trimBefore={Math.round(shot.from * fps)}
			playbackRate={shot.rate ?? 1}
			muted
			style={videoStyle}
		/>
	);

	const innerW = height;
	const innerH = Math.ceil(height / SRC_ASPECT);

	return (
		<div
			style={{
				position: 'relative',
				width,
				height,
				overflow: 'hidden',
				background: '#000',
			}}
		>
			<AbsoluteFill style={{transform: `scale(${push})`}}>
				{shot.rotate ? (
					<div
						style={{
							position: 'absolute',
							width: innerW,
							height: innerH,
							left: (width - innerW) / 2,
							top: (height - innerH) / 2,
							transform: `rotate(${shot.rotate}deg)`,
						}}
					>
						{video}
					</div>
				) : (
					video
				)}
			</AbsoluteFill>
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(160deg, rgba(255,170,60,0.55), rgba(230,110,20,0.45))',
					mixBlendMode: 'soft-light',
				}}
			/>
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,10,0,0.38) 100%)',
				}}
			/>
		</div>
	);
};

const Grain: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: 0.09, mixBlendMode: 'overlay'}}>
			<svg width="100%" height="100%">
				<filter id="grain">
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.9"
						numOctaves="2"
						seed={frame % 12}
						stitchTiles="stitch"
					/>
				</filter>
				<rect width="100%" height="100%" filter="url(#grain)" />
			</svg>
		</AbsoluteFill>
	);
};

export const EraDrip: React.FC = () => {
	const {fps} = useVideoConfig();
	let start = 0;

	return (
		<AbsoluteFill style={{background: '#000'}}>
			{PAGES.map((page) => {
				const from = start;
				start += page.frames;
				const isGrid = page.layout === 'grid';
				return (
					<Sequence key={from} from={from} durationInFrames={page.frames}>
						<AbsoluteFill
							style={{
								flexDirection: isGrid ? 'row' : 'column',
								flexWrap: 'wrap',
								alignContent: 'space-between',
								justifyContent: 'space-between',
							}}
						>
							{page.shots.map((shot) => (
								<Panel
									key={shot.src}
									shot={shot}
									frames={page.frames}
									width={isGrid ? CELL_W : W}
									height={isGrid ? CELL_H : PANEL_H}
									zoom={isGrid ? [1, 1.03] : [1.02, 1.08]}
								/>
							))}
						</AbsoluteFill>
					</Sequence>
				);
			})}
			<Grain />
			<Audio
				src={staticFile('music.m4a')}
				volume={(f) =>
					interpolate(f, [TOTAL_FRAMES - 0.4 * fps, TOTAL_FRAMES], [1, 0], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					})
				}
			/>
		</AbsoluteFill>
	);
};
