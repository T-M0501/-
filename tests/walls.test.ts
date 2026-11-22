import { describe, expect, it } from 'vitest';
import { moveCircle, pointInRects } from '../src/systems/collision/walls';

const wall = { x: 100, y: 0, w: 20, h: 200 };

describe('walls', () => {
  it('壁に向かうと止まる', () => {
    const p = moveCircle(80, 50, 30, 0, 10, [wall]);
    expect(p).toEqual({ x: 80, y: 50 });
  });
  it('壁沿いにはすべれる', () => {
    const p = moveCircle(85, 50, 30, 10, 10, [wall]);
    expect(p).toEqual({ x: 85, y: 60 });
  });
  it('自由な場所なら普通に動く', () => {
    expect(moveCircle(0, 0, 5, 5, 10, [wall])).toEqual({ x: 5, y: 5 });
  });
  it('点が矩形内か', () => {
    expect(pointInRects(110, 10, [wall])).toBe(true);
    expect(pointInRects(50, 10, [wall])).toBe(false);
  });
});
