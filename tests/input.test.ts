import { describe, expect, it } from 'vitest';
import { KeyboardMouseInput } from '../src/input/keyboardMouse';
import { InputManager } from '../src/input/inputManager';
import type { InputCommand, InputSource } from '../src/input/types';

const ctx = { playerX: 100, playerY: 100 };

describe('KeyboardMouseInput', () => {
  it('何も押さなければ空の命令', () => {
    const c = new KeyboardMouseInput().poll(ctx);
    expect(c).toEqual({ move: { x: 0, y: 0 }, aimAngle: null, firing: false, reload: false });
  });
  it('WASDで移動、斜めは正規化', () => {
    const i = new KeyboardMouseInput();
    i.keyDown('KeyD');
    expect(i.poll(ctx).move).toEqual({ x: 1, y: 0 });
    i.keyDown('KeyS');
    const m = i.poll(ctx).move;
    expect(Math.hypot(m.x, m.y)).toBeCloseTo(1);
    i.keyUp('KeyD');
    i.keyUp('KeyS');
    i.keyDown('KeyA');
    i.keyDown('KeyD');
    expect(i.poll(ctx).move.x).toBe(0);
  });
  it('マウス方向が照準角になる', () => {
    const i = new KeyboardMouseInput();
    i.mouseMove(100, 200);
    expect(i.poll(ctx).aimAngle).toBeCloseTo(Math.PI / 2);
    i.mouseMove(50, 100);
    expect(Math.abs(i.poll(ctx).aimAngle!)).toBeCloseTo(Math.PI);
  });
  it('左クリックの間だけ射撃、他ボタンは無視', () => {
    const i = new KeyboardMouseInput();
    i.mouseDown(2);
    expect(i.poll(ctx).firing).toBe(false);
    i.mouseDown(0);
    expect(i.poll(ctx).firing).toBe(true);
    expect(i.poll(ctx).firing).toBe(true);
    i.mouseUp(0);
    expect(i.poll(ctx).firing).toBe(false);
  });
  it('リロードは押した1回だけtrue（押しっぱなしで繰り返さない）', () => {
    const i = new KeyboardMouseInput();
    i.keyDown('KeyR');
    i.keyDown('KeyR');
    expect(i.poll(ctx).reload).toBe(true);
    expect(i.poll(ctx).reload).toBe(false);
    i.keyUp('KeyR');
    i.keyDown('KeyR');
    expect(i.poll(ctx).reload).toBe(true);
  });
  it('reset で押しっぱなしが解除される', () => {
    const i = new KeyboardMouseInput();
    i.keyDown('KeyW');
    i.mouseDown(0);
    i.reset();
    const c = i.poll(ctx);
    expect(c.move).toEqual({ x: 0, y: 0 });
    expect(c.firing).toBe(false);
  });
});

describe('InputManager', () => {
  const fake = (c: Partial<InputCommand>): InputSource => ({
    poll: () => ({ move: { x: 0, y: 0 }, aimAngle: null, firing: false, reload: false, ...c }),
  });
  it('入力元を合成する（移動は長さ1まで、射撃/リロードはOR、照準は後勝ち）', () => {
    const m = new InputManager([
      fake({ move: { x: 1, y: 0 }, aimAngle: 1 }),
      fake({ move: { x: 1, y: 0 }, aimAngle: 2, firing: true }),
      fake({ reload: true }),
    ]);
    const c = m.poll(ctx);
    expect(c.move).toEqual({ x: 1, y: 0 });
    expect(c.aimAngle).toBe(2);
    expect(c.firing).toBe(true);
    expect(c.reload).toBe(true);
  });
  it('入力元なしは空の命令', () => {
    expect(new InputManager().poll(ctx).aimAngle).toBeNull();
  });
});
