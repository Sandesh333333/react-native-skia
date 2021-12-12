import React from "react";
import {
  Canvas,
  Circle,
  vec,
  Fill,
  Paint,
  Skia,
  ShaderLib,
  useValue,
  useTouchHandler,
  BlurMask,
  canvas2Polar,
  polar2Canvas,
  color,
  TAU,
  normalizeRad,
} from "@shopify/react-native-skia";
import { Dimensions } from "react-native";

import { Shader } from "../../../../package/src/renderer/components/shaders/Shader";

import { polar2Color } from "./Color";

const { width, height } = Dimensions.get("window");
const c = vec(width / 2, height / 2);

const source = Skia.RuntimeEffect.Make(`
uniform float cx;
uniform float cy;
uniform float r;

${ShaderLib.Math}
${ShaderLib.Colors}

float quadraticIn(float t) {
  return t * t;
}

half4 main(vec2 uv) { 
  float2 c = vec2(cx, cy);
  float mag = distance(uv, c);
  float theta = normalizeRad(canvas2Polar(uv, c).x);
  return hsv2rgb(vec3(theta/TAU, quadraticIn(mag/r), 1.0));
}`)!;

export const Hue = () => {
  const r = (width - 32) / 2;
  const cl = useValue(color(255, 255, 255, 1));
  const translateX = useValue(c.x);
  const translateY = useValue(c.y);
  const isLight = useValue(false);
  const onTouch = useTouchHandler({
    onActive: (p) => {
      const { theta, radius } = canvas2Polar(p, c);
      const { x, y } = polar2Canvas({ theta, radius: Math.min(radius, r) }, c);
      translateX.value = x;
      translateY.value = y;
      console.log({
        theta: theta / TAU,
        radius: Math.min(radius, r) / r,
      });
      const rgb = polar2Color(normalizeRad(theta), Math.min(radius, r), r);
      cl.value = rgb.color;
      isLight.value = rgb.light;
    },
  });
  return (
    <Canvas style={{ flex: 1 }} onTouch={onTouch}>
      <Fill color="#1f1f1f" />
      <Paint>
        <BlurMask sigma={40} style="solid" />
        <Shader source={source} uniforms={[c.x, c.y, r]} />
      </Paint>
      <Circle c={c} r={r} />
      <Circle
        r={20}
        color={() => cl.value}
        cx={() => translateX.value}
        cy={() => translateY.value}
      >
        <Paint
          style="stroke"
          strokeWidth={4}
          color={() => (isLight.value ? "black" : "white")}
        />
      </Circle>
    </Canvas>
  );
};
