import React from 'react';
import {Composition} from 'remotion';
import {EraDrip} from './EraDrip';
import {FPS, HEIGHT, T, WIDTH} from './theme';

export const Root: React.FC = () => (
	<Composition
		id="EraDrip"
		component={EraDrip}
		durationInFrames={T.end}
		fps={FPS}
		width={WIDTH}
		height={HEIGHT}
		defaultProps={{withSfx: true}}
	/>
);
