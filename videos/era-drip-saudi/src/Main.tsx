import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Grain, Vignette} from './components/Common';
import {loadFonts} from './fonts';
import {ShotList} from './scenes/Footage';
import {Opening} from './scenes/Opening';
import {SHOTS} from './shots';
import {Soundtrack} from './Sfx';
import {T} from './theme';

loadFonts();

export const EraDripSaudi: React.FC<{audio: 'sfx' | 'music'}> = ({audio}) => (
	<AbsoluteFill style={{background: '#000'}}>
		<Sequence durationInFrames={T.barista}>
			<Opening />
		</Sequence>
		<ShotList shots={SHOTS} offset={0} />
		<Vignette strength={0.45} />
		<Grain opacity={0.07} />
		<Soundtrack mode={audio} />
	</AbsoluteFill>
);
