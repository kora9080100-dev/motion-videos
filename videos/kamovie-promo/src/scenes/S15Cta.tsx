import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Center, Drift, MaskUp, Reveal, Sfx} from '../components/anim';
import {LogoMark, Wordmark} from '../components/graphics';
import {arabic, C, tween} from '../theme';

// Call to action: "راسلني الحين" + logo + كموفي / KAMOVIE + "+50 فيديو"
export const S15Cta: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const logo = spring({frame: frame - 14, fps, config: {damping: 10, stiffness: 160}});

	return (
		<AbsoluteFill style={{background: C.cream}}>
			<Drift from={1.02} to={1}>
				<Center y={600}>
					<Reveal at={2} dur={14} from={{y: 30, scale: 1.2, blur: 24}}>
						<div style={{fontFamily: arabic, fontWeight: 900, fontSize: 140, color: C.ink, lineHeight: 1.3}}>راسلني الحين</div>
					</Reveal>
				</Center>

				<Center y={890}>
					<div style={{scale: logo, rotate: `${(1 - logo) * -60}deg`, filter: 'drop-shadow(0 24px 36px rgba(122,18,32,0.35))'}}>
						<LogoMark size={230} bg={C.burgundy} />
					</div>
				</Center>

				<Center y={1170}>
					<MaskUp at={22} dur={14}>
						<div style={{fontFamily: arabic, fontWeight: 900, fontSize: 210, color: C.burgundy, lineHeight: 1.15}}>كموفي</div>
					</MaskUp>
				</Center>

				<Center y={1370}>
					<div style={{opacity: tween(frame, 32, 44, 0, 1), scale: tween(frame, 32, 50, 1.2, 1), filter: `blur(${tween(frame, 32, 44, 8, 0)}px)`}}>
						<Wordmark size={52} color={C.ink} spacing={0.42} />
					</div>
				</Center>

				<Center y={1530}>
					<Reveal at={44} dur={12} from={{y: 30, scale: 0.9, blur: 10}}>
						<div
							style={{
								border: `5px solid ${C.burgundy}`,
								borderRadius: 60,
								padding: '4px 44px 16px',
								fontFamily: arabic,
								fontWeight: 900,
								fontSize: 60,
								color: C.burgundy,
								lineHeight: 1.4,
								whiteSpace: 'nowrap',
							}}
						>
							<span style={{direction: 'ltr', unicodeBidi: 'isolate'}}>+50</span> فيديو موشن جرافيك
						</div>
					</Reveal>
				</Center>
			</Drift>

			<Sfx name="impact" at={3} volume={0.7} />
			<Sfx name="ding" at={15} volume={0.45} />
			<Sfx name="whoosh" at={22} volume={0.4} />
			<Sfx name="pop" at={45} volume={0.5} />
		</AbsoluteFill>
	);
};
