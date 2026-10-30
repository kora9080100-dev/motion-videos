import {Composition} from 'remotion';
import {EraDrip, TOTAL_FRAMES} from './EraDrip';

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="EraDrip"
			component={EraDrip}
			durationInFrames={TOTAL_FRAMES}
			fps={30}
			width={1080}
			height={1920}
		/>
	);
};
