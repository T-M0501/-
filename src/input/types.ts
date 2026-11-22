// ゲーム処理が受け取る共通の操作命令。入力元（タッチ／キーボード・マウス）は知らなくてよい。
// TODO(仕様未定): ダッシュ・漁る・インベントリ等は、タッチ操作の依頼で追加する。
export interface InputCommand {
  /** 移動ベクトル。長さ0〜1 */
  move: { x: number; y: number };
  /** 照準の向き(ラジアン)。null = 明示的な照準なし（移動方向を向く） */
  aimAngle: number | null;
  /** 射撃中か */
  firing: boolean;
  /** このフレームでリロードが押されたか（1回だけtrue） */
  reload: boolean;
}

/** 照準角の計算に使う、プレイヤーの位置（マウス座標と同じ座標系）。 */
export interface PollContext {
  playerX: number;
  playerY: number;
}

export interface InputSource {
  poll(ctx: PollContext): InputCommand;
}

export function emptyCommand(): InputCommand {
  return { move: { x: 0, y: 0 }, aimAngle: null, firing: false, reload: false };
}
