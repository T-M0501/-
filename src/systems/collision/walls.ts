// 壁(矩形)との当たり判定。純粋ロジック。
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function circleHitsRect(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

export function pointInRects(px: number, py: number, rects: readonly Rect[]): boolean {
  return rects.some((q) => px >= q.x && px <= q.x + q.w && py >= q.y && py <= q.y + q.h);
}

/** 円を (dx,dy) 動かす。壁にぶつかる軸は止め、もう一方の軸は滑って動ける。 */
export function moveCircle(
  x: number,
  y: number,
  dx: number,
  dy: number,
  r: number,
  walls: readonly Rect[],
): { x: number; y: number } {
  let nx = x;
  let ny = y;
  if (!walls.some((w) => circleHitsRect(x + dx, y, r, w))) nx = x + dx;
  if (!walls.some((w) => circleHitsRect(nx, y + dy, r, w))) ny = y + dy;
  return { x: nx, y: ny };
}
