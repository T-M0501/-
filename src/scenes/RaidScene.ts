import Phaser from 'phaser';

export class RaidScene extends Phaser.Scene {
  constructor() {
    super('Raid');
  }

  create(): void {
    this.add.text(640, 300, 'レイド（空のシーン）', { fontSize: '36px', color: '#fff' }).setOrigin(0.5);
    const end = this.add
      .text(640, 400, '[ 終了 ]', { fontSize: '28px', color: '#f88' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    end.on('pointerdown', () => this.scene.start('Result'));
  }
}
