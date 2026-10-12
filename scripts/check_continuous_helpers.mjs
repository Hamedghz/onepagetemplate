import assert from "node:assert/strict";
import { clamp, wheelDistance } from "../src/useContinuousScenes.js";

const cases = [
  ["negative clamp", () => assert.equal(clamp(-10, 500), 0)],
  ["upper clamp", () => assert.equal(clamp(700, 500), 500)],
  ["fractional progress", () => assert.equal(clamp(205.5, 500), 205.5)],
  ["small vertical delta", () => assert.equal(wheelDistance({ deltaY: 2, deltaX: 0, deltaMode: 0 }, 1280), 2)],
  ["vertical reverse", () => assert.equal(wheelDistance({ deltaY: -100, deltaX: 0, deltaMode: 0 }, 1280), -100)],
  ["native RTL horizontal delta", () => assert.equal(wheelDistance({ deltaY: 0, deltaX: -100, deltaMode: 0 }, 1280), 100)],
  ["horizontal reverse", () => assert.equal(wheelDistance({ deltaY: 0, deltaX: 100, deltaMode: 0 }, 1280), -100)],
  ["dominant axis", () => assert.equal(wheelDistance({ deltaY: 20, deltaX: -90, deltaMode: 0 }, 1280), 90)],
  ["line delta", () => assert.equal(wheelDistance({ deltaY: 3, deltaX: 0, deltaMode: 1 }, 1280), 48)],
  ["page delta", () => assert.equal(wheelDistance({ deltaY: 1, deltaX: 0, deltaMode: 2 }, 1280), 1280)],
  ["no delta", () => assert.equal(wheelDistance({ deltaY: 0, deltaX: 0, deltaMode: 0 }, 1280), 0)],
];

for (const [name, check] of cases) {
  check();
  console.log(`PASS ${name}`);
}
console.log(`${cases.length}/${cases.length} continuous-scroll helper checks passed.`);
