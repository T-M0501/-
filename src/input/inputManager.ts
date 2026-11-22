// 複数の入力元を1つの InputCommand にまとめる。ゲーム側はこれだけを見る。
import { emptyCommand, type InputCommand, type InputSource, type PollContext } from './types';

export class InputManager {
  constructor(private sources: InputSource[] = []) {}

  addSource(source: InputSource): void {
    this.sources.push(source);
  }

  poll(ctx: PollContext): InputCommand {
    const out = emptyCommand();
    for (const s of this.sources) {
      const c = s.poll(ctx);
      out.move.x += c.move.x;
      out.move.y += c.move.y;
      if (c.aimAngle !== null) out.aimAngle = c.aimAngle; // 後ろの入力元を優先
      out.firing ||= c.firing;
      out.reload ||= c.reload;
    }
    const len = Math.hypot(out.move.x, out.move.y);
    if (len > 1) {
      out.move.x /= len;
      out.move.y /= len;
    }
    return out;
  }
}
