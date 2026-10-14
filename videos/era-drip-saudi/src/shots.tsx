import React from 'react';
import {Ceremony, Finale, FlagCloseup, JetsOverhead} from './scenes/Ceremony';
import {Emblem} from './scenes/Emblem';
import {FalconFlag} from './scenes/FalconFlag';
import {ShotSpec} from './scenes/Footage';
import {T} from './theme';

// Everything after the opening, as one list of shots (absolute frames).
export const SHOTS: ShotSpec[] = [
	// barista hero, out of the coffee dive
	{from: T.barista, to: T.falcon, clip: 'cup', start: 0.4, pos: '63% 50%', zoom: [1.3, 1.16], origin: '58% 45%', enter: 'zoom', exit: 'whipUp'},
	{from: T.falcon, to: T.prep, render: () => <FalconFlag />, enter: 'whipUp'},
	// preparation, speeding up into the glow
	{from: 86, to: 103, clip: 'grinder', start: 1.2, speeds: [[17, 1.5]], pos: '38% 50%', zoom: [1.3, 1.12], exit: 'whipL'},
	{from: 103, to: 119, clip: 'pour', start: 0.6, speeds: [[16, 1.3]], zoom: [1.18, 1.05], origin: '50% 45%', enter: 'whipL', exit: 'zoom'},
	{from: 119, to: 134, clip: 'matcha', start: 0.4, speeds: [[15, 1.25]], zoom: [1.25, 1.08], origin: '50% 55%', enter: 'zoom', exit: 'whipR'},
	{from: 134, to: T.emblem, clip: 'closeup', start: 3.4, speeds: [[16, 0.8]], pos: '46% 50%', zoom: [1.1, 1.32], origin: '52% 66%', enter: 'whipR', glow: {x: 560, y: 1280, from: 3}},
	{from: T.emblem, to: T.hands, render: () => <Emblem />},
	// the hand-over at the window, in the silence
	{from: T.hands, to: T.ceremony, clip: 'pov', start: 0.45, speeds: [[31, 0.85]], zoom: [1.12, 1.02], punch: [21], exit: 'zoom'},
	{from: T.ceremony, to: T.montage, render: () => <Ceremony />},
	// drop montage, one cut per beat
	{from: 307, to: 325, clip: 'closeup', start: 2.25, speeds: [[18, 0.75]], pos: '44% 50%', zoom: [1.22, 1.1], enter: 'flash', exit: 'whipL', word: {text: 'بكل'}},
	{from: 325, to: 343, clip: 'cup', start: 0.6, pos: '63% 50%', zoom: [1.12, 1.3], origin: '58% 60%', enter: 'whipL', exit: 'whipUp', word: {text: 'فخر', size: 240}},
	{from: 343, to: 360, render: (f, d) => <FlagCloseup f={f} dur={d} />, enter: 'whipUp', exit: 'zoom', word: {text: 'سعودي', size: 220, top: 1440}},
	{from: 360, to: 378, clip: 'team', start: 8.9, speeds: [[18, 0.9]], pos: '50% 40%', zoom: [1.25, 1.12], origin: '45% 32%', enter: 'zoom', exit: 'whipR'},
	{from: 378, to: 396, clip: 'pov', start: 2.9, speeds: [[18, 1.2]], zoom: [1.15, 1.05], enter: 'whipR', exit: 'whipDown'},
	{from: 396, to: 413, clip: 'pov', start: 5.3, zoom: [1.1, 1.22], origin: '40% 70%', enter: 'whipDown', exit: 'zoom'},
	{from: 413, to: 431, clip: 'beans', start: 3.5, speeds: [[18, 1.3]], zoom: [1.3, 1.12], origin: '50% 45%', enter: 'zoom', exit: 'whipL', word: {text: 'من الحبة', size: 170}},
	{from: 431, to: 449, clip: 'mural', start: 1.4, speeds: [[18, 1.1]], zoom: [1.1, 1.25], origin: '55% 55%', enter: 'whipL', exit: 'whipUp', word: {text: 'لين الكوب', size: 170}},
	{from: 449, to: T.finale, render: (f, d) => <JetsOverhead f={f} dur={d} />, enter: 'whipUp', exit: 'whipDown'},
	{from: T.finale, to: T.end, render: () => <Finale />, enter: 'whipDown'},
];
