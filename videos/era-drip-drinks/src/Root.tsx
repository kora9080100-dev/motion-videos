import { Composition } from "remotion";
import { DURATION_IN_FRAMES, EraDripDrinks } from "./EraDripDrinks";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="EraDripDrinks"
      component={EraDripDrinks}
      durationInFrames={DURATION_IN_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
