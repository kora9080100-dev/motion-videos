import React from 'react';
import {AbsoluteFill, random, Sequence, useCurrentFrame} from 'remotion';
import {Chat} from './Chat';
import {loadFonts} from './fonts';
import {Logo} from './Logo';
import {Montage} from './Montage';
import {Sfx} from './Sfx';
import {T} from './theme';

loadFonts();

const Grain: React.FC = () => {
	const frame = useCurrentFrame();
	const seed = Math.floor(random(`grain-${frame}`) * 1000);
	return (
		<AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<svg width="100%" height="100%">
				<filter id="grain">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#grain)" />
			</svg>
		</AbsoluteFill>
	);
};

export const EraDrip: React.FC<{withSfx?: boolean}> = ({withSfx = true}) => (
	<AbsoluteFill style={{background: '#000'}}>
		<Sequence durationInFrames={T.montage}>
			<Chat />
		</Sequence>
		<Sequence from={T.montage} durationInFrames={T.logo - T.montage}>
			<Montage />
		</Sequence>
		<Sequence from={T.logo} durationInFrames={T.end - T.logo}>
			<Logo />
		</Sequence>
		<Grain />
		{withSfx ? <Sfx /> : null}
	</AbsoluteFill>
);
