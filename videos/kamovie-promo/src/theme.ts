import {loadFont} from '@remotion/fonts';
import {Easing, interpolate, staticFile} from 'remotion';

// Fonts are bundled in public/fonts so rendering works offline
export const arabic = 'Cairo';
export const wide = 'Michroma';

loadFont({
	family: arabic,
	url: staticFile('fonts/cairo-arabic.woff2'),
	weight: '200 1000',
	unicodeRange:
		'U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC',
});
loadFont({
	family: arabic,
	url: staticFile('fonts/cairo-latin.woff2'),
	weight: '200 1000',
	unicodeRange:
		'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
});
loadFont({
	family: wide,
	url: staticFile('fonts/michroma-latin.woff2'),
	weight: '400',
});

export const C = {
	burgundy: '#7A1220',
	burgundyLight: '#9C1E2E',
	burgundyDeep: '#4B0910',
	burgundyDark: '#22050A',
	cream: '#EEE6D8',
	creamDark: '#D9CDB8',
	ink: '#1A1212',
	gold: '#C9A04B',
	goldLight: '#EBD08A',
	goldDark: '#7D5A1E',
	teal: '#1F6B5C',
	mustard: '#D9A23A',
	navy: '#22355E',
};

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.7, 0, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

export const clamp = {
	extrapolateLeft: 'clamp',
	extrapolateRight: 'clamp',
} as const;

// Shorthand for a clamped, eased tween between two frames
export const tween = (
	frame: number,
	start: number,
	end: number,
	from: number,
	to: number,
	easing: (t: number) => number = easeOut,
) => interpolate(frame, [start, end], [from, to], {...clamp, easing});

// Deterministic pseudo random in [0, 1)
export const rnd = (i: number) => {
	const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
	return x - Math.floor(x);
};
