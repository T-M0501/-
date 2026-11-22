import { describe, expect, it } from 'vitest';
import { FloatingStick } from '../src/input/stick';
import { TouchInput } from '../src/input/touch';
import controls from '../data/controls.json';

const ctx = { playerX: 0, playerY: 0 };
const R = controls.touch.stickRadius;

describe('FloatingStick', () => {
  it('置いた場所が中心、倒した量は長さ1まで', () => {
    const s = new FloatingStick(100, 0.1);
    s.begin(1, 50, 50);
    s.move(1, 100, 50);
    expect(s.x).toBeCloseTo(0.5);
    s.move(1, 500, 50);
    expect(s.x).toBeCloseTo(1);
    expect(s.magnitude).toBeCloseTo(1);
  });
  it('デッドゾーン内は0、別の指は無視、離すと0', () => {
    const s = new FloatingStick(100, 0.2);
    s.begin(1, 0, 0);
    s.move(1, 10, 0);
    expect(s.magnitude).toBe(0);
    s.move(2, 100, 0);
    expect(s.magnitude).toBe(0);
    expect(s.begin(2, 0, 0)).toBe(false);
    s.move(1, 100, 0);
    s.end(1);
    expect(s.active).toBe(false);
    expect(s.magnitude).toBe(0);
  });
});

describe('TouchInput', () => {
  const left = { x: 200, y: 400 };
  const right = { x: 900, y: 400 };

  it('左半分で移動', () => {
    const t = new TouchInput();
    t.pointerDown(1, left.x, left.y);
    t.pointerMove(1, left.x + R, left.y);
    const c = t.poll(ctx);
    expect(c.move.x).toBeCloseTo(1);
    expect(c.firing).toBe(false);
    expect(c.aimAngle).toBeNull();
  });
  it('右側で照準、閾値以上倒すと射撃', () => {
    const t = new TouchInput();
    t.pointerDown(2, right.x, right.y);
    t.pointerMove(2, right.x, right.y + R * 0.3);
    let c = t.poll(ctx);
    expect(c.aimAngle).toBeCloseTo(Math.PI / 2);
    expect(c.firing).toBe(false);
    t.pointerMove(2, right.x, right.y + R * 0.9);
    c = t.poll(ctx);
    expect(c.firing).toBe(true);
    t.pointerUp(2);
    c = t.poll(ctx);
    expect(c.firing).toBe(false);
    expect(c.aimAngle).toBeNull();
  });
  it('リロードボタンは1回だけtrue、スティックにならない', () => {
    const t = new TouchInput();
    const b = controls.touch.reloadButton;
    t.pointerDown(3, b.x, b.y);
    expect(t.poll(ctx).reload).toBe(true);
    expect(t.poll(ctx).reload).toBe(false);
    expect(t.aimStick.active).toBe(false);
    t.pointerUp(3);
    expect(t.reloadHeld).toBe(false);
  });
  it('両手の同時操作と reset', () => {
    const t = new TouchInput();
    t.pointerDown(1, left.x, left.y);
    t.pointerDown(2, right.x, right.y);
    t.pointerMove(1, left.x, left.y - R);
    t.pointerMove(2, right.x + R, right.y);
    const c = t.poll(ctx);
    expect(c.move.y).toBeCloseTo(-1);
    expect(c.aimAngle).toBeCloseTo(0);
    expect(c.firing).toBe(true);
    t.reset();
    expect(t.poll(ctx).firing).toBe(false);
  });
});
