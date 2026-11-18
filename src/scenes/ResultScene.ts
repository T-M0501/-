import Phaser from 'phaser';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create(): void {
    this.add.text(640, 300, '結果（空のシーン）', { fontSize: '36px', color: '#fff' }).setOrigin(0.5);
    const back = this.add
      .text(640, 400, '[ 隠れ家に戻る ]', { fontSize: '28px', color: '#8cf' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('Hideout'));
  }
}
