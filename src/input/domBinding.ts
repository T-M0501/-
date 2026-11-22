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
  const toGame = (e: MouseEvent) => {
    const r = canvas.getBoundingClientRect();
    input.mouseMove(
      ((e.clientX - r.left) / r.width) * gameSize.width,
      ((e.clientY - r.top) / r.height) * gameSize.height,
    );
  };
  const onDown = (e: MouseEvent) => {
    toGame(e);
    input.mouseDown(e.button);
  };
  const onUp = (e: MouseEvent) => input.mouseUp(e.button);
  const onBlur = () => input.reset();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousemove', toGame);
  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mouseup', onUp);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    canvas.removeEventListener('mousemove', toGame);
    canvas.removeEventListener('mousedown', onDown);
    window.removeEventListener('mouseup', onUp);
  };
}
