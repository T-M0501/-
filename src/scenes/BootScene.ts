import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    // TODO: アセットのプリロードはM1以降
    this.scene.start('Hideout');
  }
}
