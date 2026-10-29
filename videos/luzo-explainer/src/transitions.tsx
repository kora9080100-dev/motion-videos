import React from "react";
import { AbsoluteFill } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";

type Kind = "zoom" | "zoomOut" | "whip" | "blur";
type Props = { kind: Kind };

// انتقالات المرجع: الكاميرا تدخل داخل العنصر (zoom)، أو سحبة سريعة بضبابية (whip)، أو ذوبان بضبابية
const Presentation: React.FC<TransitionPresentationComponentProps<Props>> = ({ children, presentationDirection, presentationProgress: p, passedProps }) => {
  const entering = presentationDirection === "entering";
  const k = passedProps.kind;
  let style: React.CSSProperties = {};
  if (k === "zoom") {
    style = entering
      ? { scale: 0.55 + 0.45 * p, opacity: p, filter: `blur(${(1 - p) * 18}px)` }
      : { scale: 1 + 1.4 * p, opacity: 1 - p, filter: `blur(${p * 22}px)` };
  } else if (k === "zoomOut") {
    style = entering
      ? { scale: 1.6 - 0.6 * p, opacity: p, filter: `blur(${(1 - p) * 16}px)` }
      : { scale: 1 - 0.4 * p, opacity: 1 - p, filter: `blur(${p * 16}px)` };
  } else if (k === "whip") {
    style = entering
      ? { translate: `${(1 - p) * -100}% 0`, filter: `blur(${(1 - p) * 28}px)` }
      : { translate: `${p * 100}% 0`, filter: `blur(${p * 28}px)` };
  } else {
    style = entering ? { opacity: p, filter: `blur(${(1 - p) * 20}px)` } : { opacity: 1 - p, filter: `blur(${p * 20}px)` };
  }
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const move = (kind: Kind): TransitionPresentation<Props> => ({ component: Presentation, props: { kind } });
