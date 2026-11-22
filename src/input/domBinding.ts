// ブラウザのイベントを KeyboardMouseInput につなぐ薄い層。戻り値の関数で解除できる。
import type { KeyboardMouseInput } from './keyboardMouse';

/**
 * @param canvas ゲームのcanvas
 * @param gameSize ゲーム内の画面サイズ（Scale.FITで拡縮されたcanvas上の位置をゲーム座標へ変換するため）
 * マウス座標はスクリーン座標。ワールド座標への変換は呼び出し側（シーン）の責任。
 */
export function bindKeyboardMouse(
  input: KeyboardMouseInput,
  canvas: HTMLCanvasElement,
  gameSize: { width: number; height: number },
): () => void {
  const onKeyDown = (e: KeyboardEvent) => input.keyDown(e.code);
  const onKeyUp = (e: KeyboardEvent) => input.keyUp(e.code);
  const toGame = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    input.mouseMove(
      ((e.clientX - r.left) / r.width) * gameSize.width,
      ((e.clientY - r.top) / r.height) * gameSize.height,
    );
  };
  // タッチ操作はTouchInput側で扱うので、ここではマウスだけを見る
  const onMove = (e: PointerEvent) => e.pointerType === 'mouse' && toGame(e);
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    toGame(e);
    input.mouseDown(e.button);
  };
  const onUp = (e: PointerEvent) => e.pointerType === 'mouse' && input.mouseUp(e.button);
  const onBlur = () => input.reset();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
  };
}
