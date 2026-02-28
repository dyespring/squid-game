/**
 * GameOverScene
 * Displayed when player is eliminated
 */

import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/constants';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME_OVER });
  }

  create(): void {
    console.log('💀 GameOverScene');

    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.GEOMETRIC_BLACK, 0.8);

    // Title
    const title = this.add.text(width / 2, height / 2 - 100, 'ELIMINATED', {
      fontSize: '48px',
      color: '#E63946',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Score (placeholder)
    const score = this.add.text(width / 2, height / 2, 'Score: 0', {
      fontSize: '24px',
      color: '#FFFFFF',
    });
    score.setOrigin(0.5);

    // Buttons
    this.createButton(width / 2, height / 2 + 100, 'TRY AGAIN', () => {
      this.scene.start(SCENES.GAME);
    });

    this.createButton(width / 2, height / 2 + 180, 'MENU', () => {
      this.scene.start(SCENES.MENU);
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const button = this.add.text(x, y, text, {
      fontSize: '20px',
      color: '#FFFFFF',
      backgroundColor: '#FF4581',
      padding: { x: 30, y: 15 },
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setScale(1.1));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', callback);
  }
}
