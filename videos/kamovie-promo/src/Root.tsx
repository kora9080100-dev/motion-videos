import {Composition, Folder} from 'remotion';
import {KamoviePromo, SCENES, TOTAL_FRAMES} from './KamoviePromo';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="KamoviePromo" component={KamoviePromo} width={1080} height={1920} fps={30} durationInFrames={TOTAL_FRAMES} />
		<Folder name="Scenes">
			{SCENES.map((s) => (
				<Composition key={s.id} id={s.id} component={s.component} width={1080} height={1920} fps={30} durationInFrames={s.duration} />
			))}
		</Folder>
	</>
);
