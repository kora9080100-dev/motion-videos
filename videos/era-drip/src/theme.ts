export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Timeline mirrors the reference video's cut points (in frames @30fps)
export const T = {
	chatWide: 157, // 5.23s  — camera pulls back to show the whole chat
	reply: 380, // 12.67s — close-up on the customer's reply
	montage: 502, // 16.73s — beat drop, fast cuts
	logo: 977, // 32.57s — logo reveal
	end: 1126, // 37.53s
};

export const C = {
	bg: '#0b0b0c',
	sent: '#1f6e4a',
	sentGlow: 'rgba(60, 200, 120, 0.35)',
	received: '#3a3e41',
	text: '#f5f7f5',
	time: 'rgba(235, 245, 238, 0.7)',
	tickRead: '#53bdeb',
	brandBrown: '#5b3a2e',
	brandCream: '#f2e3b3',
	caramel: '#c8873a',
	amber: '#e0a458',
};

export const ARABIC_FONT = 'Cairo';
export const LOGO_FONT = 'Coiny';
