// フローティングスティック（指を置いた場所が中心になる）。純粋ロジック。
export class FloatingStick {
  private pointerId: number | null = null;
  originX = 0;
  originY = 0;
  /** 倒した向きと量（長さ0〜1。デッドゾーン内は0） */
  x = 0;
  y = 0;
  /** 画面表示用：指の現在位置 */
  knobX = 0;
  knobY = 0;

  constructor(
    private radius: number,
    private deadzone: number,
  ) {}

  get active(): boolean {
    return this.pointerId !== null;
  }

  get magnitude(): number {
    return Math.hypot(this.x, this.y);
  }

  owns(id: number): boolean {
    return this.pointerId === id;
  }

  begin(id: number, px: number, py: number): boolean {
    if (this.pointerId !== null) return false;
    this.pointerId = id;
    this.originX = this.knobX = px;
    this.originY = this.knobY = py;
    this.x = this.y = 0;
    return true;
  }

  move(id: number, px: number, py: number): void {
    if (this.pointerId !== id) return;
    let dx = (px - this.originX) / this.radius;
    let dy = (py - this.originY) / this.radius;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    this.knobX = this.originX + dx * this.radius;
    this.knobY = this.originY + dy * this.radius;
    if (Math.hypot(dx, dy) < this.deadzone) {
      this.x = this.y = 0;
    } else {
      this.x = dx;
      this.y = dy;
    }
  }

  end(id: number): void {
    if (this.pointerId !== id) return;
    this.reset();
  }

  reset(): void {
    this.pointerId = null;
    this.x = this.y = 0;
  }
}
