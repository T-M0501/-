import Phaser from 'phaser';

export class HideoutScene extends Phaser.Scene {
  constructor() {
    super('Hideout');
  }

  create(): void {
    this.add.text(640, 300, '隠れ家（メニュー）', { fontSize: '36px', color: '#fff' }).setOrigin(0.5);
    const go = this.add
      .text(640, 400, '[ 出撃 ]', { fontSize: '28px', color: '#8f8' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    go.on('pointerdown', () => this.scene.start('Raid'));
  }
}
