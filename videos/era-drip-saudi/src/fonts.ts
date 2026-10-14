import {continueRender, delayRender, staticFile} from 'remotion';

const faces: [string, string, string][] = [
	['Cairo', 'fonts/Cairo-500.ttf', '500'],
	['Cairo', 'fonts/Cairo-700.ttf', '700'],
	['Cairo', 'fonts/Cairo-800.ttf', '800'],
	['Cairo', 'fonts/Cairo-900.ttf', '900'],
	['Coiny', 'fonts/Coiny.ttf', '400'],
];

let loaded = false;

export const loadFonts = () => {
	if (loaded || typeof document === 'undefined') return;
	loaded = true;
	const handle = delayRender('Loading fonts');
	Promise.all(
		faces.map(([family, file, weight]) => {
			const face = new FontFace(family, `url(${staticFile(file)})`, {weight});
			(document.fonts as unknown as Set<FontFace>).add(face);
			return face.load();
		}),
	)
		.then(() => continueRender(handle))
		.catch((err) => {
			console.error(err);
			continueRender(handle);
		});
};
