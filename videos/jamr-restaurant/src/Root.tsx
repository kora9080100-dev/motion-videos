import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { DURATION, FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Jamr"
    component={Video}
    durationInFrames={DURATION}
    fps={FPS}
    width={W}
    height={H}
  />
);
