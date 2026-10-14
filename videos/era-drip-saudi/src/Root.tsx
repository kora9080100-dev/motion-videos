import React from 'react';
import {Composition} from 'remotion';
import {EraDripSaudi} from './Main';
import {FPS, H, T, W} from './theme';

export const Root: React.FC = () => (
	<>
		<Composition
			id="EraDripSaudi"
			component={EraDripSaudi}
			durationInFrames={T.end}
			fps={FPS}
			width={W}
			height={H}
			defaultProps={{audio: 'sfx' as const}}
		/>
		<Composition
			id="EraDripSaudiMusic"
			component={EraDripSaudi}
			durationInFrames={T.end}
			fps={FPS}
			width={W}
			height={H}
			defaultProps={{audio: 'music' as const}}
		/>
	</>
);
