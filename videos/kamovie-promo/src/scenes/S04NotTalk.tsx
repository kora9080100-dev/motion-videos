import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Center, Drift, Sfx, Words} from '../components/anim';
import {arabic, C, tween} from '../theme';

// "واللي ورايّ" + black bar sliding in with "مو كلام"
export const S04NotTalk: React.FC = () => {
	const frame = useCurrentFrame();
	const bar = tween(frame, 18, 30, 0, 1);

	return (
		<AbsoluteFill style={{background: C.cream}}>
			<Drift from={1} to={1.08}>
				<Center y={820}>
					<Words text="واللي ورايّ" at={2} stagger={5} size={150} color={C.ink} />
				</Center>

				<Center y={1090}>
					<div style={{width: 880, height: 210, position: 'relative', rotate: '-2deg'}}>
						<div
							style={{
								position: 'absolute',
								right: 0,
								top: 0,
								height: '100%',
								width: `${bar * 100}%`,
								background: C.ink,
								overflow: 'hidden',
								boxShadow: '0 18px 30px rgba(0,0,0,0.25)',
							}}
						>
							<div
								style={{
									position: 'absolute',
									right: 0,
									top: 0,
									width: 880,
									height: '100%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontFamily: arabic,
									fontWeight: 900,
									fontSize: 150,
									color: C.cream,
									lineHeight: 1,
									direction: 'rtl',
									paddingBottom: 14,
									boxSizing: 'border-box',
								}}
							>
								مـو كـلام
							</div>
						</div>
					</div>
				</Center>
			</Drift>

			<Sfx name="swoosh-soft" at={2} volume={0.45} />
			<Sfx name="whip" at={18} volume={0.6} />
		</AbsoluteFill>
	);
};
