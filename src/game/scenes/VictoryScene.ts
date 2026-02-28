/**
 * VictoryScene
 * Displayed when player wins
 */

import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/constants';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.VICTORY });
  }

  create(): void {
    console.log('🎉 VictoryScene');

    const { width, height } = this.cameras.main;

    // Get score from registry
    const currentScore = this.registry.get('currentScore') as number || 0;
    const highScore = this.registry.get('highScore') as number || 0;
    const isNewHighScore = currentScore >= highScore;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.TRACKSUIT_GREEN, 0.9);

    // Title
    const title = this.add.text(width / 2, height / 2 - 150, 'VICTORY!', {
      fontSize: '56px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Score
    const score = this.add.text(width / 2, height / 2 - 60, `Score: ${currentScore}`, {
      fontSize: '32px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    score.setOrigin(0.5);

    // High score indicator
    if (isNewHighScore && currentScore > 0) {
      const newHigh = this.add.text(width / 2, height / 2 - 20, '🏆 NEW HIGH SCORE!', {
        fontSize: '18px',
        color: '#FFD700',
        fontStyle: 'bold',
      });
      newHigh.setOrigin(0.5);

      // Pulse animation
      this.tweens.add({
        targets: newHigh,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else if (highScore > 0) {
      this.add.text(width / 2, height / 2 - 20, `High Score: ${highScore}`, {
        fontSize: '16px',
        color: '#FFFFFF',
      }).setOrigin(0.5);
    }

    // Buttons
    this.createButton(width / 2, height / 2 + 100, 'PLAY AGAIN', () => {
      this.scene.start(SCENES.GAME);
    });

    this.createButton(width / 2, height / 2 + 180, 'MENU', () => {
      this.scene.start(SCENES.MENU);
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const button = this.add.text(x, y, text, {
      fontSize: '20px',
      color: '#008C62',
      backgroundColor: '#FFFFFF',
      padding: { x: 30, y: 15 },
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setScale(1.1));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', callback);
  }
}
