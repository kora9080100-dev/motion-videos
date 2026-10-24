import React from 'react';
import {AbsoluteFill} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {Grain} from './components/anim';
import {S01Hook} from './scenes/S01Hook';
import {S02Chat, SEND} from './scenes/S02Chat';
import {S03Intro} from './scenes/S03Intro';
import {S04NotTalk} from './scenes/S04NotTalk';
import {S05Counter} from './scenes/S05Counter';
import {S06Collage} from './scenes/S06Collage';
import {S07NotNumber} from './scenes/S07NotNumber';
import {S08Frame} from './scenes/S08Frame';
import {S09Goal} from './scenes/S09Goal';
import {S10Desk} from './scenes/S10Desk';
import {S11Process} from './scenes/S11Process';
import {S12Feed} from './scenes/S12Feed';
import {S13Timeline} from './scenes/S13Timeline';
import {S14Wall} from './scenes/S14Wall';
import {S15Cta} from './scenes/S15Cta';
import {blurZoom, MotionBlurDefs, whip, zoomThrough} from './transitions';

export const SCENES = [
	{id: 'S01-Hook', component: S01Hook, duration: 80},
	{id: 'S02-Chat', component: S02Chat, duration: 82},
	{id: 'S03-Intro', component: S03Intro, duration: 90},
	{id: 'S04-NotTalk', component: S04NotTalk, duration: 60},
	{id: 'S05-Counter', component: S05Counter, duration: 100},
	{id: 'S06-Collage', component: S06Collage, duration: 90},
	{id: 'S07-NotNumber', component: S07NotNumber, duration: 65},
	{id: 'S08-Frame', component: S08Frame, duration: 80},
	{id: 'S09-Goal', component: S09Goal, duration: 65},
	{id: 'S10-Desk', component: S10Desk, duration: 95},
	{id: 'S11-Process', component: S11Process, duration: 100},
	{id: 'S12-Feed', component: S12Feed, duration: 80},
	{id: 'S13-Timeline', component: S13Timeline, duration: 70},
	{id: 'S14-Wall', component: S14Wall, duration: 75},
	{id: 'S15-Cta', component: S15Cta, duration: 105},
];

// Transition after each scene (same order as SCENES, one fewer)
const TRANSITIONS = [
	{presentation: whip('left'), frames: 10},
	{presentation: zoomThrough(SEND), frames: 16},
	{presentation: blurZoom(), frames: 12},
	{presentation: whip('up'), frames: 10},
	{presentation: zoomThrough({x: 540, y: 930}), frames: 14},
	{presentation: whip('right'), frames: 10},
	{presentation: whip('up'), frames: 10},
	{presentation: zoomThrough({x: 540, y: 624}), frames: 14},
	{presentation: whip('left'), frames: 10},
	{presentation: blurZoom(), frames: 12},
	{presentation: whip('up'), frames: 10},
	{presentation: zoomThrough({x: 305, y: 950}), frames: 14},
	{presentation: blurZoom(), frames: 12},
	{presentation: blurZoom(), frames: 14},
];

export const TOTAL_FRAMES =
	SCENES.reduce((sum, s) => sum + s.duration, 0) - TRANSITIONS.reduce((sum, t) => sum + t.frames, 0);

export const KamoviePromo: React.FC = () => (
	<AbsoluteFill style={{background: '#000'}}>
		<MotionBlurDefs />
		<TransitionSeries>
			{SCENES.map((s, i) => {
				const Scene = s.component;
				const t = TRANSITIONS[i];
				return (
					<React.Fragment key={s.id}>
						<TransitionSeries.Sequence name={s.id} durationInFrames={s.duration}>
							<Scene />
						</TransitionSeries.Sequence>
						{t ? (
							<TransitionSeries.Transition
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								presentation={t.presentation as any}
								timing={linearTiming({durationInFrames: t.frames})}
							/>
						) : null}
					</React.Fragment>
				);
			})}
		</TransitionSeries>
		<Grain opacity={0.1} />
	</AbsoluteFill>
);
