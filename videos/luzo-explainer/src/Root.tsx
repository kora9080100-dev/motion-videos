import { Composition, Folder } from "remotion";
import { LuzoExplainer, SCENES, TOTAL_FRAMES } from "./LuzoExplainer";
import { FPS } from "./theme";

// 9:16 للتيك توك والريلز (1080×1920، 30 فريم)
export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="LuzoExplainer-Scenes">
      {SCENES.map((s) => (
        <Composition key={s.id} id={s.id} component={s.component} width={1080} height={1920} fps={FPS} durationInFrames={s.duration} />
      ))}
    </Folder>
    <Composition id="LuzoExplainer" component={LuzoExplainer} width={1080} height={1920} fps={FPS} durationInFrames={TOTAL_FRAMES} />
  </>
);
