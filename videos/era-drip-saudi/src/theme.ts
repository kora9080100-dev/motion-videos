import {Easing} from 'remotion';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

// Timeline locked to the reference track (frames @30fps).
// Kicks 0.20/0.79/1.38s, build-up, silence at 5.54s, break hits, drop at 9.2s,
// then a steady beat every ~0.59s.
export const T = {
	barista: 41,
	falcon: 59,
	prep: 86,
	emblem: 150,
	hands: 176,
	ceremony: 207,
	guards: 228,
	swords: 239,
	cupLand: 260,
	push: 270,
	drop: 276,
	montage: 307,
	finale: 466,
	logo: 502,
	tagline: 519,
	end: 554,
};

// Drop beats used by the montage cuts
export const BEATS = [307, 325, 343, 360, 378, 396, 413, 431, 449, 466];

export const C = {
	brown: '#3a221c',
	brownDeep: '#24140f',
	cupBrown: '#4b2d24',
	cream: '#f2e3b3',
	gold: '#d9a94a',
	goldLight: '#f6dc96',
	goldDeep: '#8a5a1c',
	green: '#006c35',
	greenLight: '#1f9a5a',
	purple: '#6b4f9e',
	purpleDeep: '#3f2c66',
	sky1: '#f6c27a',
	sky2: '#d98b52',
	sky3: '#3b4a6b',
};

export const ARABIC_FONT = 'Cairo';
export const LOGO_FONT = 'Coiny';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const backOut = Easing.out(Easing.back(1.6));

export const GOLD_GRADIENT = 'linear-gradient(180deg, #fff1c4 0%, #f2cf7a 38%, #c98f34 62%, #f4d98e 100%)';
